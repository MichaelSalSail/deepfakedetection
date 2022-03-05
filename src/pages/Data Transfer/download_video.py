from flask import Flask, render_template, redirect, url_for, request
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH']=50000000

@app.route('/upload')
def home():
    return render_template('upload_video.html')

@app.route('/upload/<name>')
def success(name):
   return '%s successfully uploaded' % name

@app.route('/upload', methods = ['POST'])
def upload_video():
    if request.method == 'POST':
      f = request.files['file']
      f.save('../../../backend/example_videos/target.mp4')
      return redirect(url_for('success',name = f.filename))

if __name__ == '__main__':
   app.run(debug = True)