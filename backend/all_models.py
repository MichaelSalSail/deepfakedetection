import cv2
import os, sys
import re
import statistics
import numpy as np
import math
from deepface import DeepFace
import torch
import torch.nn as nn
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import torchvision.models as models
from torchvision.transforms import Normalize
from tensorflow.keras.preprocessing.image import load_img
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.vgg16 import preprocess_input
from tensorflow.keras.applications.vgg16 import decode_predictions
from tensorflow.keras.applications.vgg16 import VGG16
from helper_functions import isotropically_resize_image, make_square_image, more_tests, save_crop,\
                             eyeblink_csv

BLINK_TEMP_DIR = os.path.join("current_upload", "temp")
BLINK_TEMP_FILES = (
    "face_detected.png",
    "face_tight_crop.png",
    "subject_reference.png",
)
GENDER_CONFIDENCE_MARGIN = 20
DEEPFACE_INPUT_SIZE = (152, 152)

PREDICT_TEMPLATE = "????? (0.0%)\n????? (0.0%)\n????? (0.0%)\n????? (0.0%)\n????? (0.0%)"
_TOP5_LABEL_RE = re.compile(r"^([a-zA-Z0-9_]+) \([\d.]+%\)", re.MULTILINE)
# ImageNet has only these eyewear classes in VGG16 decode_predictions output.
EYEWEAR_IMAGENET_LABELS = frozenset({"sunglasses", "sunglass"})
DEFAULT_AGE_GENDER_RESULT = {
    "age": 0,
    "gender": "??",
    "raw_output": "   Age: ??\nGender: ??\n",
}
DEFAULT_SHADES_RESULT = {
    "raw_output": (
        "SUBJECT_REFERENCE\nTop 5 Object Detection Predictions\n"
        + PREDICT_TEMPLATE + "\n\nFACE_TIGHT_CROP\nTop 5 Object Detection Predictions\n"
        + PREDICT_TEMPLATE
    ),
    "shades": False,
}


def _normalize_gender(gender_value):
    if isinstance(gender_value, dict):
        if gender_value.get("Man", 0) >= gender_value.get("Woman", 0):
            return "Man"
        return "Woman"
    gender_text = str(gender_value)
    if "Man" in gender_text:
        return "Man"
    if "Woman" in gender_text:
        return "Woman"
    return "??"


def _age_gender_result(age, gender, raw_output):
    return {
        "age": int(age),
        "gender": gender,
        "raw_output": raw_output,
    }


def _gender_scores(gender_value):
    if isinstance(gender_value, dict):
        return float(gender_value.get("Man", 0)), float(gender_value.get("Woman", 0))
    gender_text = str(gender_value)
    if "Man" in gender_text:
        return 100.0, 0.0
    if "Woman" in gender_text:
        return 0.0, 100.0
    return None, None


def _deepface_analyze_still(image_path):
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not read image: " + image_path)

    resized = cv2.resize(img, DEEPFACE_INPUT_SIZE)
    scratch_path = os.path.join(
        os.path.dirname(image_path),
        "_deepface_" + os.path.basename(image_path),
    )
    cv2.imwrite(scratch_path, resized)

    obj = DeepFace.analyze(
        img_path=scratch_path,
        actions=['age', 'gender'],
        enforce_detection=False,
    )
    return obj[0] if isinstance(obj, list) else obj


