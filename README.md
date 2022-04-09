# Application

There is a problem of... This application deals w/ it by...

# How it Works

1. **DFD** - base model that takes in videos as input and returns a continuous score on the likelihood of a deepfake. <50% means not a deepfake and >50% means a deepfake.
2. **blink** - classifies individual video frames as open eyes or closed eyes. If a frame only shows one side of a face, only one eye is visible, then it is classified as unknown.
3. **beard** - detects the age and gender of the subject. An adult male is likely to have a beard.
4. **shades** - detects if the subject has eyewear such as glasses or sunglasses.  

# Video Demo

The following is a brief demonstration of our application.  

VIDEO THUMBNAIL HERE

# Project Directories

1. **testing** - goes into detail on the methods used to evaluate the models and the results.
2. **backend** - code for running the models to obtain outputs and setting up a server that sends the output to the application frontend
3. **src, public** - frontend design elements and logic of component interactions.

# Frontend

Our frontend code is all inside src folder. It is sectioned into:

1. **components** - the ui components that our main pages and layouts utilize
2. **layouts** - the layouts of each page. This simply gives us a fixed way in which the page is displayed
3. **pages** - the pages of the application. This is for each route on the application (e.g: /home, /home/app)
4. **theme** - the theme of the application. This includes basic styling and coloring schemes that is maintained throughout all components or pages
5. **utils** - the utils folder simply has functions that we utilize throughout the application