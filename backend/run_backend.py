import os, sys
import json
import time
from datetime import datetime
import torch
from all_models import predict_on_video, blink_on_video, detect_age_gender, detect_shades, _format_runtime
from helper_functions import get_model, write_result_update_json, reset_blink_live_preview_state
from ai_model import build_ai_model_placeholders

# -----------------------------------------Look here-----------------------------------------
# Change the directories as you see fit.

cwd = os.getcwd()
pre2 = "/current_upload"
video_path = cwd+pre2+"/target.mp4"

results_path = "AllResults/result_update.json"
blink_progress_path = "AllResults/blink_progress.json"
blink_frames_dir = cwd + "/current_upload/temp/all_video_frames"

# Frame crops from blink_on_video()
temp_img_tight_crop = cwd + "/current_upload/temp/" + "face_tight_crop.png"
temp_img_subject_reference = cwd + "/current_upload/temp/" + "subject_reference.png"
temp_img_face_detected = cwd + "/current_upload/temp/" + "face_detected.png"

# Use GPU, if available
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# Set up libraries
sys.path.insert(0,cwd + "/imports/blazeface")

# import libraries
from blazeface import BlazeFace

# Load blazeface training weights from directory
facedet = BlazeFace().to(device)
facedet.load_weights(cwd + "/imports/blazeface/blazeface.pth")
facedet.load_anchors(cwd + "/imports/blazeface/anchors.npy")
_ = facedet.train(False)

# VGG16() model w/ pre-trained weights
model_for_tests=get_model()

print("\nIgnore any warnings above. So far, so good.")

start_perf = time.perf_counter()
print("start time: " + datetime.now().strftime("%H:%M:%S"))

# Run all models
reset_blink_live_preview_state(blink_progress_path, blink_frames_dir)
print("1/2 - ML MODELS")
dfd_result = predict_on_video(video_path, 15, device, facedet)
blink_result = blink_on_video(video_path, 15, facedet, model_for_tests)
age_gender_result = detect_age_gender(
    temp_img_subject_reference,
    temp_img_tight_crop,
    temp_img_face_detected,
)
shades_result = detect_shades(temp_img_subject_reference, temp_img_tight_crop)

print("end time: " + datetime.now().strftime("%H:%M:%S"))

write_result_update_json(
    [dfd_result, blink_result, age_gender_result, shades_result],
    results_path,
)

print("total runtime: " + _format_runtime(time.perf_counter() - start_perf))

print()
print("2/2 - AI MODEL")
print(json.dumps(build_ai_model_placeholders(), indent=2))

# TensorFlow and PyTorch cleanup routines conflict on shutdown and cause a
# segfault. All results are written to disk before this point, so bypassing
# Python's teardown is safe.
os._exit(0)