def _analyze_age_gender_image(label, image_path):
    if not os.path.exists(image_path):
        return {
            "label": label,
            "ok": False,
            "missing": True,
            "section": label + "\n   (file not found)\n\n",
        }

    try:
        obj = _deepface_analyze_still(image_path)
        man, woman = _gender_scores(obj["gender"])
        margin = abs(man - woman) if man is not None else 0.0
        if man is None:
            gender_line = "Gender: " + str(obj["gender"])
        else:
            gender_line = (
                "Gender: Man: {:.1f}%, Woman: {:.1f}% (margin: {:.1f})".format(
                    man, woman, margin
                )
            )
        section = (
            label + "\n"
            + "   Age: " + str(int(obj["age"])) + "\n"
            + "   " + gender_line + "\n\n"
        )
        return {
            "label": label,
            "ok": True,
            "missing": False,
            "section": section,
            "age": int(obj["age"]),
            "gender_raw": obj["gender"],
            "man": man,
            "woman": woman,
            "margin": margin,
        }
    except Exception as e:
        return {
            "label": label,
            "ok": False,
            "missing": False,
            "section": label + "\n   Error: " + str(e) + "\n\n",
        }


def _aggregate_age_gender_analyses(analyses):
    successful = [item for item in analyses if item.get("ok")]
    high_confidence = [
        item for item in successful
        if item.get("man") is not None
        and item.get("margin", 0) > GENDER_CONFIDENCE_MARGIN
    ]

    if high_confidence:
        avg_man = statistics.mean(item["man"] for item in high_confidence)
        avg_woman = statistics.mean(item["woman"] for item in high_confidence)
        gender = "Man" if avg_man >= avg_woman else "Woman"
        age = int(round(statistics.median(item["age"] for item in high_confidence)))
        source_note = (
            "Gender from {} high-confidence image(s) "
            "(margin > {}%)".format(len(high_confidence), GENDER_CONFIDENCE_MARGIN)
        )
    else:
        subject = next(
            (item for item in analyses if item.get("label") == "SUBJECT_REFERENCE" and item.get("ok")),
            None,
        )
        if subject is None:
            successful_ages = [item["age"] for item in successful]
            age = int(round(statistics.median(successful_ages))) if successful_ages else 0
            gender = "??"
            source_note = (
                "Gender unavailable (no image met margin threshold; "
                "subject_reference missing or failed)"
            )
        else:
            gender = _normalize_gender(subject["gender_raw"])
            age = subject["age"]
            source_note = (
                "Gender from subject_reference fallback "
                "(no image met margin threshold of {}%)".format(GENDER_CONFIDENCE_MARGIN)
            )

    aggregate_section = (
        "AGGREGATE\n"
        + "   Age: " + str(age) + "\n"
        + "   Gender: " + gender + "\n"
        + "   " + source_note + "\n"
    )
    return age, gender, aggregate_section


def _dfd_verdict(score):
    if score == 0 or score == 50:
        return "?"
    if score < 48:
        return "Likely Authentic"
    if score <= 68:
        return "Uncertain"
    return "Likely deepfake"


def _print_dfd_score(score):
    print(str(score) + "%")
    print("verdict: " + _dfd_verdict(score))


def _blink_result(missing, unknown, open_pct, closed):
    return {
        "closed": closed,
        "missing": missing,
        "open": open_pct,
        "unknown": unknown,
    }


def _percent_of(count, total):
    if total == 0:
        return 0.0
    return round((count / total) * 100, 2)


def _blink_frame_timestamp(frame_index, total_frames, total_seconds):
    if total_frames <= 1:
        return 0.0
    return round(frame_index * (total_seconds / (total_frames - 1)), 2)


def _print_blink_frame_log(frame_index, total_frames, total_seconds, label, score=None):
    frame_num = frame_index + 1
    timestamp = _blink_frame_timestamp(frame_index, total_frames, total_seconds)
    score_str = "N/A" if score is None else f"{score:.2f}"
    print(
        f"frame {frame_num:03d}/{total_frames}  "
        f"t={timestamp:.2f}s  score={score_str}  {label}"
    )


def _top5_prediction_lines(image_path):
    image = load_img(image_path, target_size=(224, 224))
    image = img_to_array(image)
    image = image.reshape((1, image.shape[0], image.shape[1], image.shape[2]))
    image = preprocess_input(image)
    model = VGG16()
    yhat = model.predict(image, verbose=0)
    label = decode_predictions(yhat)
    lines = []
    for i in range(5):
        lines.append('%s (%.2f%%)\n' % (label[0][i][1], label[0][i][2] * 100))
    return lines


