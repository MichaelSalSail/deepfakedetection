# Introduction

Welcome to Deepfake Detection. For our CS Senior Project, we decided to create an application that uses multiple ML models to help lawyers in the courtroom identify deepfake videos. Since deepfakes can be used to falsely accuse clients of crimes they didn't commit, it's important for lawyers to have access to available technologies that can help them discern whether a video is genuine or not. By using our application, lawyers can interpret ML model outputs to make their own judgments on the legitimacy of a video.  

<p align="center"><img src="public/static/mock-images/avatars/courtroom.jpg" width="509" height="287"/></p>

# How it Works  

The backend uses 1 base model and 3 user trust models. The application alerts the user on suspicious video elements detected from the 3 user trust models.

4 Machine Learning Models:
1. *DFD* - base model that takes in videos as input and returns a continuous score on the likelihood of a deepfake. <50% means not a deepfake and >50% means a deepfake.
2. *blink* - classifies individual video frames as open eyes or closed eyes. When only one eye is visible, such as when only part of the face is shown, the model classifies it as unknown.
3. *beard* - detects the age and gender of the subject. An adult male is likely to have a beard.
4. *shades* - detects if the subject has eyewear such as glasses or sunglasses.  

# Application Demo

The following is a brief demonstration of our application.  

![](public/static/mock-images/avatars/app_demo.gif)  

To successfully run the application, follow all instructions located in backend - README.md.  

# Languages  

Most of the project was written in Python and React. Some files were written in Javascript.  

![](public/static/mock-images/avatars/python.png)
![](public/static/mock-images/avatars/react.png)  

# Project Directories  

1. **testing** - All_Models_Evaluation.html goes into detail on the problem of deepfake detection, methods used to evaluate models, and evaluation results.
2. **backend** - code for running the models to obtain outputs and setting up a server that sends the output to the application frontend.
3. **src, public** - frontend design elements and logic of component interactions.

# Frontend

Our frontend code is all inside src folder. It is sectioned into:

1. **components** - the ui components that our main pages and layouts utilize
2. **layouts** - the layouts of each page. This simply gives us a fixed way in which the page is displayed
3. **pages** - the pages of the application. This is for each route on the application (e.g: /home, /home/app)
4. **theme** - the theme of the application. This includes basic styling and coloring schemes that is maintained throughout all components or pages
5. **utils** - the utils folder simply has functions that we utilize throughout the application  

# Credits  

Chukwudi Udoka, Denny Liang, Michael Salamon, and Ravid Rahman