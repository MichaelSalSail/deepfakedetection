import {useState} from "react";
// material
import {
  Box,
  Grid,
  Container,
  Typography,
  Button,
  Card,
  CardHeader,
  CardContent,
  Alert,
  IconButton,
  Collapse
} from "@mui/material";
import LoadingButton from "@mui/lab/node/LoadingButton/index.js";
import ReactPlayer from "react-player";
import CloseIcon from '@mui/icons-material/Close';
import LinearProgress from '@mui/material/LinearProgress';
// components
import Page from "../components/Page.js";
import {
  Eyeblinks,
  OtherOutputs,
  DFDscore,
  PopUp_Help,
  Display_Wait
} from "../components/_dashboard/app/index.js";
import estimate_runtime from "../utils/Wait.js";
import FileSaver from 'file-saver';

import axios from "axios";

const MAX_VIDEO_BYTES = 50000000;

// all major classifications for eye blink model
const blink_classes=["missing","unknown","open","closed"];
// default values for model outputs
const default_values={"models": require('../utils/result_default.json')}
// cumulative total of file uploads and 'Generate Results' clicks
let data_switched = 0;
// current file duration (sec).
let fileduration = 1;
// contain the settimeout() for progress bar
var progress_timeout;

export default function DashboardApp() {
  // current uploaded file preview URL
  const [file, setFile] = useState('');
  // current file name.
  const [filename, setFilename] = useState('');
  // true after the backend has saved the current video file
  const [videoSaved, setVideoSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  // file name used on last 'Generate Results' run
  const [lastfilerun, setlastfilerun] = useState('');
  // contain all outputs from GET requests
  const [results, setResults] = useState(default_values);

  // alerts
  const [error, setError] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [info, setInfo] = useState(false);

  // the model starts loading when a user clicks 'Generate Results' and finishes once the GET request is received.
  const [modelLoading, setModelLoading] = useState(false);
  // has the progress bar w/ value finished?
  const [progressBarDone, setProgressBarDone] = useState(false);

  // increment data_switched each time a new file is uploaded or 'Generate Results' completes a GET request
  const switched = () => {
    data_switched+=1;
  };

  const wait_for_models = () => {
    setModelLoading(true);
    console.log("Video has a duration of", fileduration, "seconds.");
    console.log("Will this have a first video runtime delay?", data_switched===0);
    console.log("Each progress bar tick will take", estimate_runtime(fileduration, data_switched===0), "milliseconds");
    obtainResults();
    // once the time is up for progress bar w/ value, the progress bar is done
    progress_timeout=setTimeout(() => {
      setProgressBarDone(true);
    }, estimate_runtime(fileduration, data_switched===0)*100);
  };

  const saveVideoToBackend = (fileToSave) => {
    if (!fileToSave) {
      return;
    }

    if (fileToSave.size > MAX_VIDEO_BYTES) {
      console.log("Failed to save video. Over 50MB file size!");
      setUploading(false);
      setVideoSaved(false);
      setUploadSuccess(false);
      setUploadError(true);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileToSave);

    axios.post('http://localhost:5001/home/upload', formData)
      .then(function () {
        console.log("Successfully saved %s!", fileToSave.name);
        setVideoSaved(true);
        setUploadSuccess(true);
        setUploadError(false);
      })
      .catch(function (err) {
        console.log(err);
        setVideoSaved(false);
        setUploadSuccess(false);
        setUploadError(true);
      })
      .finally(function () {
        setUploading(false);
      });
  };

  const onFileChange = (data) => {
    // close any open alerts
    setError(false);
    setInfo(false);
    setUploadError(false);
    setUploadSuccess(false);

    // reset results to default
    setResults(default_values)

    // obtain the video duration
    var reader = new FileReader();
    reader.onload = function() {
      var media = new Audio(reader.result);
      media.onloadedmetadata = function(){
           fileduration = Number((media.duration).toFixed(2));
           return media.duration;
      };
    };
    try
    {
      const pickedFile = data.target.files[0];
      reader.readAsDataURL(pickedFile);
      // obtain url to play the video
      setFile(URL.createObjectURL(pickedFile));
      // get filename for the info alert
      setFilename(pickedFile['name']);
      // reset last file run to default value
      setlastfilerun('');
      setVideoSaved(false);
      setUploading(true);
      saveVideoToBackend(pickedFile);
      // set the results to default upon file upload
      if((data_switched%2)===1)
        switched();
    }
    catch(err)
    {
      console.log("Failed to select video!")
      setUploading(false);
      setUploadError(true);
    }
  };

  // GET request: receive model outputs
  const obtainResults = () => {
    axios.get('http://localhost:5001/home/results')
    .then(response => {
      // convert int values to boolean values
      var temp=response["data"]
      temp["models"][2]["beard"]=Boolean(temp["models"][2]["beard"])
      temp["models"][3]["shades"]=Boolean(temp["models"][3]["shades"])
      setResults(temp)
      // the process attached w/ 'Generate Results' has ended, update the count
      switched();
      // the request is complete, remove all loading icons and progress bars
      setProgressBarDone(false);
      setModelLoading(false);
      // clear the lingering timeout() from wait_for_models()
      clearTimeout(progress_timeout);
      console.log("Successfully loaded model outputs!")
    }).catch(error => {
      switched();
      setProgressBarDone(false);
      setModelLoading(false);
      clearTimeout(progress_timeout);
      console.log(error)
    })
  }
  

  return (
    <Page title="Application">
      <Container maxWidth="xl">
        <Collapse in={error}>
          <Alert severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setError(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Unable to generate results. Upload a video and wait until it is saved on the server.
          </Alert>
        </Collapse>
        <Collapse in={uploadError}>
          <Alert severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setUploadError(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Could not save video. Check that the backend is running, the file is under 50MB, and try again.
          </Alert>
        </Collapse>
        <Collapse in={uploadSuccess}>
          <Alert severity="success"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setUploadSuccess(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {filename} saved for analysis. Click Generate Results when ready.
          </Alert>
        </Collapse>
        <Collapse in={info}>
          <Alert severity="info"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setInfo(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Results for {filename} are available below.
          </Alert>
        </Collapse>
        <Box sx={{ pb: 5 }}>
          <Typography variant="h4">Deepfake Video Analysis</Typography>
          <Box flexDirection="row">
            <input
              id="file-upload"
              hidden
              disabled={modelLoading || uploading}
              type="file"
              accept=".mp4"
              onChange={onFileChange}
            />
            <label htmlFor="file-upload">
              {modelLoading || uploading ? (
                <LoadingButton loading variant="contained">
                  {uploading ? "Saving video..." : "Loading"}
                </LoadingButton>
              ) : (
                <Button
                  disabled={modelLoading}
                  component="span"
                  variant="contained"
                >
                  Upload Video
                </Button>
              )}
            </label>
            {modelLoading ? (
              <LoadingButton loading={modelLoading} sx={{ ml: 1 }} />
            ) : (
              <Button
                disabled={error || info || modelLoading || uploading || !videoSaved}
                style={{ marginLeft: 10 }}
                component="span"
                variant="contained"
                onClick={() => {
                  if(!videoSaved)
                    setError(true);
                  else if(lastfilerun===file)
                    setInfo(true);
                  else
                  {
                    setlastfilerun(file);
                    wait_for_models();
                  }
                }}
              >
                Generate Results
              </Button>
            )}
            <PopUp_Help/>
          </Box>
        </Box>
        <Card>
          <CardHeader
            title={<Typography variant="overline" align="center">Video File</Typography>}
          />
          <Box
            sx={{ p: 3 }}
            style={{ width: "100%", height: "100%" }}
            dir="ltr"
          >
            <ReactPlayer
              style={{ flex: 1 }}
              url={file}
              controls
              width="100%"
              height="100%"
            />
          </Box>
        </Card>
        {modelLoading ? (
          (progressBarDone && results["models"][0]["DFD"]===0) ? (
            <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }} justifyContent="center">
              <Grid item xs={12}></Grid>
                <Grid item xs={8}>
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                  </Box>
                </Grid>
              <Grid item xs={12}></Grid>
            </Grid>
            ) : (
            <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }} justifyContent="center">
              <Grid item xs={12}></Grid>
                <Grid item xs={8}>
                  <Display_Wait per_increment={estimate_runtime(fileduration, data_switched===0)}/>
                </Grid>
              <Grid item xs={12}></Grid>
            </Grid>
            )
        ) : (
          <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid item xs={12}></Grid>
            <Grid item xs={12}></Grid>
          </Grid>
        )}
        <Typography variant="h4" align="center">Results</Typography>
        <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            <Grid item xs={12}></Grid>
            <Grid item xs={12}></Grid>
        </Grid>
        <Typography variant="overline" align="center">Base Model</Typography>
        <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid item xs={12}></Grid>
          <Grid item xs={12}>
            <DFDscore results={results}/>
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>

        <Typography variant="overline" align="center">Eye Blink Model</Typography>
        <Button
          disabled={data_switched%2===0}
          style={{ marginLeft: 10 }}
          component="span"
          variant="text"
          color="secondary"
          onClick={() => {
            FileSaver.saveAs(
              "http://localhost:5001/home/eyeblink_csv",
              "eyeblink_data.csv");
          }}
        >Download frame data (CSV)</Button>
          
        <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid item xs={12}></Grid>
          <Grid item xs={3}>
            <Eyeblinks results={results} color_card={blink_classes[0]} />
          </Grid>
          <Grid item xs={3}>
            <Eyeblinks results={results} color_card={blink_classes[1]} />
          </Grid>
          <Grid item xs={3}>
            <Eyeblinks results={results} color_card={blink_classes[2]} />
          </Grid>
          <Grid item xs={3}>
            <Eyeblinks results={results} color_card={blink_classes[3]} />
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>

        <Typography variant="overline" align="center">Other Models</Typography>
        <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid item xs={12}></Grid>
          <Grid item xs={12}>
            <OtherOutputs results={results}/>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}
