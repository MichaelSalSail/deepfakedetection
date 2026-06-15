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
  EyeBlinkTimelineChart,
  GeminiFrameAnalysis,
  ModelTimingLog,
} from "../components/_dashboard/app/index.js";
import { hasAnyModelError } from "../utils/modelTimingStatus.js";
import FileSaver from 'file-saver';

import axios from "axios";

const MAX_VIDEO_BYTES = 50000000;

const BASE_MODEL_HELP =
  "In our testing, the base model is most likely to yield incorrect predictions in the yellow range. " +
  "Use the other model outputs to draw any final conclusions. " +
  "A green score indicates a genuine video; a red score indicates a deepfake.";

const EYE_BLINK_HELP =
  "The eye blink model returns two classifications (open and closed eyes). " +
  "For clarity, we show four categories: Missing (no face detected), Unknown (face detected but only partially visible), Open, and Closed. " +
  "All other frames are sent to the model and classified as open or closed eyes. " +
  "Per-frame classifications are in the downloadable CSV.";

const SUBJECT_INTERPRETATION_POINTS = [
  "Eyewear and facial hair are often harder to fake, so they can be signs of a genuine video.",
];

const EYE_BLINK_INTERPRETATION_POINTS = [
  "A high share of missing or unknown frames can suggest a deepfake, since the model is struggling to detect a face. That can also happen when someone turns away from the camera—but sporadic missing or unknown frames scattered throughout the video are more suspicious.",
  "Blink patterns should stay fairly consistent over time; an unusually high number of switches between open and closed eyes may also point to a deepfake.",
];

const MANUAL_DEEPFAKE_TIPS = [
  "Deepfakes are often easier to create when the subject stays still than when they move naturally through a scene.",
  "Check whether the lips stay in sync with what the person is saying.",
  "Watch for unusual lighting, blur, or other visual artifacts throughout the video.",
];

const ANALYSIS_MODEL_ERROR_MESSAGE =
  "Analysis completed, but one or more models failed. Try Generate Results again, or upload a different video.";

const ANALYSIS_REQUEST_FAILED_MESSAGE =
  "Could not load results. Check that the backend is running on port 5001 and that analysis completed.";

const ALERT_PROGRESS_MS = 5000;

const alertProgressBarSx = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  bgcolor: "success.main",
  opacity: 0.35,
  transformOrigin: "left center",
  animation: `alertProgress ${ALERT_PROGRESS_MS}ms linear forwards`,
  "@keyframes alertProgress": {
    from: { transform: "scaleX(1)" },
    to: { transform: "scaleX(0)" },
  },
};

const alertWithProgressSx = {
  mb: 2,
  position: "relative",
  overflow: "hidden",
};

