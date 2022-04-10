# Google Colab Code

Some processes in this project would've been too time consuming or resource intensive to run locally. Google Colab GPU service was used for 2 Jupyter Notebooks:  

1. **train_eye_blink.ipynb** - the eye blink model was built by transfer learning VGG16 w/o classifier layers. After training the model, weights were extracted to the backend.  
2. **accuracy_testset.ipynb** - recorded the predictions of all 4 models on 400 different videos from the Kaggle Meta Deepfake Detection Competition dataset. Saved the results to .csv format for reference in All_Models_Evaluation.ipynb.