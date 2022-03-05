from flask import Flask, jsonify, request
import json
app = Flask(__name__)

# curl -s localhost:5000/results
# curl -s localhost:5000/results?q=update
# curl -s localhost:5000/results?q=default

# The following three are equivalent:
# curl -s localhost:5000/results?q=update
# curl -X GET localhost:5000/results?q=update
# http://127.0.0.1:5000/results?q=update

# Params can be combined for further filtering
@app.route('/results', methods=['GET'])
def search():
    app_state = request.args.get('q')
    all_data = []
    # Load all data from json files
    if(app_state=="update"):
        all_data=json.load(open('../../pages/AllResultsJSON/result_update.json'))
    else:
        app_state="default"
        all_data=json.load(open('../../pages/AllResultsJSON/result_default.json'))
        
    # return everything in json format
    return jsonify({app_state: [all_data for all_data in all_data]})

if __name__ == '__main__':
    app.run(debug=True) # host=127.0.0.1, port=5000 or host=localhost, port=5000    
						# able to edit and save 