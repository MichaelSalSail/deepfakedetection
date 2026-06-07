import {useState, useEffect} from "react";
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
  Collapse,
  Tooltip,
} from "@mui/material";
import LoadingButton from "@mui/lab/node/LoadingButton/index.js";
import ReactPlayer from "react-player";
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

const BASE_MODEL_HELP =
  "In our testing, the base model is most likely to yield incorrect predictions in the yellow range. " +
  "Use the Subject model outputs to draw any final conclusions. " +
  "A green score indicates a genuine video; a red score indicates a deepfake.";

const EYE_BLINK_HELP =
  "The eye blink model returns two classifications (open and closed eyes). " +
  "For clarity, we show four categories: Missing (no face detected), Unknown (face detected but only partially visible), Open, and Closed. " +
  "All other frames are sent to the model and classified as open or closed eyes. " +
  "Per-frame classifications are in the downloadable CSV.";

const ANALYSIS_STALE_MESSAGE =
  "Results did not update. Analysis may still be running, may not have started, or may have failed — " +
  "try again and use a shorter video if the process ran out of memory.";

const ANALYSIS_REQUEST_FAILED_MESSAGE =
  "Could not load results from the backend. Check that Flask is running on port 5001 " +
  "and that analysis completed successfully.";

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
  const [uploadSuccessKey, setUploadSuccessKey] = useState(0);
  const [info, setInfo] = useState(false);
  const [analysisError, setAnalysisError] = useState(false);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState("");

  // the model starts loading when a user clicks 'Generate Results' and finishes once the GET request is received.
  const [modelLoading, setModelLoading] = useState(false);
  // has the progress bar w/ value finished?
  const [progressBarDone, setProgressBarDone] = useState(false);
  // cache-bust subject face crop after each successful results fetch
  const [subjectImageKey, setSubjectImageKey] = useState(0);

  useEffect(() => {
    if (!uploadSuccess) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setUploadSuccess(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, [uploadSuccess]);

  // increment data_switched each time a new file is uploaded or 'Generate Results' completes a GET request
  const switched = () => {
    data_switched+=1;
  };

  const wait_for_models = () => {
    setAnalysisError(false);
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
        setUploadSuccessKey((key) => key + 1);
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
    setAnalysisError(false);

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
      setSubjectImageKey(Date.now())
      // the process attached w/ 'Generate Results' has ended, update the count
      switched();
      // the request is complete, remove all loading icons and progress bars
      setProgressBarDone(false);
      setModelLoading(false);
      // clear the lingering timeout() from wait_for_models()
      clearTimeout(progress_timeout);
      if (temp["models"][0]["DFD"] === 0) {
        setAnalysisErrorMessage(ANALYSIS_STALE_MESSAGE);
        setAnalysisError(true);
      }
      console.log("Successfully loaded model outputs!")
    }).catch(error => {
      switched();
      setProgressBarDone(false);
      setModelLoading(false);
      clearTimeout(progress_timeout);
      setAnalysisErrorMessage(ANALYSIS_REQUEST_FAILED_MESSAGE);
      setAnalysisError(true);
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
            sx={{ mb: 2, position: "relative", overflow: "hidden" }}
          >
            {filename} saved for analysis. Click Generate Results when ready.
            <Box
              key={uploadSuccessKey}
              aria-hidden
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                bgcolor: "success.main",
                opacity: 0.35,
                transformOrigin: "left center",
                animation: "uploadAlertProgress 7s linear forwards",
                "@keyframes uploadAlertProgress": {
                  from: { transform: "scaleX(1)" },
                  to: { transform: "scaleX(0)" },
                },
              }}
            />
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
        <Collapse in={analysisError}>
          <Alert severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setAnalysisError(false);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {analysisErrorMessage}
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
                  setUploadSuccess(false);
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
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            MP4 only, up to 50MB.
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mt: 2, mb: 1.5 }}>
          Results
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Box sx={{ width: { xs: "100%", md: "70%" }, minWidth: 0 }}>
            <Card sx={{ height: "100%" }}>
              <CardHeader
                title={<Typography variant="overline" align="center">Video File</Typography>}
                sx={{ py: 1.5 }}
              />
              <Box sx={{ px: 2, pb: 2 }} dir="ltr">
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    pt: "56.25%",
                    bgcolor: "grey.900",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  <ReactPlayer
                    url={file}
                    controls
                    width="100%"
                    height="100%"
                    style={{ position: "absolute", top: 0, left: 0 }}
                  />
                </Box>
              </Box>
            </Card>
          </Box>

          <Box
            sx={{
              width: { xs: "100%", md: "30%" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Base Model
                </Typography>
                <Tooltip title={BASE_MODEL_HELP} arrow placement="left">
                  <IconButton size="small" aria-label="About base model" sx={{ mt: -0.5 }}>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <DFDscore results={results} />
            </Box>

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Subject
              </Typography>
              <Box sx={{ flex: 1, display: "flex", minHeight: 0, width: "100%" }}>
                <OtherOutputs
                  results={results}
                  analysisComplete={data_switched % 2 === 1}
                  subjectImageKey={subjectImageKey}
                  compact
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {modelLoading ? (
          <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item xs={12} md={8}>
              <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mb: 1.5 }}>
                Analysis runs locally — longer videos take longer. 10–20 seconds works best.
              </Typography>
              {(progressBarDone && results["models"][0]["DFD"]===0) ? (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                </Box>
              ) : (
                <Display_Wait per_increment={estimate_runtime(fileduration, data_switched===0)}/>
              )}
            </Grid>
          </Grid>
        ) : null}

        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
            }}
          >
            <Typography variant="overline" color="text.secondary">
              Eye Blink Model
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Button
                disabled={data_switched%2===0}
                component="span"
                variant="text"
                color="secondary"
                size="small"
                onClick={() => {
                  FileSaver.saveAs(
                    "http://localhost:5001/home/eyeblink_csv",
                    "eyeblink_data.csv");
                }}
              >
                Download frame data (CSV)
              </Button>
              <Tooltip title={EYE_BLINK_HELP} arrow placement="left">
                <IconButton size="small" aria-label="About eye blink model" sx={{ mt: -0.5 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Grid container spacing={1} alignItems="stretch">
            <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
              <Eyeblinks results={results} color_card={blink_classes[0]} />
            </Grid>
            <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
              <Eyeblinks results={results} color_card={blink_classes[1]} />
            </Grid>
            <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
              <Eyeblinks results={results} color_card={blink_classes[2]} />
            </Grid>
            <Grid item xs={6} sm={3} sx={{ display: "flex" }}>
              <Eyeblinks results={results} color_card={blink_classes[3]} />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Page>
  );
}
