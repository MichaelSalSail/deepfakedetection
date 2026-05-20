from flask import Flask, render_template, redirect, url_for, request, send_file
from flask_restful import Api, Resource, reqparse
import os
import json
import time
APP_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(APP_PATH, 'src/pages/')
app = Flask(__name__, template_folder=TEMPLATE_PATH)

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

# This file aims to download the user uploaded video to the
# appropriate local directory and update the user on any
# changes to result_update.json

@app.route('/home/results', methods = ['GET', 'OPTIONS'])
def success():
    # Since we are looking for a file modification in the last 2 seconds,
    # delaying for 2 seconds ensures that we won't return results from a
    # previous 'Generate Results' run.
    time.sleep(2)
    file_dir=os.path.join(APP_PATH,'backend/AllResults/result_update.json')
    curr_time=time.time()
    file_mod_time=os.path.getmtime(file_dir)
    while(abs(curr_time-file_mod_time)>2):
        curr_time=time.time()
        file_mod_time=os.path.getmtime(file_dir)
    all_data=json.load(open(file_dir))
    # true->True, false->False... uppercase keywords undefined in JS.
    all_data[2]["beard"]=int(all_data[2]["beard"])
    all_data[3]["shades"]=int(all_data[3]["shades"])
    return {"models" : all_data}

@app.route('/home/eyeblink_csv', methods=['GET', 'OPTIONS'])
def get_eyeblink_csv():
    file_dir = os.path.join(APP_PATH, 'backend/AllResults/eyeblink_data.csv')
    return send_file(file_dir, mimetype='text/csv', as_attachment=True,
                     download_name='eyeblink_data.csv')

@app.route('/home/upload', methods = ['POST', 'OPTIONS'])
def upload_video():
    if request.method == 'POST':
        (request.files["file"]).save(os.path.join(APP_PATH,'backend/example_videos/target.mp4'))
        return "Successfully saved!"

if __name__ == '__main__':
   app.run(port=5001, debug = True)