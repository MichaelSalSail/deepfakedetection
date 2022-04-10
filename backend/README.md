# Backend

By following these terminal commands, the user will download all required dependencies and successfully launch + run the application. Make sure to navigate to the 'backend' directory in your terminal before running each command!  

(Note: This application was tested using a UNIX-based OS and a Chromium browser environment. Running the application under different circumstances may result in unexpected errors.)  

1. `./setup.sh`  
Installs/updates any python dependencies required to run the backend.
2. `./start_server.sh`  
Open a new terminal window before running this command. Allows the application to successfully make HTTP requests.
3. `./start_app.sh`  
Open a new terminal window before running this command. Installs/updates any react dependencies required to use the application. Upon completion, launches the application at localhost in your browser.
4. `./gen_results.sh`  
Open a new terminal window before running this command. Unlike previous commands, don't run this in quick succession! Only run this command once the application started running and you successfully clicked 'Generate Results'. The frontend will estimate how long it will take to generate results, but running this command will call the backend to run all models and send outputs to the application upon completion. You may run this command each time you upload a .mp4 file, click 'submit', and click 'Generate Results'.