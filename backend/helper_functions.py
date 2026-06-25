import cv2
import json
import math
import os
import numpy as np
import pandas as pd
import face_recognition
from PIL import Image
from tensorflow.keras.preprocessing.image import load_img
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.vgg16 import preprocess_input
from tensorflow.keras.applications.vgg16 import VGG16
from tensorflow.keras.optimizers import RMSprop
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense
from tensorflow.keras.layers import Flatten

def isotropically_resize_image(img, size=224, resample=cv2.INTER_AREA):
    '''
    Resize the image.
    
    Args:
        img: image.
        size: scale dimension of image.
    
    Returns:
        Rescaled image by size.
    '''
    h, w = img.shape[:2]
    if w > h:
        h = h * size // w
        w = size
    else:
        w = w * size // h
        h = size

    resized = cv2.resize(img, (w, h), interpolation=resample)
    return resized

def make_square_image(img):
    '''
    Resize the image with black space to get a square.
    
    Args:
        img: image.
    
    Returns:
        an image with equal dimensions.
    '''
    h, w = img.shape[:2]
    size = max(h, w)
    t = 0
    b = size - h
    l = 0
    r = size - w
    return cv2.copyMakeBorder(img, t, b, l, r, cv2.BORDER_CONSTANT, value=0)

def save_frame(video_path, output_dir=""):
    '''
    Saves the first frame of the video in the output_dir.
    
    Args:
        video_path: path of the video including the video name.
        output_dir: path to save the frame, optional parameter.
    
    Returns:
        full directory of the saved image.
    '''
    # creating a video capture object
    video_object = cv2.VideoCapture(video_path)

    # get the first frame of the video
    ret,frame = video_object.read()

    # save
    result=output_dir+"/"+"test_shades.png"
    cv2.imwrite(result, frame)
    return result

def images_ready(all_imgs,folder_name):
    '''
    Convert the images to proper format to run predictions
    on a model.
    
    Args:
        all_imgs: names of all images in a directory.
        folder_dir: directory of all_imgs.
        
    Returns:
        List of images in array format.
    '''
    result=[]
    for i in all_imgs:
        # load an image from file
        get_file=folder_name+str(i)
        image = load_img(get_file, target_size=(224, 224))
        # convert the image pixels to a numpy array
        image = img_to_array(image)
        # reshape data for the model
        image = image.reshape((1, image.shape[0], image.shape[1], image.shape[2]))
        # prepare the image for the VGG model
        image = preprocess_input(image)
        result.append(image)
    return result

def more_tests(model, folder_dir):
    '''
    Runs a prediction on model.
    
    Args:
        model: transfer learn VGG16 model.
        folder_dir: directory of .png files.
        
    Returns:
        (label, score) where label is 1 (open) or 0 (closed), and score is the
        raw sigmoid output in [0, 1].
    '''
    fast_blink_names = ["face_tight_crop.png"]
    fast_blink_names=np.array(fast_blink_names)
    fast_blink_names=images_ready(fast_blink_names, folder_dir+"/")
    regular_3=np.array(fast_blink_names)
    good_shape_3=np.squeeze(regular_3, axis=0)
    result_vgg16_2 = model.predict(good_shape_3, verbose=0)
    score = float(result_vgg16_2[0])
    label = 1 if score > 0.5 else 0
    return label, score

def get_model():
    '''
    Creates a model using VGG16.
    
    Args:
        None
        
    Returns:
        VGG16 model for binary classification. Upper layers
        are frozen for transfer learning.
    '''
    model = VGG16(include_top=False, input_shape=(224, 224, 3))
    # don't train upper layers
    for layer in model.layers:
        layer.trainable = False
    # add new classifier layers
    flat1 = Flatten()(model.layers[-1].output)
    class1 = Dense(1024, activation='relu')(flat1)
    output = Dense(1, activation='sigmoid')(class1)
    # define new model
    model = Model(inputs=model.inputs, outputs=output)
    model.compile(loss='binary_crossentropy',optimizer=RMSprop(learning_rate=0.0001),metrics=['accuracy'])
    model.load_weights("data/Weights/all_weights_eyeblink.ckpt")
    return model

