import cv2
import os, sys
import numpy as np
import pandas as pd
import math
from deepface import DeepFace
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import torchvision.models as models
from torchvision.transforms import Normalize
from tensorflow.keras.preprocessing.image import load_img
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.applications.vgg16 import preprocess_input
from tensorflow.keras.applications.vgg16 import decode_predictions
from tensorflow.keras.applications.vgg16 import VGG16
from helper_functions import isotropically_resize_image, make_square_image, more_tests, save_crop

def predict_on_video(video_path, fps, device, facedet, output_dir=""):
    '''
    Detects if eyes are open or closed per video frame.
    
    Args:
        video_path: directory of video file.
        fps: # of frames to extract per second.
        device: source to run model (CPU, GPU).
        facedet: blazeface training weights.
        output_dir: location for the .txt file, optional parameter.
    
    Returns:
        int value to end function early.
    '''

    print('\npredict_on_video()')

    # Set up libraries
    cwd = os.getcwd()
    sys.path.insert(0,cwd +  "/imports/inference")

    # import libraries
    from helpers.read_video_1 import VideoReader
    from helpers.face_extract_1 import FaceExtractor

    # Retrieve video time span
    video_data=cv2.VideoCapture(video_path)
    total_seconds=round((video_data.get(cv2.CAP_PROP_FRAME_COUNT))/(video_data.get(cv2.CAP_PROP_FPS)),2)
    total_frames=math.floor(fps*total_seconds)

    # Get the face from an image
    video_reader = VideoReader()
    frames_per_video = total_frames
    video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)
    face_extractor = FaceExtractor(video_read_fn, facedet)

    # face_extractor extracts total_frames number of frames 
    # from the entire video runtime.
    faces = face_extractor.process_video(video_path)
    # If there are multiple people in the video, use one face
    face_extractor.keep_only_best_face(faces)

    input_size =224
    mean = [0.43216, 0.394666, 0.37645]
    std = [0.22803, 0.22145, 0.216989]
    normalize_transform = Normalize(mean,std)

    class MyResNeXt(models.resnet.ResNet):
        def __init__(self, training=True):
            super(MyResNeXt, self).__init__(block=models.resnet.Bottleneck,
                                            layers=[3, 4, 6, 3], 
                                            groups=32, 
                                            width_per_group=4)
            self.fc = nn.Linear(2048, 1)

    checkpoint = torch.load(cwd + "/imports/inference/resnext.pth", map_location=device)
    model = MyResNeXt().to(device)
    model.load_state_dict(checkpoint)
    _ = model.eval()
    del checkpoint

    # put it all in a list then append to the .txt file
    if(output_dir!=""):
        full_name=os.path.join(output_dir,"result_DFD.txt")
    else:
        full_name="result_DFD.txt"
    file_write = open(full_name,"w")
    result=list()

    try:        
        if len(faces) > 0:
            x = np.zeros((total_frames, input_size, input_size, 3), dtype=np.uint8)
            n = 0
            for frame_data in faces:
                for face in frame_data["faces"]:
                    resized_face = isotropically_resize_image(face, input_size)
                    resized_face = make_square_image(resized_face)
                    if n < total_frames:
                        x[n] = resized_face
                        n += 1
            if n > total_frames:
                temp="WARNING: have "+str(n)+" faces but batch size is "+str(total_frames)+'\n'
                result.append(temp)

            if n > 0:
                x = torch.tensor(x, device=device).float()
                x = x.permute((0, 3, 1, 2))

                for i in range(len(x)):
                    x[i] = normalize_transform(x[i] / 255.)
                with torch.no_grad():
                    y_pred = model(x)
                    y_pred = torch.sigmoid(y_pred.squeeze())
                    data_res=y_pred[:n].mean().item()
                    result.append(str(round(data_res*100,2))+"%")
                    file_write.writelines(result)
                    file_write.close()

                    # Print contents
                    file_read = open(full_name,"r")
                    print(file_read.read())
                    return 0

    except Exception as e:
        print("Prediction error on video "+str(video_path)+": "+str(e)+"\n")

    result.append("50.0%")
    file_write.writelines(result)
    file_write.close()

    # Print contents
    file_read = open(full_name,"r")
    print(file_read.read())
    file_read.close()
    return 0.5

