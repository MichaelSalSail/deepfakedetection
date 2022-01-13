import cv2
import os, sys
import numpy as np
import math
from moviepy.editor import VideoFileClip
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

# CODE WE COULD CHANGE:
# predict_on_video and blink_on_video could be combined into
# one function. It would reduce latency. 

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
    total_seconds=VideoFileClip(video_path).duration
    total_frames=math.floor(fps*total_seconds)

    # Get the face from an image
    video_reader = VideoReader()
    frames_per_video = total_frames
    video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)
    face_extractor = FaceExtractor(video_read_fn, facedet)

    # face_extractor extracts total_frames number of frames 
    # from the entire video runtime.
    faces = face_extractor.process_video(video_path)
    # If there are multiple people in the frame, use one face
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
    full_name=output_dir+"/"+"result_DFD.txt"
    #file_write = open(full_name,"w")
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
                    #result.append(str(data_res))
                    #file_write.writelines(result)
                    #file_write.close()

                    # Print contents
                    #file_read = open(full_name,"r")
                    #print(file_read.read())
                    #print("data_result:" + str(data_res))
                    return data_res

    except Exception as e:
        temp="Prediction error on video "+str(video_path)+": "+str(e)+"\n"
        result.append(temp)

    #result.append(str(0.5))
    #file_write.writelines(result)
    #file_write.close()

    # Print contents
    #file_read = open(full_name,"r")
    #print(file_read.read())

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

    # Retrieve video time span
    total_seconds=VideoFileClip(video_path).duration
    total_frames=math.floor(fps*total_seconds)

    # Get the face from an image
    video_reader = VideoReader()
    frames_per_video = total_frames
    video_read_fn = lambda x: video_reader.read_frames(x, num_frames=frames_per_video)
    face_extractor = FaceExtractor(video_read_fn, facedet)

    # face_extractor extracts total_frames number of frames 
    # from the entire video runtime.
    faces = face_extractor.process_video(video_path)
    # If there are multiple people in the frame, use one face
    face_extractor.keep_only_best_face(faces)

    # Put it all in a list then append to the .txt file
    full_name=output_dir+"/"+"result_blink.txt"
    file_write = open(full_name,"w")
    result=list()

    input_size =224

    # Get eye blink classifications per frame
    all_open=0
    all_closed=0
    all_unknown=0
    all_missing=0
    if len(faces) > 0:
        for frame_data in faces:
            for face in frame_data["faces"]:
                resized_face = isotropically_resize_image(face, input_size)
                resized_face = make_square_image(resized_face)
                plt.imshow(resized_face, interpolation='nearest')
                file_name_save='example_videos/temp/o.png'
                plt.savefig(file_name_save)
                # ensure equivalent .png dimensions, regardless of .ipynb or .py
                read_o=cv2.imread(file_name_save)
                dimensions=(432,288)
                resized=cv2.resize(read_o, dimensions)
                cv2.imwrite(file_name_save, resized)
                # successfully resized w/ same name
                crop_result=save_crop('o.png', 'p.png','example_videos/temp/')
                if(crop_result==False):
                    all_unknown+=1
                    print("all_unknown:",all_unknown)
                else:
                    current=more_tests(use_model, 'example_videos/temp')
                    if current==1:
                        all_open+=1
                        print("all_open:",all_open)
                    else:
                        all_closed+=1
                        print("all_closed:",all_closed)
                #plt.show()
                plt.clf()
    # CODE TO ADD:
    # Timestamp of each video frame and classfication in an excel sheet
    if (all_open+all_closed+all_unknown)<(total_frames):
        all_missing=total_frames-(all_open+all_closed+all_unknown)
    temp="Amount of missing frames: "+str((all_missing/(all_open+all_closed+all_unknown+all_missing))*100)+"%\n"
    result.append(temp)
    temp="Amount of unknown frames: "+ str((all_unknown/(all_open+all_closed+all_unknown+all_missing))*100) +"%\n"
    result.append(temp)
    temp="Amount of open eyes frames: "+str((all_open/(all_open+all_closed+all_unknown+all_missing))*100)+"%\n"
    result.append(temp)
    temp="Amount of closed eyes frames: "+str((all_closed/(all_open+all_closed+all_unknown+all_missing))*100)+"%"
    result.append(temp)
    file_write.writelines(result)
    file_write.close()

    # Print contents
    file_read = open(full_name,"r")
    print(file_read.read())

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

    # Run analysis
    full_name=output_dir+"/"+"result_beard.txt"
    file_write = open(full_name,"w")
    # Put it all in a list then append to the .txt file
    result=list()
    obj = DeepFace.analyze(img_path = img2_path, 
                           actions = ['age', 'gender'],
                           enforce_detection=False)
    temp="   Age: "+str(obj["age"])+'\n'
    result.append(temp)
    temp="Gender: "+str(obj["gender"])+'\n'
    result.append(temp)
    if (obj["age"]>=20 and obj["gender"]=='Man'):
        result.append("There appears to be an adult male. Beards are hard to deepfake.")
    file_write.writelines(result)
    file_write.close()

    # Print contents
    file_read = open(full_name,"r")
    print(file_read.read())

def detect_shades(image_dir, output_dir=""):
    '''
    Uses the default VGG16 model for image classification.
    VGG16 is able to detect 1000 object types in photos.
    We are focused on sunglasses classification.
    
    Args:
        image_dir: directory of input image.
        output_dir: location for the .txt file, optional parameter.
    
    Returns:
        None
    '''

    print('\ndetect_shades()')

    # resizes an image to required VGG16 dimensions.
    image = load_img(image_dir, target_size=(224, 224))

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

    # store all relevant information in a .txt file
    full_name=output_dir+"/"+"result_shades.txt"
    file_write = open(full_name,"w")

    # put it all in a list then append to the .txt file
    result=list()
    result.append('Top 5 Object Detection Predictions\n')
    top_5_shades=False
    for i in range(0,5):
        result.append('%s (%.2f%%)\n' % (label[0][i][1], label[0][i][2]*100))
        # label 'n04356056' is 'sunglasses, dark glasses, shades'
        if (label[0][i][0]=='n04356056'):
            top_5_shades=True
    if (top_5_shades==True):
        result.append("There appears to be sunglasses. Larger glasses are hard to deepfake.")
    else:
        result.append("No sunglasses detected.")
    file_write.writelines(result)
    file_write.close()

    # Print contents
    file_read = open(full_name,"r")
    print(file_read.read())