def save_crop(input_image, file_name, destination):
    '''
    Crop an image to only contain a persons face.
    
    Args:
        input_image: name of the file to be cropped.
        file_name: name of the new cropped image.
        destination: directory in which pictures are located.
        
    Returns:
        Boolean. Was the image successfully cropped?
    '''
    full_1=destination+file_name
    full_2=destination+input_image
    load_image=face_recognition.load_image_file(full_2)
    locations = face_recognition.face_locations(load_image)
    if(locations==[]):
        return False
    for x in locations:
        top, right, bottom, left = x
        face_image = load_image[top:bottom, left:right]
        pil_image = Image.fromarray(face_image)
        pil_image.save(full_1)
    return True

def _blink_frame_timestamp(source_frame_idx, native_fps):
    if native_fps <= 0:
        return 0.0
    return round(source_frame_idx / native_fps, 2)


def _blink_sample_frame_indices(frame_count, num_frames):
    if frame_count <= 0 or num_frames <= 0:
        return None
    return np.linspace(0, frame_count - 1, num_frames, endpoint=True, dtype=int)


EYEBLINK_CSV_COLUMNS = [
    "frame_num",
    "total_frames",
    "timestamp_s",
    "score",
    "label",
    "classification",
]

BLINK_LABEL_TO_CLASSIFICATION = {
    "missing": -2,
    "unknown": -1,
    "closed": 1,
    "open": 2,
}

BLINK_CORE_TARGET = 2
BLINK_IDEAL_PHASE_RANGE = (2, 3)
TIER_PERFECT_NATURAL = 1.00
TIER_GOOD_NATURAL = 0.92
TIER_CONSECUTIVE = 1.00
TIER_EXTRACTED = 0.85


def eyeblink_csv(frame_rows, output_path, total_frames=None,
                 native_fps=None, sample_frame_indices=None):
    '''
    Saves per-frame blink logs from blink_on_video() in .csv format.

    Args:
        frame_rows: list of dicts with keys frame_num, total_frames,
                    timestamp_s, score, label, classification.
        output_path: path to save the .csv
        total_frames: used on error path when frame_rows is empty
        native_fps: used on error path when frame_rows is empty
        sample_frame_indices: native frame indices per sample; used on error path

    Returns:
        Nothing
    '''
    if frame_rows:
        blinks_df = pd.DataFrame(frame_rows, columns=EYEBLINK_CSV_COLUMNS)
    elif total_frames and total_frames > 0:
        rows = []
        fps = native_fps or 0
        for frame_index in range(total_frames):
            if sample_frame_indices is not None:
                source_idx = int(sample_frame_indices[frame_index])
            else:
                source_idx = frame_index
            rows.append({
                "frame_num": frame_index + 1,
                "total_frames": total_frames,
                "timestamp_s": _blink_frame_timestamp(source_idx, fps),
                "score": math.nan,
                "label": "missing",
                "classification": BLINK_LABEL_TO_CLASSIFICATION["missing"],
            })
        blinks_df = pd.DataFrame(rows, columns=EYEBLINK_CSV_COLUMNS)
    else:
        blinks_df = pd.DataFrame(columns=EYEBLINK_CSV_COLUMNS)

    blinks_df.to_csv(output_path, index=False)


def _compress_blink_label_runs(frame_rows):
    runs = []
    current = None
    for row in frame_rows:
        label = row["label"]
        if label not in ("open", "closed"):
            current = None
            continue
        if current is not None and current["label"] == label:
            current["count"] += 1
            current["end_frame_num"] = row["frame_num"]
            current["end_timestamp_s"] = row["timestamp_s"]
            continue
        current = {
            "label": label,
            "count": 1,
            "start_frame_num": row["frame_num"],
            "end_frame_num": row["frame_num"],
            "start_timestamp_s": row["timestamp_s"],
            "end_timestamp_s": row["timestamp_s"],
        }
        runs.append(current)
    return runs


def find_blink_instances(frame_rows):
    runs = _compress_blink_label_runs(frame_rows)
    instances = []
    i = 0
    while i <= len(runs) - 3:
        pre_open, closed, post_open = runs[i], runs[i + 1], runs[i + 2]
        if (
            pre_open["label"] == "open"
            and closed["label"] == "closed"
            and post_open["label"] == "open"
        ):
            start_ts = pre_open["start_timestamp_s"]
            end_ts = post_open["end_timestamp_s"]
            instances.append({
                "index": len(instances) + 1,
                "open_count": pre_open["count"],
                "closed_count": closed["count"],
                "post_open_count": post_open["count"],
                "start_timestamp_s": start_ts,
                "end_timestamp_s": end_ts,
                "duration_s": round(end_ts - start_ts, 2),
                "start_frame_num": pre_open["start_frame_num"],
                "end_frame_num": post_open["end_frame_num"],
            })
            i += 2
        else:
            i += 1
    return instances