def blink_on_video(video_path, fps, facedet, use_model, output_dir=""):
    '''
    Detects if eyes are 'open' or 'closed' per video frame. If a face was 
    detected by FaceExtractor but unable to be cropped by face_recognition, 
    then it is given an 'unknown' classification. The difference between 
    total_frames and sizeof(faces) are all given classifications of 
    'Face DNE'.
    
    Args:
        video_path: directory of video file.
        fps: # of frames to extract per second.
        facedet: blazeface training weights.
        use_model: vgg16() model ready for use.
        output_dir: location for the .txt file, optional parameter.
    
    Returns:
        A list of size 4 that has the percentile distribution of video
        frame classifications.
    '''

    print('\nblink_on_video()')

    # Set up libraries
    cwd = os.getcwd()
    sys.path.insert(0,cwd +  "/imports/inference")

    # import libraries
    from helpers.read_video_1 import VideoReader
    from helpers.face_extract_1 import FaceExtractor

    # delete all frames from a previous run
    temp_dir= "example_videos/temp/"
    all_temp_files=[temp_dir+"o.png",temp_dir+"p.png",temp_dir+"beard.png"]
    for i in range(0,len(all_temp_files)):
        if os.path.exists(all_temp_files[i]):
            os.remove(all_temp_files[i])

    # Retrieve video time span
    video_data=cv2.VideoCapture(video_path)
    total_seconds=round((video_data.get(cv2.CAP_PROP_FRAME_COUNT))/(video_data.get(cv2.CAP_PROP_FPS)),2)
    total_frames=math.floor(fps*total_seconds)

    # Get the face from an image
    video_reader = VideoReader()
    frames_per_video = total_frames
    video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)
    face_extractor = FaceExtractor(video_read_fn, facedet)

    # Put it all in a list then append to the .txt file
    if(output_dir!=""):
        full_name=os.path.join(output_dir,"result_blink.txt")
    else:
        full_name="result_blink.txt"
    file_write = open(full_name,"w")
    result=list()

    # face_extractor extracts total_frames number of frames 
    # from the entire video runtime.
    try:
        faces = face_extractor.process_video(video_path)
        # If there are multiple people in the frame, use one face
        face_extractor.keep_only_best_face(faces)
    except Exception as e:
        print("Prediction error on video "+str(video_path)+": "+str(e)+"\n")
        result.append("Amount of missing frames: 0.0%\nAmount of unknown frames: 0.0%\nAmount of open eyes frames: 0.0%\nAmount of closed eyes frames: 0.0%")
        file_write.writelines(result)
        file_write.close()
        file_read = open(full_name,"r")
        print(file_read.read())
        file_read.close()
        return [0,0,0,0]

    input_size =224

    # Get eye blink classifications per frame
    all_open=0
    all_closed=0
    all_unknown=0
    all_missing=0

    # Keep track of all classifications in a list.
    # -1 if unknown frame, 1 if eyes open frame, and 0 if eyes closed frame.
    classifications=list()

    if len(faces) > 0:
        for frame_data in faces:
            for face in frame_data["faces"]:
                resized_face = isotropically_resize_image(face, input_size)
                resized_face = make_square_image(resized_face)
                plt.imshow(resized_face, interpolation='nearest')
                # o stands for original
                file_name_save_o='example_videos/temp/o.png'
                plt.savefig(file_name_save_o)
                # save a zoomed in photo in preparation for beard detection
                file_name_save_beard='example_videos/temp/beard.png'
                plt.axis('off')
                plt.savefig(file_name_save_beard, bbox_inches='tight', pad_inches=0)
                # ensure equivalent o.png dimensions, regardless of .py or .ipynb
                read_o=cv2.imread(file_name_save_o)
                dimensions=(432,288)
                resized=cv2.resize(read_o, dimensions)
                cv2.imwrite(file_name_save_o, resized)
                # successfully resized w/ same name
                # p stands for cropped
                crop_result=save_crop('o.png', 'p.png','example_videos/temp/')
                if(crop_result==False):
                    all_unknown+=1
                    classifications.append(-1)
                    print("all_unknown:",all_unknown)
                else:
                    current=more_tests(use_model, 'example_videos/temp')
                    if current==1:
                        all_open+=1
                        classifications.append(1)
                        print("all_open:",all_open)
                    else:
                        all_closed+=1
                        classifications.append(0)
                        print("all_closed:",all_closed)
                plt.show()
                plt.clf()

    # Timestamp of each video frame and classification written to a dataframe.
    blinks_df= pd.DataFrame(columns=['Timestamp (s)','Classification'])
    for i in range(0,total_frames): 
        blinks_df.loc[i, 'Timestamp (s)'] = round(i*(total_seconds/(total_frames-1)),2)
        # if more than 5% of frames are missing or classifications[i] is out of bounds,
        # don't put a valid classification in the row
        if((len(classifications)<(0.95*total_frames)) | (i>=(len(classifications)))):
            blinks_df.loc[i, 'Classification'] = math.nan
        else:
            blinks_df.loc[i, 'Classification'] = classifications[i]
    # Save the dataframe as a .csv file
    blinks_df.to_csv("../src/pages/AllResults/eyeblink_data.csv", index=False)

    # Obtain the percentiles for each classification
    if (all_open+all_closed+all_unknown)<(total_frames):
        all_missing=total_frames-(all_open+all_closed+all_unknown)
    temp="Amount of missing frames: "+str(round((all_missing/(all_open+all_closed+all_unknown+all_missing))*100,2))+"%\n"
    result.append(temp)
    temp="Amount of unknown frames: "+ str(round((all_unknown/(all_open+all_closed+all_unknown+all_missing))*100,2)) +"%\n"
    result.append(temp)
    temp="Amount of open eyes frames: "+str(round((all_open/(all_open+all_closed+all_unknown+all_missing))*100,2))+"%\n"
    result.append(temp)
    temp="Amount of closed eyes frames: "+str(round((all_closed/(all_open+all_closed+all_unknown+all_missing))*100,2))+"%"
    result.append(temp)
    file_write.writelines(result)
    file_write.close()

    # Print contents
    file_read = open(full_name,"r")
    print(file_read.read())
    file_read.close()

    # Print and return perctile distributions list
    final_percents=[round((all_missing/(all_open+all_closed+all_unknown+all_missing))*100, 2),
                    round((all_unknown/(all_open+all_closed+all_unknown+all_missing))*100, 2),
                    round((all_open/(all_open+all_closed+all_unknown+all_missing))*100, 2),
                    round((all_closed/(all_open+all_closed+all_unknown+all_missing))*100, 2)]
    print(final_percents)
    return final_percents

