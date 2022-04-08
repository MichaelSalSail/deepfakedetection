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

// all major classifications for eye blink model
const blink_classes=["missing","unknown","open","closed"];
// default values for model outputs
const default_values={"models": require('../utils/AllResultsJSON/result_default.json')}
// cumulative total of file uploads and 'Generate Results' clicks
let data_switched = 0;
// current file duration (sec).
let fileduration = 1;
// contain the settimeout() for progress bar
var progress_timeout;

export default function DashboardApp() {
  // current uploaded file
  const [file, setFile] = useState('');
  // current file name.
  const [filename, setFilename] = useState('');
  // current file data
  const [selectedFile, setSelectedFile] = useState(null);
  // disable/enable submit button
  const [submit, setSubmit] = useState(true);
  // keep track of whether the last POST request was successful
  const [goodsubmit, setGoodsubmit] = useState(false);
  // file name used on last 'Generate Results' run
  const [lastfilerun, setlastfilerun] = useState('');
  // contain all outputs from GET requests
  const [results, setResults] = useState(default_values);

  // alerts
  const [error, setError] = useState(false);
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
      console.log("progressBarDone set to true in wait_for_models()")
    }, estimate_runtime(fileduration, data_switched===0)*100);
  };

  const onFileChange = (data) => {
    // close any open alerts
    setError(false);
    setInfo(false);

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
      reader.readAsDataURL(data.target.files[0]);
      // obtain url to play the video
      setFile(URL.createObjectURL(data.target.files[0]));
      // if the same video file was uploaded, nothing should change.
      // successful file upload change should enable 'Submit' button & reset goodsubmit value.
      if(filename!=(data.target.files[0]['name']))
      {
        setSubmit(false)
        setGoodsubmit(false)
      }
      // get filename for the info alert
      setFilename(data.target.files[0]['name']);
      // reset last file run to default value
      setlastfilerun('');
      // get file data
      setSelectedFile(data.target.files[0])
      // set the results to default upon file upload
      if((data_switched%2)===1)
        switched();
    }
    catch(error)
    {
      console.log("Failed to select video!")
    }
  };

  // POST request: save the current video in the backend as model input
  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmit(true)
    var formData = new FormData();
    formData.append("file", selectedFile)
    if((formData.getAll("file"))[0]["size"]>50000000)
      console.log("Failed to save video. Over 50MB file size!");
    else
    {
      axios.post('http://localhost:5000/home/upload', formData)
      .then(function () {
        console.log("Successfully saved %s!",(formData.getAll("file"))[0]["name"]);
        setGoodsubmit(true)
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }

  // GET request: receive model outputs
  const obtainResults = () => {
    axios.get('http://localhost:5000/home/results')
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
      console.log("progressBarDone set to false in obtainResults()")
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
    <form onSubmit={handleSubmit}>
      <Page title="Application">
        <Container maxWidth="xl">
          {/* Two possible alerts, an error or information message. */}
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
              Unable to generate results. Missing video file or failed to save video.
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
                disabled={modelLoading}
                type="file"
                accept=".mp4"
                onChange={onFileChange}
              />
              {/* The 'Upload Video' button shouldn't be accessible while
                  the models are still generating outputs.*/}
              <label htmlFor="file-upload">
                {modelLoading ? (
                  <LoadingButton loading={modelLoading} />
                ) : (
                  <Button
                    disabled={modelLoading}
                    component="span"
                    variant="contained"
                  >
                    Upload Video
                  </Button>
                )}
              {/* Upon fulfilling certain conditions, clicking 'Generate Results'
                  may return an error or information message. */}
              </label>
                {modelLoading ? (
                  <LoadingButton loading={modelLoading} />
                ) : (
                  <Button
                    disabled={error || info || modelLoading}
                    style={{ marginLeft: 10 }}
                    component="span"
                    variant="contained"
                    onClick={() => {
                      if(goodsubmit==false)
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
            <input
                type="submit"
                disabled={submit}
            />
          </Box>
          {/* Upon successful upload of a video, the user may watch the video. */}
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
          {/* While waiting for model outputs, display a progress bar.
              If the progress bar w/ label finished but the GET request
              hasn't finished, show an indeterminate progress bar. */}
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
          {/* Once the model(s) finish loading, display the outputs. */}
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
                process.env.PUBLIC_URL + "/static/raw-data/eyeblink_data.csv",
                "eyeblink_data.csv");
            }}
          >Excel</Button>
            
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
    </form>
  );
}