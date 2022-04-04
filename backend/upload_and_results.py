from flask import Flask, render_template, redirect, url_for, request
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS, cross_origin
import os
import json
import time
APP_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(APP_PATH, 'src/pages/')
app = Flask(__name__, template_folder=TEMPLATE_PATH)
cors = CORS(app)
app.config['MAX_CONTENT_LENGTH']=50000000

# This file aims to download the user uploaded video to the 
# appropriate local directory and update the user on any 
# changes to result_update.json

@app.route('/home/results', methods = ['GET'])
def success():
    file_dir=os.path.join(APP_PATH,'src/utils/AllResultsJSON/result_update.json')
    curr_time=time.time()
    file_mod_time=os.path.getmtime(file_dir)
    while((curr_time-file_mod_time)>60):
        curr_time=time.time()
        file_mod_time=os.path.getmtime(file_dir)
    # time.sleep(5)
    all_data=json.load(open(file_dir))
    all_data[2]["beard"]=int(all_data[2]["beard"])
    all_data[3]["shades"]=int(all_data[3]["shades"])
    return {"models" : all_data}

@app.route('/home/upload', methods = ['POST'])
@cross_origin()
def upload_video():
    if request.method == 'POST':
        (request.files["file"]).save(os.path.join(APP_PATH,'backend/example_videos/target.mp4'))
        return "Successfully saved!"

if __name__ == '__main__':
   app.run(port=5000, debug = True)# 3000 , 5000