def detect_beard(image_dir, output_dir=""):
    '''
    Detects an adult male from image.
    
    Args:
        image_dir: directory of input image.
        output_dir: location for the .txt file, optional parameter.
        
    Returns:
        None
    '''

    print('\ndetect_beard()')

    # store all relevant information in a .txt file
    if(output_dir!=""):
        full_name=os.path.join(output_dir,"result_beard.txt")
    else:
        full_name="result_beard.txt"
    file_write = open(full_name,"w")

    # perform analysis if the image exists
    if(os.path.exists(image_dir)):
        # Read image
        img2 = cv2.imread(image_dir)

        # DeepFace expects a 152 by 152 sized image as input
        dimensions=(152,152)
        resized=cv2.resize(img2, dimensions)

        # Save this image to a temporary directory for later input to DeepFace
        cwd = os.getcwd()
        img2_path = cwd + "/example_videos/temp/beard.png"

        # Save image
        cv2.imwrite(img2_path, resized)

        # Put it all in a list then append to the .txt file
        result=list()
        obj = DeepFace.analyze(img_path = img2_path, 
                            actions = ['age', 'gender'],
                            enforce_detection=False)
        temp="   Age: "+str(obj["age"])+'\n'
        result.append(temp)
        temp="Gender: "+str(obj["gender"])+'\n'
        result.append(temp)

        # write to file
        file_write.writelines(result)
        file_write.close()
    # otherwise
    else:
        file_write.writelines(["   Age: ??\nGender: ??"])
        file_write.close()

    # Print contents
    file_read = open(full_name,"r")
    print(file_read.read())
    file_read.close()

