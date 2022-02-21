import os, sys
import torch
from all_models import predict_on_video, blink_on_video, detect_beard, detect_shades
from helper_functions import get_model

# -----------------------------------------Look here-----------------------------------------
# Change the directories as you see fit.

cwd = os.getcwd()
pre2 = "/example_videos"
video_path = cwd+pre2+"/blink07.mp4"

# This is the directory of the 4 model outputs = 4 txt files.
output_dir = "../src/pages/Home/VideoFilePlayer"

# frame and cropped frame from blink_on_video()
temp_img_original=cwd+"/example_videos/temp/"+'o.png'
temp_img_cropped=cwd+"/example_videos/temp/"+'p.png'

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

# Run all models
predict_on_video(video_path, 15, device, facedet, output_dir)
blink_on_video(video_path, 15, facedet, model_for_tests, output_dir)
detect_beard(temp_img_original, output_dir)
detect_shades(temp_img_original, output_dir, temp_img_cropped)