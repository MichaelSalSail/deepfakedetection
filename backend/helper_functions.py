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


def format_blink_instance_line(index, instance):
    return (
        f"{index}. {instance['start_timestamp_s']:.2f}s–"
        f"{instance['end_timestamp_s']:.2f}s ({instance['duration_s']:.2f}s) | "
        f"{instance['open_count']} open → {instance['closed_count']} closed → "
        f"{instance['post_open_count']} open | "
        f"samples {instance['start_frame_num']}–{instance['end_frame_num']}"
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