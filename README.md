# Backend

A folder backend was created. Do NOT edit _helper_functions.py_ or _all_models.py_ as they contain all necessary functions. Only need to run _run_backend.py_ OR _run_backend.ipynb_ to run all 4 models, you can edit the file to change directories of video input or test file locations.

## Requirements

1. **dfd** - the folder _imports_ is already in the repository. It contains the blazeface training weights and video face extraction functions.
2. **blink** - you MUST create a folder in 'backend' and name it 'data'. In this folder, you have to put the training weights for the eye blink model. The weights folder can be found on the OneDrive link in Discord. Also, install the library: <code>pip3 install face_recognition</code>
3. **beard** - install the library: <code>pip3 install deepface</code>
4. **other** - install keras, opencv (cv2), moviepy exc.

## Output

4 string outputs:

- **DFD model**: score
- **Blink model**: binary classification distribution
- **Beard model**: age and gender
- **Shades model**: sunglasses detection

# Frontend

Our frontend code is all inside src folder. It is sectioned into:

1. **components** - the ui components that our main pages and layouts utilize
2. **layouts** - the layouts of each page. This simply gives us a fixed way in which the page is displayed
3. **pages** - the pages of the application. This is for each route on the application (e.g: /home, /dashboard, ..)
4. **theme** - the theme of the application. This includes basic styling and coloring schemes that is maintained throughout all components or pages
5. **utils** - the utils folder simply has functions that we utilize throughout the application

## Requirements

1. **Installation** - yarn install OR npm install
2. **Run/Build** - yarn start OR npm start
