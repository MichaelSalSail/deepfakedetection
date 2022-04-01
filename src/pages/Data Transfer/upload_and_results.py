from flask import Flask, render_template, redirect, url_for, request
import json
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH']=50000000

# This file aims to download the user uploaded video to the 
# appropriate local directory and update the user on any 
# changes to result_update.json

@app.route('/upload')
def home():
    return render_template('upload_video.html')

@app.route('/results', methods = ['GET','POST'])
def success():
    app_state = request.args.get('q')
    all_data=[]
    if(app_state=="update"):
        all_data=json.load(open('../../utils/AllResultsJSON/result_update.json'))
    else:
        all_data=json.load(open('../../utils/AllResultsJSON/result_default.json'))
    # model outputs
    DFD=all_data[0]["DFD"]
    missing=all_data[1]["missing"]
    unknown=all_data[1]["unknown"]
    openn=all_data[1]["open"]
    closed=all_data[1]["closed"]
    age=all_data[2]["age"]
    beard=all_data[2]["beard"]
    shades=all_data[3]["shades"]

    if request.method == 'POST':
        return redirect(url_for('upload_video'))

    return render_template('display_results.html', 
                            DFD=DFD, 
                            missing=missing, unknown=unknown, openn=openn, closed=closed,
                            age=age, beard=int(beard),
                            shades=int(shades), mylist=all_data)

@app.route('/upload', methods = ['POST'])
def upload_video():
    if request.method == 'POST':
      f = request.files['file']
      f.save('../../../backend/example_videos/target.mp4')
      return redirect(url_for('success'))

if __name__ == '__main__':
   app.run(debug = True)