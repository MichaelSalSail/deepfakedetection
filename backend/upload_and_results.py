from flask import Flask, render_template, redirect, url_for, request, send_file
from flask_restful import Api, Resource, reqparse
import os
import json
import time
from helper_functions import reset_blink_live_preview_state
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

def _load_results_json(file_dir, max_attempts=20, retry_delay=0.05):
    last_error = None
    for _ in range(max_attempts):
        try:
            with open(file_dir) as f:
                return json.load(f)
        except (json.JSONDecodeError, ValueError) as exc:
            last_error = exc
            time.sleep(retry_delay)
    raise last_error

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
    all_data=_load_results_json(file_dir)
    # true->True, false->False... uppercase keywords undefined in JS.
    all_data[3]["shades"]=int(all_data[3]["shades"])
    return {"models" : all_data}

@app.route('/home/eyeblink_csv', methods=['GET', 'OPTIONS'])
def get_eyeblink_csv():
    file_dir = os.path.join(APP_PATH, 'backend/AllResults/eyeblink_data.csv')
    return send_file(file_dir, mimetype='text/csv', as_attachment=True,
                     download_name='eyeblink_data.csv')

@app.route('/home/face_crop', methods=['GET', 'OPTIONS'])
def get_face_crop():
    file_dir = os.path.join(APP_PATH, 'backend/current_upload/temp/subject_reference.png')
    if not os.path.exists(file_dir):
        return "Face crop not found", 404
    return send_file(file_dir, mimetype='image/png')

@app.route('/home/eyeblink_example', methods=['GET', 'OPTIONS'])
def get_eyeblink_example():
    file_dir = os.path.join(
        APP_PATH, 'backend/current_upload/temp/gemini/eyeblink_example.png')
    if not os.path.exists(file_dir):
        return "Eye blink example not found", 404
    return send_file(file_dir, mimetype='image/png')

@app.route('/home/video_summary', methods=['GET', 'OPTIONS'])
def get_video_summary():
    file_dir = os.path.join(
        APP_PATH, 'backend/current_upload/temp/gemini/video_summary.png')
    if not os.path.exists(file_dir):
        return "Video summary not found", 404
    return send_file(file_dir, mimetype='image/png')

@app.route('/home/gemini_inputs', methods=['GET', 'OPTIONS'])
def get_gemini_inputs():
    temp_dir = os.path.join(APP_PATH, 'backend/current_upload/temp')
    gemini_dir = os.path.join(temp_dir, 'gemini')
    return {
        "subject": os.path.isfile(os.path.join(temp_dir, 'subject_reference.png')),
        "video_summary": os.path.isfile(os.path.join(gemini_dir, 'video_summary.png')),
        "eyeblink_example": os.path.isfile(os.path.join(gemini_dir, 'eyeblink_example.png')),
    }

@app.route('/home/blink_progress', methods=['GET', 'OPTIONS'])
def get_blink_progress():
    file_dir = os.path.join(APP_PATH, 'backend/AllResults/blink_progress.json')
    if not os.path.exists(file_dir):
        return {
            "status": "pending",
            "latest_frame_num": 0,
            "total_frames": 0,
        }
    return _load_results_json(file_dir)

@app.route('/home/blink_frame/<int:frame_num>', methods=['GET', 'OPTIONS'])
def get_blink_frame(frame_num):
    if frame_num < 1:
        return "Invalid frame number", 400
    file_dir = os.path.join(
        APP_PATH,
        'backend/current_upload/temp/all_video_frames',
        f'{frame_num}.png',
    )
    if not os.path.exists(file_dir):
        return "Blink frame not found", 404
    return send_file(file_dir, mimetype='image/png')

@app.route('/home/upload', methods = ['POST', 'OPTIONS'])
def upload_video():
    if request.method == 'POST':
        (request.files["file"]).save(os.path.join(APP_PATH,'backend/current_upload/target.mp4'))
        reset_blink_live_preview_state(
            os.path.join(APP_PATH, 'backend/AllResults/blink_progress.json'),
            os.path.join(APP_PATH, 'backend/current_upload/temp/all_video_frames'),
        )
        return "Successfully saved!"

if __name__ == '__main__':
   app.run(port=5001, debug = True)