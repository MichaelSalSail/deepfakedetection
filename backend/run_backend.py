import os, sys
import torch
from all_models import predict_on_video, blink_on_video, detect_beard, detect_shades
from helper_functions import get_model, write_result_update_json

# -----------------------------------------Look here-----------------------------------------
# Change the directories as you see fit.

cwd = os.getcwd()
pre2 = "/current_upload"
video_path = cwd+pre2+"/target.mp4"

results_path = "AllResults/result_update.json"

# frame and cropped frame from blink_on_video()
temp_img_original=cwd+"/current_upload/temp/"+'o.png'
temp_img_cropped=cwd+"/current_upload/temp/"+'p.png'
temp_img_beard=cwd+"/current_upload/temp/"+'beard.png'

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

# Run all models
dfd_result = predict_on_video(video_path, 15, device, facedet)
blink_result = blink_on_video(video_path, 15, facedet, model_for_tests)
beard_result = detect_beard(temp_img_beard)
shades_result = detect_shades(temp_img_beard, temp_img_cropped)

write_result_update_json(
    [dfd_result, blink_result, beard_result, shades_result],
    results_path,
)

# TensorFlow and PyTorch cleanup routines conflict on shutdown and cause a
# segfault. All results are written to disk before this point, so bypassing
# Python's teardown is safe.
os._exit(0)
