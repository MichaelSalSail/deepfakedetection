from flask import Flask, render_template,request
from flask import Response
from flask_cors import CORS, cross_origin
from flask_wtf import FlaskForm
from wtforms import FileField
import base64
import moviepy.editor as mp
import math
import os, sys, time
import torch
from all_models import predict_on_video, blink_on_video, detect_beard, detect_shades
from helper_functions import get_model
from helper_functions import splice_video

# -----------------------------------------Look here-----------------------------------------
# Change the directories as you see fit.

cwd = os.getcwd()
pre2 = "/example_videos"
video_path = cwd+pre2+"/blink07.mp4"

# This is the directory of the 4 model outputs = 4 txt files.
output_dir = "../src/pages/Home/VideoFilePlayer"

path_to_img=cwd+"/example_videos/temp/"
temp_img_shades=path_to_img+'p.png'
temp_img_beard=path_to_img+'o.png'

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
#predict_on_video(video_path, 15, device, facedet, output_dir)
#blink_on_video(video_path, 15, facedet, model_for_tests, output_dir)
#detect_beard(temp_img_beard, output_dir)
#detect_shades(temp_img_shades, output_dir)
frames_per_video = 15;

# Server backend code
# splice_video is in helper_functions

result = {}

app = Flask(__name__);
CORS(app)

@app.route('/', methods=['GET','POST'])
def welcome():
    return "Hello World!"

@app.route('/upload/', methods=['POST'])
@cross_origin()
def upload():
	content = request.get_json()
	length = request.content_length;
	#Response.headers.add("Access-Control-Allow-Origin", "*");
	if length>20000000:
		result["error"]="files size is too large . Maximum size is 20 mb";
		return result
	else:
		#first we decode the file in base64
		video_data=content['data']
		file_handler = open("temp.mp4", "wb")
		file_handler.write(base64.b64decode(video_data))
		file_handler.close()
		spliced_videos = splice_video("temp.mp4",2);
		split_result={}
		for i in range(0,len(spliced_videos)):
			try:
				num_result = predict_on_video(spliced_videos[i],frames_per_video,device,facedet,output_dir)
				split_result[i]=num_result
			except Exception as e:
				print("Discarding frame clip");

		## get prediction
		#video_prediction=predict_on_video("temp.mp4",frames_per_video);

		##
		result["preditction"]=split_result;
		return result;
		
@app.route('/upload_eye_blink/', methods=['POST'])
@cross_origin()
def upload_eye_blink():
	content = request.get_json()
	length = request.content_length;
	if length>50000000:
		result["error"]="files size is too large . Maximum size is 20 mb";
		return result
	else:
		#first we decode the file in base64
		video_data=content['data']
		file_handler = open("temp.mp4", "wb")
		file_handler.write(base64.b64decode(video_data))
		file_handler.close()
		spliced_videos = splice_video("temp.mp4",2);
		split_result={}
		for i in range(0,len(spliced_videos)):
			try:
				split_result[i]=blink_on_video(spliced_videos[i],frames_per_video,facedet,model_for_tests,output_dir)
			except Exception as e:
				print("Discarding frame")
				print(e)

		## get prediction
		#video_prediction=predict_on_video("temp.mp4",frames_per_video);

		##
		result["preditction"]=split_result;
		return result;	
				
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8091)