def _evenly_spaced_indices(n, k=2):
    if n <= k:
        return list(range(n))
    return [round(i * (n - 1) / (k - 1)) for i in range(k)]


def _has_consecutive_boundary_core(pre, closed, post):
    return pre >= 2 and closed >= 2 and closed <= 3 and post >= 2


def _extract_core_counts(pre, closed, post):
    if pre == 1 or closed == 1 or post == 1:
        return min(pre, 2), min(closed, 2), min(post, 2), "partial"

    if pre <= 3 and closed <= 3 and post <= 3:
        return pre, closed, post, "natural"

    if _has_consecutive_boundary_core(pre, closed, post):
        return BLINK_CORE_TARGET, BLINK_CORE_TARGET, BLINK_CORE_TARGET, "consecutive"

    return BLINK_CORE_TARGET, BLINK_CORE_TARGET, BLINK_CORE_TARGET, "extracted"


def _phase_adequacy(count):
    if count == 1:
        return 0.25
    if count in BLINK_IDEAL_PHASE_RANGE:
        return 1.0
    return 1.0


def _balance_score(open_count, closed_count, post_open_count):
    counts = (open_count, closed_count, post_open_count)
    max_count = max(counts)
    min_count = min(counts)
    return 1.0 - (max_count - min_count) / max(max_count, 1)


def _tier_multiplier(method, open_count, closed_count, post_open_count):
    if method == "partial":
        return 1.0
    if method == "natural":
        if open_count == 2 and closed_count == 2 and post_open_count == 2:
            return TIER_PERFECT_NATURAL
        return TIER_GOOD_NATURAL
    if (
        method == "consecutive"
        and open_count == BLINK_CORE_TARGET
        and closed_count == BLINK_CORE_TARGET
        and post_open_count == BLINK_CORE_TARGET
    ):
        return TIER_CONSECUTIVE
    if (
        method == "extracted"
        and open_count == BLINK_CORE_TARGET
        and closed_count == BLINK_CORE_TARGET
        and post_open_count == BLINK_CORE_TARGET
    ):
        return TIER_EXTRACTED
    return 1.0


def _blink_reason_tags(method, open_count, closed_count, post_open_count, balance):
    tags = []
    if (
        method == "natural"
        and open_count == 2
        and closed_count == 2
        and post_open_count == 2
    ):
        return ["natural", "ideal adequacy", "perfect balance"]

    if (
        method == "consecutive"
        and open_count == 2
        and closed_count == 2
        and post_open_count == 2
        and balance == 1.0
    ):
        return ["consecutive", "perfect balance"]

    if method == "natural":
        tags.append("natural")
    elif method == "consecutive":
        tags.append("consecutive")
    elif method == "extracted":
        tags.append("extracted")

    for name, count in (
        ("open", open_count),
        ("closed", closed_count),
        ("post-open", post_open_count),
    ):
        if count == 1:
            tags.append(f"thin {name} phase")
            break

    if open_count == closed_count == post_open_count and balance == 1.0:
        if "perfect balance" not in tags:
            tags.append("perfect balance")
    elif balance >= 0.8:
        tags.append("good balance")
    elif balance < 0.5:
        tags.append("skewed")

    return tags[:3]


def _pick_phase_frame_nums(phase_start, phase_len, pick_count, pick_mode):
    if phase_len <= 0 or pick_count <= 0:
        return []
    pick_count = min(pick_count, phase_len)
    if pick_mode == "all":
        return [phase_start + i for i in range(phase_len)]
    if pick_mode == "first":
        return [phase_start + i for i in range(pick_count)]
    if pick_mode == "last":
        offset = phase_len - pick_count
        return [phase_start + offset + i for i in range(pick_count)]
    if pick_mode == "evenly_spaced":
        indices = _evenly_spaced_indices(phase_len, pick_count)
        return [phase_start + i for i in indices]
    return []


