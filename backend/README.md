# Backend

By following these terminal commands, the user will download all required dependencies and successfully launch and run the application. Make sure to navigate to the 'backend' directory in your terminal before running each command!  

(Note: This application was tested using Python 3.10.14, a UNIX-based OS, and a Chromium browser environment. Running the application under different circumstances may result in unexpected errors.)  

1. `./setup.sh`  
Installs/updates any python dependencies required to run the backend.

(Note: Before running `./start_server.sh`, create a `.env` file in the `backend` directory containing `GEMINI_API_KEY=<your key>`. Without it, the AI video analysis step will fail.)  

2. `./start_server.sh`  
Open a new terminal window before running this command. Starts the Flask backend server on port 5001, which the frontend needs in order to make HTTP requests.
3. `./start_app.sh`  
Installs/updates any react dependencies required to use the application. Upon completion, launches the application at localhost:3000 in your browser.

(Note: Clicking 'Generate Results' in the application automatically runs `./gen_results.sh`, so there's no need to run it manually. Once the script finishes, all script outputs are printed in a single block in the terminal window running `./start_server.sh`.)  