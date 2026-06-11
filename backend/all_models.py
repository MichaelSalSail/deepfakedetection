import cv2
import os, sys
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

PREDICT_TEMPLATE = "????? (0.0%)\n????? (0.0%)\n????? (0.0%)\n????? (0.0%)\n????? (0.0%)"
DEFAULT_BEARD_RESULT = {
    "age": 0,
    "beard": False,
    "gender": "??",
    "raw_output": "   Age: ??\nGender: ??\n",
}
DEFAULT_SHADES_RESULT = {
    "raw_output": (
        "ORIGINAL\nTop 5 Object Detection Predictions\n"
        + PREDICT_TEMPLATE + "\n\nCROPPED\nTop 5 Object Detection Predictions\n"
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


def _beard_result(age, gender_value):
    gender = _normalize_gender(gender_value)
    raw_output = "   Age: " + str(age) + "\nGender: " + str(gender_value) + "\n"
    return {
        "age": int(age),
        "beard": int(age) >= 20 and gender == "Man",
        "gender": gender,
        "raw_output": raw_output,
    }


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


def _top5_prediction_lines(image_path):
    image = load_img(image_path, target_size=(224, 224))
    image = img_to_array(image)
    image = image.reshape((1, image.shape[0], image.shape[1], image.shape[2]))
    image = preprocess_input(image)
    model = VGG16()
    yhat = model.predict(image)
    label = decode_predictions(yhat)
    lines = []
    for i in range(5):
        lines.append('%s (%.2f%%)\n' % (label[0][i][1], label[0][i][2] * 100))
    return lines


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
                    print(str(score) + "%")
                    return {"DFD": score}

    except Exception as e:
        print("Prediction error on video " + str(video_path) + ": " + str(e) + "\n")

    print("50.0%")
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

        input_size = 224
        file_name_save_subject_reference = 'current_upload/temp/subject_reference.png'
        subject_reference_first_face_saved = False
        subject_reference_open_locked = False
        subject_reference_closed_provisional = False

        if len(faces) > 0:
            for frame_data in faces:
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
                        print("all_unknown:", all_unknown)
                    else:
                        current = more_tests(use_model, 'current_upload/temp')
                        if current == 1:
                            all_open += 1
                            classifications.append(1)
                            if not subject_reference_open_locked:
                                plt.savefig(file_name_save_subject_reference, bbox_inches='tight', pad_inches=0)
                                subject_reference_open_locked = True
                                subject_reference_closed_provisional = False
                            print("all_open:", all_open)
                        else:
                            all_closed += 1
                            classifications.append(0)
                            if (not subject_reference_open_locked and not subject_reference_closed_provisional):
                                plt.savefig(file_name_save_subject_reference, bbox_inches='tight', pad_inches=0)
                                subject_reference_closed_provisional = True
                            print("all_closed:", all_closed)
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

    total = all_open + all_closed + all_unknown + all_missing
    result = _blink_result(
        _percent_of(all_missing, total),
        _percent_of(all_unknown, total),
        _percent_of(all_open, total),
        _percent_of(all_closed, total),
    )
    print(result)
    return result


def detect_beard(image_dir):
    '''
    Predict age and gender from a still face image.

    Returns:
        {"age", "gender", "beard", "raw_output"} dict.
    '''

    print('\ndetect_beard()')

    if not os.path.exists(image_dir):
        print(DEFAULT_BEARD_RESULT["raw_output"])
        return dict(DEFAULT_BEARD_RESULT)

    try:
        img2 = cv2.imread(image_dir)
        dimensions = (152, 152)
        resized = cv2.resize(img2, dimensions)
        cwd = os.getcwd()
        img2_path = cwd + "/current_upload/temp/subject_reference.png"
        cv2.imwrite(img2_path, resized)

        obj = DeepFace.analyze(img_path=img2_path,
                               actions=['age', 'gender'],
                               enforce_detection=False)
        obj = obj[0] if isinstance(obj, list) else obj
        result = _beard_result(obj["age"], obj["gender"])
        print(result["raw_output"])
        return result
    except Exception as e:
        print("Error:" + str(e) + "\n")
        print(DEFAULT_BEARD_RESULT["raw_output"])
        return dict(DEFAULT_BEARD_RESULT)


def detect_shades(image_dir1, image_dir2=""):
    '''
    Detect eyewear from original and cropped face images.

    Returns:
        {"shades", "raw_output"} dict.
    '''

    print('\ndetect_shades()')

    result = list()

    try:
        if os.path.exists(image_dir1):
            result.append('ORIGINAL\nTop 5 Object Detection Predictions\n')
            result.extend(_top5_prediction_lines(image_dir1))
        else:
            result.append('ORIGINAL (file DNE)\nTop 5 Object Detection Predictions\n')
            result.append(PREDICT_TEMPLATE + '\n')

        if image_dir2 != "":
            if os.path.exists(image_dir2):
                result.append('\nCROPPED\nTop 5 Object Detection Predictions\n')
                result.extend(_top5_prediction_lines(image_dir2))
            else:
                result.append("\nCROPPED (file DNE)\nTop 5 Object Detection Predictions\n")
                result.append(PREDICT_TEMPLATE)
        else:
            result.append("\nCROPPED (file argument missing)\nTop 5 Object Detection Predictions\n")
            result.append(PREDICT_TEMPLATE)
    except Exception as e:
        print("Error:" + str(e) + "\n")
        shades_result = dict(DEFAULT_SHADES_RESULT)
        print(shades_result["raw_output"])
        return shades_result

    raw_output = ''.join(result)
    shades_result = {
        "raw_output": raw_output,
        "shades": "sunglasses" in raw_output,
    }
    print(raw_output)
    return shades_result