def resolve_core_frame_nums(instance):
    start = instance["start_frame_num"]
    pre_len = instance["open_count"]
    closed_len = instance["closed_count"]
    post_len = instance["post_open_count"]
    pre_start = start
    closed_start = start + pre_len
    post_start = start + pre_len + closed_len

    core_open = instance["core_open"]
    core_closed = instance["core_closed"]
    core_post_open = instance["core_post_open"]
    method = instance["core_method"]

    if method == "natural":
        pre_frames = _pick_phase_frame_nums(pre_start, pre_len, pre_len, "all")
        closed_frames = _pick_phase_frame_nums(closed_start, closed_len, closed_len, "all")
        post_frames = _pick_phase_frame_nums(post_start, post_len, post_len, "all")
    elif method == "consecutive":
        pre_frames = _pick_phase_frame_nums(pre_start, pre_len, core_open, "last")
        closed_frames = _pick_phase_frame_nums(closed_start, closed_len, core_closed, "first")
        post_frames = _pick_phase_frame_nums(post_start, post_len, core_post_open, "first")
    elif method == "extracted":
        pre_frames = _pick_phase_frame_nums(pre_start, pre_len, core_open, "evenly_spaced")
        closed_frames = _pick_phase_frame_nums(
            closed_start, closed_len, core_closed, "evenly_spaced")
        post_frames = _pick_phase_frame_nums(
            post_start, post_len, core_post_open, "evenly_spaced")
    else:
        pre_frames = _pick_phase_frame_nums(pre_start, pre_len, core_open, "first")
        closed_frames = _pick_phase_frame_nums(closed_start, closed_len, core_closed, "first")
        post_frames = _pick_phase_frame_nums(post_start, post_len, core_post_open, "first")

    return pre_frames + closed_frames + post_frames


def format_blink_example_line(instance):
    frame_nums = instance["core_frame_nums"]
    frames_str = ", ".join(str(frame_num) for frame_num in frame_nums)
    return (
        f"eye blink for eyeblink_example.png: core "
        f"{instance['core_open']}+{instance['core_closed']}+{instance['core_post_open']} "
        f"(frames {frames_str})"
    )


def score_blink_instance(instance):
    pre = instance["open_count"]
    closed = instance["closed_count"]
    post = instance["post_open_count"]

    core_open, core_closed, core_post_open, method = _extract_core_counts(pre, closed, post)
    adequacy = (
        _phase_adequacy(core_open)
        + _phase_adequacy(core_closed)
        + _phase_adequacy(core_post_open)
    ) / 3
    balance = _balance_score(core_open, core_closed, core_post_open)
    tier = _tier_multiplier(method, core_open, core_closed, core_post_open)
    score = round(min(1.0, max(0.0, adequacy * balance * tier)), 2)

    instance["chronological_index"] = instance.get("index")
    instance["core_open"] = core_open
    instance["core_closed"] = core_closed
    instance["core_post_open"] = core_post_open
    instance["core_method"] = method
    instance["favorability_score"] = score
    instance["reason_tags"] = _blink_reason_tags(
        method, core_open, core_closed, core_post_open, balance)
    instance["core_frame_nums"] = resolve_core_frame_nums(instance)
    return instance


def rank_blink_instances(instances):
    scored = [score_blink_instance(dict(inst)) for inst in instances]
    scored.sort(key=lambda inst: (-inst["favorability_score"], inst["chronological_index"]))
    for rank, inst in enumerate(scored, 1):
        inst["index"] = rank
    return scored


def format_blink_instance_line(rank, instance):
    tags = ", ".join(instance["reason_tags"])
    return (
        f"{rank}. {instance['start_timestamp_s']:.2f}s–"
        f"{instance['end_timestamp_s']:.2f}s ({instance['duration_s']:.2f}s) | "
        f"{instance['open_count']} open → {instance['closed_count']} closed → "
        f"{instance['post_open_count']} open | "
        f"samples {instance['start_frame_num']}–{instance['end_frame_num']} | "
        f"score {instance['favorability_score']:.2f} | "
        f"core {instance['core_open']}+{instance['core_closed']}+"
        f"{instance['core_post_open']} | "
        f"{tags}"
    )


def write_result_update_json(results, output_path):
    '''
    Write the four model result dicts to result_update.json.

    Args:
        results: list of four dicts in UI order (DFD, blink, age/gender, shades).
                 Each dict may include a "runtime" field (seconds, float).
        output_path: path to result_update.json.
    '''
    temp_path = output_path + ".tmp"
    with open(temp_path, "w") as outfile:
        json.dump(results, outfile, indent=2)
        outfile.flush()
        os.fsync(outfile.fileno())
    os.replace(temp_path, output_path)