// all major classifications for eye blink model
const blink_classes=["missing","unknown","open","closed"];
// default values for model outputs
const default_values={"models": require('../utils/result_default.json')}
// cumulative total of file uploads and 'Generate Results' clicks
let data_switched = 0;
// current file duration (sec).
let fileduration = 1;

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
  const [uploadError, setUploadError] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadSuccessKey, setUploadSuccessKey] = useState(0);
  const [info, setInfo] = useState(false);
  const [infoKey, setInfoKey] = useState(0);
  const [analysisError, setAnalysisError] = useState(false);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState("");

  // the model starts loading when a user clicks 'Generate Results' and finishes once the GET request is received.
  const [modelLoading, setModelLoading] = useState(false);
  // cache-bust subject face crop after each successful results fetch
  const [subjectImageKey, setSubjectImageKey] = useState(0);

  useEffect(() => {
    if (!uploadSuccess) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setUploadSuccess(false);
    }, ALERT_PROGRESS_MS);
    return () => clearTimeout(timer);
  }, [uploadSuccess, uploadSuccessKey]);

  useEffect(() => {
    if (!info) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setInfo(false);
    }, ALERT_PROGRESS_MS);
    return () => clearTimeout(timer);
  }, [info, infoKey]);

  // increment data_switched each time a new file is uploaded or 'Generate Results' completes a GET request
  const switched = () => {
    data_switched+=1;
  };

  const wait_for_models = () => {
    setAnalysisError(false);
    setModelLoading(true);
    console.log("Video has a duration of", fileduration, "seconds.");
    obtainResults();
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
    const pickedFile = data.target.files?.[0];
    if (!pickedFile) {
      return;
    }

    // close any open alerts
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
      temp["models"][3]["shades"]=Boolean(temp["models"][3]["shades"])
      setResults(temp)
      setSubjectImageKey(Date.now())
      // the process attached w/ 'Generate Results' has ended, update the count
      switched();
      setModelLoading(false);
      if (hasAnyModelError(temp.models)) {
        setAnalysisErrorMessage(ANALYSIS_MODEL_ERROR_MESSAGE);
        setAnalysisError(true);
      }
      console.log("Successfully loaded model outputs!")
    }).catch(error => {
      switched();
      setModelLoading(false);
      setAnalysisErrorMessage(ANALYSIS_REQUEST_FAILED_MESSAGE);
      setAnalysisError(true);
      console.log(error)
    })
  }
  

  return (
    <Page title="Application">
      <Container maxWidth="xl">
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
            Upload failed. Make sure the backend is running and the file is under 50MB, then try again.
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
            sx={alertWithProgressSx}
          >
            {filename} uploaded. Click Generate Results to analyze.
            <Box key={uploadSuccessKey} aria-hidden sx={alertProgressBarSx} />
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
            sx={alertWithProgressSx}
          >
            Results for this video are already shown below.
            <Box key={infoKey} aria-hidden sx={alertProgressBarSx} />
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
        <Box sx={{ pb: 2 }}>
          <Typography variant="h3" align="center">
            Deepfake Video Analysis
          </Typography>
        </Box>

        <Box
          sx={{
            display: { xs: "flex", md: "grid" },
            gridTemplateColumns: { md: "70% 30%" },
            columnGap: 2,
            rowGap: 1.5,
            alignItems: "stretch",
            flexDirection: "column",
          }}
        >
          <Box
            sx={{
              gridColumn: { md: "1 / -1" },
              gridRow: { md: "1" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography variant="h6">Results</Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
                gap: 1.5,
                width: "100%",
                minWidth: 0,
              }}
            >
              <input
                id="file-upload"
                hidden
                disabled={modelLoading || uploading}
                type="file"
                accept=".mp4"
                onChange={onFileChange}
              />
              <Box sx={{ flexShrink: 0 }}>
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
              </Box>
              <Box sx={{ flexShrink: 0 }}>
              {modelLoading ? (
                <LoadingButton loading={modelLoading} />
              ) : (
                <Button
                  disabled={modelLoading || uploading || !videoSaved}
                  component="span"
                  variant="contained"
                  onClick={() => {
                    setUploadSuccess(false);
                    if (lastfilerun === file) {
                      setInfoKey((key) => key + 1);
                      setInfo(true);
                    } else {
                      setlastfilerun(file);
                      wait_for_models();
                    }
                  }}
                >
                  Generate Results
                </Button>
              )}
              </Box>
              <ModelTimingLog
                results={results}
                analysisComplete={data_switched % 2 === 1}
              />
            </Box>
          </Box>

          <Box
            sx={{
              gridColumn: { md: "1" },
              gridRow: { md: "2" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
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

            {modelLoading ? (
              <Box sx={{ width: "100%" }}>
                <Typography variant="caption" color="text.secondary" align="center" display="block" sx={{ mb: 1.5 }}>
                  Analysis runs locally. For fastest results, use a 10 to 20 second video.
                </Typography>
                <LinearProgress />
              </Box>
            ) : null}
          </Box>

          <Box
            sx={{
              gridColumn: { md: "2" },
              gridRow: { md: "2" },
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              alignSelf: "stretch",
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                  flexShrink: 0,
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
              <Box sx={{ flex: 1, minHeight: 0, display: "flex" }}>
                <DFDscore results={results} prominent />
              </Box>
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Subject
              </Typography>
              <OtherOutputs
                results={results}
                analysisComplete={data_switched % 2 === 1}
                subjectImageKey={subjectImageKey}
                compact
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 2 }}>
          <GeminiFrameAnalysis />
        </Box>

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
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: "stretch",
            }}
          >
            <Box sx={{ width: { xs: "100%", md: "40%" }, minWidth: 0 }}>
              <Grid container spacing={1} alignItems="stretch" sx={{ height: "100%" }}>
                <Grid item xs={6} sx={{ display: "flex" }}>
                  <Eyeblinks results={results} color_card={blink_classes[3]} />
                </Grid>
                <Grid item xs={6} sx={{ display: "flex" }}>
                  <Eyeblinks results={results} color_card={blink_classes[2]} />
                </Grid>
                <Grid item xs={6} sx={{ display: "flex" }}>
                  <Eyeblinks results={results} color_card={blink_classes[0]} />
                </Grid>
                <Grid item xs={6} sx={{ display: "flex" }}>
                  <Eyeblinks results={results} color_card={blink_classes[1]} />
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ width: { xs: "100%", md: "60%" }, minWidth: 0, display: "flex" }}>
              <EyeBlinkTimelineChart />
            </Box>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 1.5 }}>
          Interpreting Results
        </Typography>

        <Box sx={{ width: "100%", color: "text.secondary" }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Subject
          </Typography>
          <Box
            component="ol"
            sx={{
              m: 0,
              pl: 2.5,
              mb: 2.5,
              "& > li:not(:last-of-type)": { mb: 1.25 },
            }}
          >
            {SUBJECT_INTERPRETATION_POINTS.map((point, index) => (
              <Typography
                key={index}
                component="li"
                variant="body2"
                sx={{ lineHeight: 1.6 }}
              >
                {point}
              </Typography>
            ))}
          </Box>

          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Eye Blink Model
          </Typography>
          <Box
            component="ol"
            sx={{
              m: 0,
              pl: 2.5,
              "& > li:not(:last-of-type)": { mb: 1.25 },
            }}
          >
            {EYE_BLINK_INTERPRETATION_POINTS.map((point, index) => (
              <Typography
                key={index}
                component="li"
                variant="body2"
                sx={{ lineHeight: 1.6 }}
              >
                {point}
              </Typography>
            ))}
          </Box>
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 1.5 }}>
          Tips for Spotting Deepfakes
        </Typography>

        <Box
          component="ol"
          sx={{
            m: 0,
            pl: 2.5,
            width: "100%",
            color: "text.secondary",
            "& > li:not(:last-of-type)": { mb: 1.25 },
          }}
        >
          {MANUAL_DEEPFAKE_TIPS.map((tip, index) => (
            <Typography
              key={index}
              component="li"
              variant="body2"
              sx={{ lineHeight: 1.6 }}
            >
              {tip}
            </Typography>
          ))}
        </Box>
      </Container>
    </Page>
  );
}