def _vgg16_raw_output_indicates_eyewear(raw_output):
    '''
    True when any VGG16 top-5 line uses an ImageNet eyewear label.

    ImageNet exposes only sunglass (n04355933) and sunglasses (n04356056).
    Checking "sunglasses" alone misses top-5 rows that list only "sunglass".
    '''
    return any(
        label in EYEWEAR_IMAGENET_LABELS
        for label in _TOP5_LABEL_RE.findall(raw_output)
    )


def predict_on_video(video_path, fps, device, facedet):
    '''
    Score a video for deepfake probability.

    Returns:
        {"DFD": float} — percentage score; 50.0 on error.
    '''

    print('\npredict_on_video()')

    cwd = os.getcwd()
    sys.path.insert(0, cwd + "/imports/inference")

    from helpers.read_video_1 import VideoReader
    from helpers.face_extract_1 import FaceExtractor

    video_data = cv2.VideoCapture(video_path)
    total_seconds = round(
        (video_data.get(cv2.CAP_PROP_FRAME_COUNT)) / (video_data.get(cv2.CAP_PROP_FPS)), 2)
    total_frames = math.floor(fps * total_seconds)

    try:
        video_reader = VideoReader()
        frames_per_video = total_frames
        video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)
        face_extractor = FaceExtractor(video_read_fn, facedet)
        faces = face_extractor.process_video(video_path)
        face_extractor.keep_only_best_face(faces)

        input_size = 224
        mean = [0.43216, 0.394666, 0.37645]
        std = [0.22803, 0.22145, 0.216989]
        normalize_transform = Normalize(mean, std)

        class MyResNeXt(models.resnet.ResNet):
            def __init__(self, training=True):
                super(MyResNeXt, self).__init__(block=models.resnet.Bottleneck,
                                                layers=[3, 4, 6, 3],
                                                groups=32,
                                                width_per_group=4)
                self.fc = nn.Linear(2048, 1)

        checkpoint = torch.load(cwd + "/imports/inference/resnext.pth", map_location=device)
        model = MyResNeXt().to(device)
        model.load_state_dict(checkpoint)
        _ = model.eval()
        del checkpoint

        if len(faces) > 0:
            x = np.zeros((total_frames, input_size, input_size, 3), dtype=np.uint8)
            n = 0
            for frame_data in faces:
                for face in frame_data["faces"]:
                    resized_face = isotropically_resize_image(face, input_size)
                    resized_face = make_square_image(resized_face)
                    if n < total_frames:
                        x[n] = resized_face
                        n += 1
            if n > total_frames:
                print("WARNING: have " + str(n) + " faces but batch size is " + str(total_frames))

            if n > 0:
                x = torch.tensor(x, device=device).float()
                x = x.permute((0, 3, 1, 2))

                for i in range(len(x)):
                    x[i] = normalize_transform(x[i] / 255.)
                with torch.no_grad():
                    y_pred = model(x)
                    y_pred = torch.sigmoid(y_pred.squeeze())
                    data_res = y_pred[:n].mean().item()
                    score = round(data_res * 100, 2)
                    _print_dfd_score(score)
                    return {"DFD": score}

    except Exception as e:
        print("Prediction error on video " + str(video_path) + ": " + str(e) + "\n")

    _print_dfd_score(50.0)
    return {"DFD": 50.0}