def write_blink_progress_json(payload, output_path):
    '''
    Write blink inference progress for live frame preview polling.

    Args:
        payload: dict with status, latest_frame_num, total_frames.
        output_path: path to blink_progress.json.
    '''
    temp_path = output_path + ".tmp"
    with open(temp_path, "w") as outfile:
        json.dump(payload, outfile, indent=2)
        outfile.flush()
        os.fsync(outfile.fileno())
    os.replace(temp_path, output_path)

def clear_blink_frame_pngs(frames_dir):
    '''
    Remove saved per-frame blink preview PNGs.

    Args:
        frames_dir: path to all_video_frames directory.
    '''
    os.makedirs(frames_dir, exist_ok=True)
    for filename in os.listdir(frames_dir):
        if filename.endswith(".png"):
            os.remove(os.path.join(frames_dir, filename))


def clear_blink_gemini_dir(gemini_dir):
    '''
    Remove saved Gemini prompt collage PNGs from a prior blink run.

    Args:
        gemini_dir: path to temp/gemini directory.
    '''
    os.makedirs(gemini_dir, exist_ok=True)
    for filename in os.listdir(gemini_dir):
        if filename.endswith(".png"):
            os.remove(os.path.join(gemini_dir, filename))


VIDEO_SUMMARY_MIN_FRAMES = 2
VIDEO_SUMMARY_MAX_FRAMES = 10


def video_summary_frame_count(frame_count, native_fps):
    '''
    Number of evenly spaced full-frame panels for video_summary.png.

    Returns min(10, max(2, ceil(duration_seconds))).
    '''
    if native_fps <= 0 or frame_count <= 0:
        return VIDEO_SUMMARY_MIN_FRAMES
    duration_seconds = frame_count / native_fps
    return min(
        VIDEO_SUMMARY_MAX_FRAMES,
        max(VIDEO_SUMMARY_MIN_FRAMES, math.ceil(duration_seconds)),
    )


def clear_blink_summary_frames_dir(summary_frames_dir):
    '''
    Remove saved per-panel video summary PNGs.

    Args:
        summary_frames_dir: path to gemini/summary_frames directory.
    '''
    os.makedirs(summary_frames_dir, exist_ok=True)
    for filename in os.listdir(summary_frames_dir):
        if filename.endswith(".png"):
            os.remove(os.path.join(summary_frames_dir, filename))


def save_eyeblink_example_collage(frame_nums, frames_dir, output_path, target_height=128):
    '''
    Build a left-to-right collage from per-frame blink PNGs.

    Args:
        frame_nums: ordered frame_num values (sorted ascending before load).
        frames_dir: path to all_video_frames directory.
        output_path: destination PNG path.
        target_height: uniform height for each panel in pixels.

    Returns:
        output_path on success, or None if frame_nums is empty or any PNG is missing.
    '''
    if not frame_nums:
        return None

    sorted_frame_nums = sorted(frame_nums)
    missing = []
    for frame_num in sorted_frame_nums:
        if not os.path.isfile(os.path.join(frames_dir, f"{frame_num}.png")):
            missing.append(frame_num)
    if missing:
        missing_str = ", ".join(str(frame_num) for frame_num in missing)
        print(
            "save_eyeblink_example_collage() warning: missing frame PNG(s) "
            f"[{missing_str}]; skipping collage save."
        )
        return None

    images = []
    for frame_num in sorted_frame_nums:
        path = os.path.join(frames_dir, f"{frame_num}.png")
        img = Image.open(path).convert("RGB")
        scale = target_height / img.height
        resized_width = max(1, int(img.width * scale))
        images.append(img.resize((resized_width, target_height), Image.Resampling.LANCZOS))

    total_width = sum(img.width for img in images)
    collage = Image.new("RGB", (total_width, target_height))
    x_offset = 0
    for img in images:
        collage.paste(img, (x_offset, 0))
        x_offset += img.width

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    collage.save(output_path)
    return output_path


def reset_blink_live_preview_state(progress_path, frames_dir):
    '''
    Reset blink live-preview artifacts for a new upload or inference run.

    Args:
        progress_path: path to blink_progress.json.
        frames_dir: path to all_video_frames directory.
    '''
    write_blink_progress_json(
        {
            "status": "pending",
            "latest_frame_num": 0,
            "total_frames": 0,
        },
        progress_path,
    )
    clear_blink_frame_pngs(frames_dir)