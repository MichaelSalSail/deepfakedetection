from flask import Flask, render_template, redirect, url_for, request
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS, cross_origin
import os
import json
APP_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(APP_PATH, 'src/pages/')
app = Flask(__name__, template_folder=TEMPLATE_PATH)
cors = CORS(app)
app.config['MAX_CONTENT_LENGTH']=50000000

# This file aims to download the user uploaded video to the 
# appropriate local directory and update the user on any 
# changes to result_update.json

# @app.route('/home/results', methods = ['GET','POST'])
# def success():
#     return "it reached next page!"
#    app_state = request.args.get('q')
#    all_data=[]
#    if(app_state=="update"):
#        all_data=json.load(open('../../utils/AllResultsJSON/result_update.json'))
#    else:
#        all_data=json.load(open('../../utils/AllResultsJSON/result_default.json'))
#    # model outputs
#    DFD=all_data[0]["DFD"]
#    missing=all_data[1]["missing"]
#    unknown=all_data[1]["unknown"]
#    openn=all_data[1]["open"]
#    closed=all_data[1]["closed"]
#    age=all_data[2]["age"]
#    beard=all_data[2]["beard"]
#    shades=all_data[3]["shades"]
#
#    if request.method == 'POST':
#        return redirect(url_for('upload_video'))
#
#    return render_template('display_results.html', 
#                            DFD=DFD, 
#                            missing=missing, unknown=unknown, openn=openn, closed=closed,
#                            age=age, beard=int(beard),
#                            shades=int(shades), mylist=all_data)

@app.route('/home/upload', methods = ['POST'])
@cross_origin()
def upload_video():
    if request.method == 'POST':
        (request.files["file"]).save(os.path.join(APP_PATH,'backend/example_videos/target.mp4'))
        return "Successfully saved!"

if __name__ == '__main__':
   app.run(port=5000, debug = True)# 3000 , 5000