def blink_on_video(video_path, fps, facedet, use_model):
    '''
    Classify eye-open/closed state per sampled video frame.

    Returns:
        {"closed", "missing", "open", "unknown"} percentage dict.
    '''

    print('\nblink_on_video()')

    cwd = os.getcwd()
    sys.path.insert(0, cwd + "/imports/inference")

    from helpers.read_video_1 import VideoReader
    from helpers.face_extract_1 import FaceExtractor

    for filename in BLINK_TEMP_FILES:
        path = os.path.join(BLINK_TEMP_DIR, filename)
        if os.path.isfile(path):
            os.remove(path)

    video_data = cv2.VideoCapture(video_path)
    total_seconds = round(
        (video_data.get(cv2.CAP_PROP_FRAME_COUNT)) / (video_data.get(cv2.CAP_PROP_FPS)), 2)
    total_frames = math.floor(fps * total_seconds)

    all_open, all_closed, all_unknown, all_missing = 0, 0, 0, 0
    classifications = []

    try:
        video_reader = VideoReader()
        frames_per_video = total_frames
        video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)
        face_extractor = FaceExtractor(video_read_fn, facedet)
        faces = face_extractor.process_video(video_path)
        face_extractor.keep_only_best_face(faces)

        if len(faces) != total_frames:
            unprocessed = total_frames - len(faces)
            unprocessed_pct = round((unprocessed / total_frames) * 100, 2) if total_frames else 0.0
            print(
                f"blink_on_video() warning: only {len(faces)}/{total_frames} sampled frames "
                f"were returned by face extraction ({unprocessed} not processed, "
                f"{unprocessed_pct}% of expected samples). "
                f"Missing counts may include those slots."
            )

        input_size = 224
        file_name_save_subject_reference = 'current_upload/temp/subject_reference.png'
        subject_reference_first_face_saved = False
        subject_reference_open_locked = False
        subject_reference_closed_provisional = False

        if len(faces) > 0:
            for frame_index, frame_data in enumerate(faces):
                if len(frame_data["faces"]) == 0:
                    all_missing += 1
                    _print_blink_frame_log(frame_index, total_frames, total_seconds, "missing")
                    continue

                for face in frame_data["faces"]:
                    resized_face = isotropically_resize_image(face, input_size)
                    resized_face = make_square_image(resized_face)
                    plt.imshow(resized_face, interpolation='nearest')
                    file_name_save_detected = 'current_upload/temp/face_detected.png'
                    plt.savefig(file_name_save_detected)
                    plt.axis('off')
                    if not subject_reference_first_face_saved:
                        plt.savefig(file_name_save_subject_reference, bbox_inches='tight', pad_inches=0)
                        subject_reference_first_face_saved = True
                    read_detected = cv2.imread(file_name_save_detected)
                    dimensions = (432, 288)
                    resized = cv2.resize(read_detected, dimensions)
                    cv2.imwrite(file_name_save_detected, resized)
                    crop_result = save_crop('face_detected.png', 'face_tight_crop.png', 'current_upload/temp/')
                    if crop_result is False:
                        all_unknown += 1
                        classifications.append(-1)
                        _print_blink_frame_log(frame_index, total_frames, total_seconds, "unknown")
                    else:
                        current, blink_score = more_tests(use_model, 'current_upload/temp')
                        if current == 1:
                            all_open += 1
                            classifications.append(1)
                            if not subject_reference_open_locked:
                                plt.savefig(file_name_save_subject_reference, bbox_inches='tight', pad_inches=0)
                                subject_reference_open_locked = True
                                subject_reference_closed_provisional = False
                            _print_blink_frame_log(
                                frame_index, total_frames, total_seconds, "open", blink_score)
                        else:
                            all_closed += 1
                            classifications.append(0)
                            if (not subject_reference_open_locked and not subject_reference_closed_provisional):
                                plt.savefig(file_name_save_subject_reference, bbox_inches='tight', pad_inches=0)
                                subject_reference_closed_provisional = True
                            _print_blink_frame_log(
                                frame_index, total_frames, total_seconds, "closed", blink_score)
                    plt.clf()

        eyeblink_csv(total_frames, classifications, total_seconds,
                     "AllResults/eyeblink_data.csv")
    except Exception as e:
        print("Prediction error on video " + str(video_path) + ": " + str(e) + "\n")
        eyeblink_csv(total_frames, list(), total_seconds, "AllResults/eyeblink_data.csv")
        result = _blink_result(0.0, 0.0, 0.0, 0.0)
        print(result)
        return result

    if (all_open + all_closed + all_unknown) < total_frames:
        all_missing = total_frames - (all_open + all_closed + all_unknown)

    print("all_missing:", all_missing)

    total = all_open + all_closed + all_unknown + all_missing
    result = _blink_result(
        _percent_of(all_missing, total),
        _percent_of(all_unknown, total),
        _percent_of(all_open, total),
        _percent_of(all_closed, total),
    )
    print(result)
    return result


