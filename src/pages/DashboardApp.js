import {useState, useEffect} from "react";
// material
import {
  Box,
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
  BlinkCardsStack,
  BLINK_CARD_MIN_WIDTH,
  BLINK_POINT_CARD_WIDTH,
  OtherOutputs,
  DFDscore,
  EyeBlinkTimelineChart,
  EyeBlinkPointLabelCard,
  GeminiFrameAnalysis,
  ModelTimingLog,
} from "../components/_dashboard/app/index.js";
import { hasAnyModelError } from "../utils/modelTimingStatus.js";
import { parseEyeblinkCsv } from "../utils/parseEyeblinkCsv.js";
import FileSaver from 'file-saver';

import axios from "axios";

const MAX_VIDEO_BYTES = 50000000;
const BLINK_PROGRESS_POLL_MS = 400;

const BASE_MODEL_HELP =
  "Score colors: Green below 48%. Yellow from 48% to 68%. Red above 68%. " +
  "In testing, the base model is least reliable in the yellow range.";

const SUBJECT_HELP =
  "Gender score colors: Green at 60% or above. Yellow above 40% and below 60%. " +
  "Red at 40% or below. ";

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

const LIMITATIONS_POINTS = [
  "Use videos with only one unique subject. If a video has multiple people, the app may analyze different faces in different frames, so scores and the subject crop may not match a single person.",
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

const alertInfoProgressBarSx = {
  ...alertProgressBarSx,
  bgcolor: "info.main",
};

const alertWithProgressSx = {
  mb: 2,
  position: "relative",
  overflow: "hidden",
};

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
  const [selectedBlinkPoint, setSelectedBlinkPoint] = useState(null);
  const [blinkTimelineRows, setBlinkTimelineRows] = useState(null);
  const [frameImageLoading, setFrameImageLoading] = useState(false);
  const [liveBlinkRow, setLiveBlinkRow] = useState(null);
  const [liveBlinkFrameKey, setLiveBlinkFrameKey] = useState(0);
  const [blinkPreviewLocked, setBlinkPreviewLocked] = useState(false);

  const liveBlinkPreviewActive =
    modelLoading && !blinkPreviewLocked && liveBlinkRow != null;

  const handleBlinkPointSelect = (point) => {
    setBlinkPreviewLocked(true);
    setSelectedBlinkPoint(point);
  };

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

  useEffect(() => {
    if (!modelLoading || blinkPreviewLocked) {
      return undefined;
    }

    const pollBlinkProgress = () => {
      axios.get('http://localhost:5001/home/blink_progress')
        .then((response) => {
          const status = response.data?.status;
          const latestFrame = response.data?.latest_frame;

          if (status === "pending") {
            setLiveBlinkRow(null);
            return;
          }

          if (status === "running") {
            if (latestFrame?.frame_num > 0) {
              setLiveBlinkRow((prev) => {
                if (prev?.frame_num === latestFrame.frame_num) {
                  return prev;
                }
                setLiveBlinkFrameKey(Date.now());
                return latestFrame;
              });
            }
            return;
          }

          if (status === "complete" || status === "error") {
            // Keep in-session liveBlinkRow; never seed from disk when null.
            return;
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    pollBlinkProgress();
    const intervalId = setInterval(pollBlinkProgress, BLINK_PROGRESS_POLL_MS);
    return () => clearInterval(intervalId);
  }, [modelLoading, blinkPreviewLocked]);

  // increment data_switched each time a new file is uploaded or 'Generate Results' completes a GET request
  const switched = () => {
    data_switched+=1;
  };

  const wait_for_models = () => {
    setAnalysisError(false);
    setSelectedBlinkPoint(null);
    setBlinkTimelineRows(null);
    setFrameImageLoading(false);
    setLiveBlinkRow(null);
    setLiveBlinkFrameKey(0);
    setBlinkPreviewLocked(false);
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
    setSelectedBlinkPoint(null);
    setBlinkTimelineRows(null);
    setFrameImageLoading(false);
    setLiveBlinkRow(null);
    setLiveBlinkFrameKey(0);
    setBlinkPreviewLocked(false);

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
      axios.get('http://localhost:5001/home/eyeblink_csv', { responseType: 'text' })
        .then((csvResponse) => {
          const rows = parseEyeblinkCsv(csvResponse.data);
          setBlinkTimelineRows(rows);
          setSelectedBlinkPoint(rows.length > 0 ? rows[0] : null);
        })
        .catch((csvError) => {
          console.log(csvError);
          setBlinkTimelineRows([]);
          setSelectedBlinkPoint(null);
          setFrameImageLoading(false);
        });
      console.log("Successfully loaded model outputs!")
    }).catch(error => {
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
            <Box key={infoKey} aria-hidden sx={alertInfoProgressBarSx} />
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
        <Box sx={{ pb: 0.5 }}>
          <Typography variant="h4" align="center" sx={{ lineHeight: 1.2 }}>
            Deepfake Video Analysis
          </Typography>
        </Box>

        <Box
          sx={{
            display: { xs: "flex", md: "grid" },
            gridTemplateColumns: { md: "70% 30%" },
            columnGap: 1.5,
            rowGap: 1,
            alignItems: { xs: "stretch", md: "stretch" },
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
              gap: 0.5,
            }}
          >
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
              Results
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
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
                <LoadingButton
                  loading={uploading || modelLoading}
                  disabled={modelLoading || uploading}
                  component="span"
                  variant="contained"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Upload Video
                </LoadingButton>
              </label>
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                <LoadingButton
                  loading={modelLoading}
                  disabled={modelLoading || uploading || !videoSaved}
                  variant="contained"
                  sx={{ whiteSpace: "nowrap" }}
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
                </LoadingButton>
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
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Card
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardHeader
                title={<Typography variant="overline" align="center">Video File</Typography>}
                sx={{ py: 1, flexShrink: 0 }}
              />
              <Box
                sx={{
                  px: 2,
                  pb: 1.5,
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
                dir="ltr"
              >
                <Box
                  sx={{
                    position: "relative",
                    width: "100%",
                    flex: { md: 1 },
                    minHeight: { md: 220 },
                    pt: { xs: "56.25%", md: 0 },
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
              {modelLoading ? (
                <Box sx={{ flexShrink: 0, px: 2, pb: 1.5 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                    display="block"
                    sx={{ mb: 0.75 }}
                  >
                    Analysis runs locally. For fastest results, use a 10 to 20 second video.
                  </Typography>
                  <LinearProgress />
                </Box>
              ) : null}
            </Card>
          </Box>

          <Box
            sx={{
              gridColumn: { md: "2" },
              gridRow: { md: "2" },
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
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
              <DFDscore results={results} prominent />
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.5,
                  flexShrink: 0,
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Subject
                </Typography>
                <Tooltip title={SUBJECT_HELP} arrow placement="left">
                  <IconButton size="small" aria-label="About subject analysis" sx={{ mt: -0.5 }}>
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <OtherOutputs
                results={results}
                analysisComplete={data_switched % 2 === 1}
                subjectImageKey={subjectImageKey}
                compact
              />
            </Box>
          </Box>

          <Box
            sx={{
              gridColumn: { md: "1 / -1" },
              gridRow: { md: "3" },
              minWidth: 0,
            }}
          >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              alignItems: { xs: "stretch", md: "center" },
              mb: 0.5,
            }}
          >
            <Box
              sx={{
                flexShrink: 0,
                width: { xs: "100%", md: BLINK_CARD_MIN_WIDTH },
              }}
            >
              <Typography variant="overline" color="text.secondary">
                Eye Blink Model
              </Typography>
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                width: { xs: 0, md: BLINK_POINT_CARD_WIDTH },
                maxWidth: { xs: 0, md: BLINK_POINT_CARD_WIDTH },
                display: { xs: "none", md: "block" },
              }}
            />
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                (
                <Box component="span" sx={{ fontWeight: 600 }}>Missing (-2):</Box>
                {" no face detected, "}
                <Box component="span" sx={{ fontWeight: 600 }}>Unknown (-1):</Box>
                {" face detected but not fully visible"}
                )
              </Typography>
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
            <Box sx={{ flexShrink: 0, display: "flex", minHeight: 0 }}>
              <BlinkCardsStack results={results} />
            </Box>
            <Box
              sx={{
                flexShrink: 0,
                width: { xs: "100%", md: BLINK_POINT_CARD_WIDTH },
                maxWidth: BLINK_POINT_CARD_WIDTH,
                display: "flex",
                minHeight: 0,
              }}
            >
              <EyeBlinkPointLabelCard
                selectedRow={selectedBlinkPoint}
                analysisComplete={data_switched % 2 === 1}
                frameImageKey={subjectImageKey}
                timelineRows={blinkTimelineRows}
                onSelectRow={handleBlinkPointSelect}
                onFrameImageLoadingChange={setFrameImageLoading}
                livePreviewActive={liveBlinkPreviewActive}
                livePreviewRow={liveBlinkRow}
                livePreviewFrameKey={liveBlinkFrameKey}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: "flex", minHeight: 0 }}>
              <EyeBlinkTimelineChart
                data={blinkTimelineRows}
                analysisComplete={data_switched % 2 === 1}
                selectedPoint={selectedBlinkPoint}
                onPointSelect={handleBlinkPointSelect}
                selectionDisabled={frameImageLoading}
              />
            </Box>
          </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 1 }}>
          <GeminiFrameAnalysis />
        </Box>

        <Typography variant="h6" sx={{ mt: 3, mb: 1.5 }}>
          Limitations
        </Typography>

        <Box
          component="ol"
          sx={{
            m: 0,
            pl: 2.5,
            mb: 2.5,
            width: "100%",
            color: "text.secondary",
            "& > li:not(:last-of-type)": { mb: 1.25 },
          }}
        >
          {LIMITATIONS_POINTS.map((point, index) => (
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
