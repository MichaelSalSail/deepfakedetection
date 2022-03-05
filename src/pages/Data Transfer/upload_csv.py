from flask import Flask, send_file, render_template
import os

app= Flask(__name__)

@app.route('/')
def home():
    return render_template('csv_onclick.html')

@app.route('/download')
def download_file():
    p=os.getcwd()+"/blinkexample.csv"
    return send_file(p, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)