def detect_age_gender(subject_reference_path, face_tight_crop_path, face_detected_path):
    '''
    Predict age and gender from subject_reference, face_tight_crop, and face_detected.

    Gender uses high-confidence images only (|Man - Woman| > GENDER_CONFIDENCE_MARGIN).
    Falls back to subject_reference when none qualify. Age is the median across the
    images used for the gender decision.

    Returns:
        {"age", "gender", "raw_output"} dict.
    '''

    print('\ndetect_age_gender()')

    image_sources = (
        ("SUBJECT_REFERENCE", subject_reference_path),
        ("FACE_TIGHT_CROP", face_tight_crop_path),
        ("FACE_DETECTED", face_detected_path),
    )

    try:
        analyses = [_analyze_age_gender_image(label, path) for label, path in image_sources]
        raw_output = ''.join(item["section"] for item in analyses)

        if not any(item.get("ok") for item in analyses):
            print(raw_output)
            print(DEFAULT_AGE_GENDER_RESULT["raw_output"])
            return dict(DEFAULT_AGE_GENDER_RESULT)

        age, gender, aggregate_section = _aggregate_age_gender_analyses(analyses)
        raw_output += aggregate_section
        result = _age_gender_result(age, gender, raw_output)
        print(raw_output)
        return result
    except Exception as e:
        print("Error:" + str(e) + "\n")
        print(DEFAULT_AGE_GENDER_RESULT["raw_output"])
        return dict(DEFAULT_AGE_GENDER_RESULT)


def detect_shades(image_dir1, image_dir2=""):
    '''
    Detect eyewear from subject_reference and face_tight_crop images.

    Returns:
        {"shades", "raw_output"} dict.
    '''

    print('\ndetect_shades()')

    result = list()

    try:
        if os.path.exists(image_dir1):
            result.append('SUBJECT_REFERENCE\nTop 5 Object Detection Predictions\n')
            result.extend(_top5_prediction_lines(image_dir1))
        else:
            result.append('SUBJECT_REFERENCE (file not found)\nTop 5 Object Detection Predictions\n')
            result.append(PREDICT_TEMPLATE + '\n')

        if image_dir2 != "":
            if os.path.exists(image_dir2):
                result.append('\nFACE_TIGHT_CROP\nTop 5 Object Detection Predictions\n')
                result.extend(_top5_prediction_lines(image_dir2))
            else:
                result.append("\nFACE_TIGHT_CROP (file not found)\nTop 5 Object Detection Predictions\n")
                result.append(PREDICT_TEMPLATE)
        else:
            result.append("\nFACE_TIGHT_CROP (file argument missing)\nTop 5 Object Detection Predictions\n")
            result.append(PREDICT_TEMPLATE)
    except Exception as e:
        print("Error:" + str(e) + "\n")
        shades_result = dict(DEFAULT_SHADES_RESULT)
        print(shades_result["raw_output"])
        return shades_result

    raw_output = ''.join(result)
    shades_result = {
        "raw_output": raw_output,
        "shades": _vgg16_raw_output_indicates_eyewear(raw_output),
    }
    print(raw_output)
    return shades_result