def detect_shades(image_dir1, output_dir="", image_dir2=""):
    '''
    Uses the default VGG16 model for image classification.
    VGG16 is able to detect 1000 object types in photos.
    We are focusing on sunglasses classification.
    
    Args:
        image_dir1: directory of first input image.
        output_dir: location for the .txt file, optional parameter.
        image_dir2: directory of cropped version of first input image, optional parameter.
    
    Returns:
        None
    '''

    print('\ndetect_shades()')

    # store all relevant information in a .txt file
    if(output_dir!=""):
        full_name=os.path.join(output_dir,"result_shades.txt")
    else:
        full_name="result_shades.txt"
    file_write = open(full_name,"w")

    # format of Top 5 Object Detection Predictions
    predict_template="????? (0.0%)\n????? (0.0%)\n????? (0.0%)\n????? (0.0%)\n????? (0.0%)"

    # put it all in a list then append to the .txt file
    result=list()

    # perform analysis if the image exists. otherwise, file DNE.
    if(os.path.exists(image_dir1)):
        result.append('ORIGINAL\nTop 5 Object Detection Predictions\n')

        # resizes an image to required VGG16 dimensions.
        image = load_img(image_dir1, target_size=(224, 224))
        # convert the image pixels to a numpy array
        image = img_to_array(image)
        # reshape data for the model
        image = image.reshape((1, image.shape[0], image.shape[1], image.shape[2]))
        # prepare the image for the VGG model
        image = preprocess_input(image)
        # load the model
        model = VGG16()
        # predict the probability across all output classes
        yhat = model.predict(image)
        # convert the probabilities to class labels
        label = decode_predictions(yhat)

        # label 'n04356056' is 'sunglasses, dark glasses, shades'
        for i in range(0,5):
            result.append('%s (%.2f%%)\n' % (label[0][i][1], label[0][i][2]*100))
    else:
        result.append('ORIGINAL (file DNE)\nTop 5 Object Detection Predictions\n')
        result.append(predict_template+'\n')

    # perform analysis if the user gave an argument. otherwise, file argument missing.
    if(image_dir2!=""):
        # perform analysis if the image exists. otherwise, file DNE.
        if(os.path.exists(image_dir2)):
            image = load_img(image_dir2, target_size=(224, 224))
            image = img_to_array(image)
            image = image.reshape((1, image.shape[0], image.shape[1], image.shape[2]))
            image = preprocess_input(image)
            model = VGG16()
            yhat = model.predict(image)
            label = decode_predictions(yhat)
            result.append('\nCROPPED\nTop 5 Object Detection Predictions\n')
            for i in range(0,5):
                result.append('%s (%.2f%%)\n' % (label[0][i][1], label[0][i][2]*100))
        else:
            result.append("\nCROPPED (file DNE)\nTop 5 Object Detection Predictions\n")
            result.append(predict_template)
    else:
        result.append("\nCROPPED (file argument missing)\nTop 5 Object Detection Predictions\n")
        result.append(predict_template)

    # write result to file
    file_write.writelines(result)
    # close file
    file_write.close()
    # print contents
    file_read = open(full_name,"r")
    print(file_read.read())
    file_read.close()