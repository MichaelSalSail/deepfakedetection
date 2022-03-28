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

const API_URL = "http://0593-67-84-165-192.ngrok.io";
const blink_classes=["missing","unknown","open","closed"];
var switch_data = 0;
// current file duration (sec).
var fileduration = 1;

export default function DashboardApp() {
  // current uploaded file
  const [file, setFile] = useState('');
  // current file name.
  const [filename, setFilename] = useState('');
  // file name used on last 'Generate Results' run
  const [lastfilerun, setlastfilerun] = useState('');

  // alerts
  const [error, setError] = useState(false);
  const [info, setInfo] = useState(false);

  // alternate between button and loading icon
  const [modelLoading, setModelLoading] = useState(false);

  // other stuff
  const [deepfakeResults, setDeepfakeResults] = useState([]);
  const [base64File, setBase64File] = useState();
  const [base64Loading, setBase64Loading] = useState(false);

  const update_click = () => {
    switch_data+=1;
  };

  const wait_for_models = () => {
    let place_holder=0;
    console.log("Video has a duration of", fileduration, "seconds.");
    console.log("Will this have a first video runtime delay?", switch_data===0);
    console.log("Each progress bar tick will take", estimate_runtime(fileduration, switch_data===0), "milliseconds");
    setTimeout(() => {
      update_click();
    }, estimate_runtime(fileduration, switch_data===0)*100);
    return Promise.resolve(place_holder);
  };

  const onGenerate = () => {
    setModelLoading(true);
    wait_for_models().then((res) => {
      setTimeout(() => {
        setModelLoading(false);
      }, estimate_runtime(fileduration, switch_data===0)*100);
    })
    .catch((err) => {
      console.log("err", err);
      setTimeout(() => {
        setModelLoading(false);
      }, estimate_runtime(fileduration, switch_data===0)*100);
    });
  };

  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const onFileChange = (data) => {
    setBase64Loading(true);
    convertBase64(data.target.files[0]).then((res) => {
      setBase64File(res.slice(22));
      console.log("You may now begin!");
      setBase64Loading(false);
    });

    // obtain the video duration
    var reader = new FileReader();
    reader.onload = function() {
      var media = new Audio(reader.result);
      media.onloadedmetadata = function(){
           fileduration = Number((media.duration).toFixed(2));
           return media.duration;
      };    
    };
    reader.readAsDataURL(data.target.files[0]);

    // obtain url to play the video
    setFile(URL.createObjectURL(data.target.files[0]));
    // get filename for the info alert
    setFilename(data.target.files[0]['name']);
    // reset last file run to default value
    setlastfilerun('');
    // set the results to default upon file upload
    if((switch_data%2)===1)
    {
      switch_data+=1;
    }
  };

  const getDeepFakePrediction = async () => {
    return await axios.post(
      `${API_URL}/upload/`,
      {
        data: base64File,
      },
      { headers: {} }
    );
  };

  const getEyeBlinkPrediction = async () => {
    return await axios.post(
      `${API_URL}/upload_eye_blink/`,
      {
        data: base64File,
      },
      {
        headers: {},
        timeout: 900000,
      }
    );
  };

  return (
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
            Unable to generate results. Missing video file.
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
              type="file"
              onChange={onFileChange}
            />
            {/* The 'Upload Video' button shouldn't be accessible while
                the models are still generating outputs.*/}
            <label htmlFor="file-upload">
              {modelLoading ? (
                <LoadingButton loading={modelLoading} />
              ) : (
                <Button
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
                  disabled={error || info}
                  style={{ marginLeft: 10 }}
                  component="span"
                  variant="contained"
                  onClick={() => {
                    if(switch_data===0 && file==='')
                    {
                      setError(true);
                    }
                    else if(lastfilerun==='')
                    {
                      setlastfilerun(file);
                      onGenerate();
                    }
                    else if(lastfilerun===file)
                    {
                      setInfo(true);
                    }
                    else
                    {
                      onGenerate();
                    }
                  }}
                >
                  Generate Results
                </Button>
              )}
            <PopUp_Help/>
          </Box>
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
        {/* While waiting for model outputs, display a progress bar. */}
        {modelLoading ? (
          <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }} justifyContent="center">
            <Grid item xs={12}></Grid>
            <Grid item xs={8}>
              <Display_Wait per_increment={estimate_runtime(fileduration, switch_data===0)}/>
            </Grid>
            <Grid item xs={12}></Grid>
          </Grid>
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
            <DFDscore switch_data={switch_data} />
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>

        <Typography variant="overline" align="center">Eye Blink Model</Typography>
        <Button
          disabled={switch_data%2==0}
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
            <Eyeblinks color_card={blink_classes[0]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={3}>
            <Eyeblinks color_card={blink_classes[1]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={3}>
            <Eyeblinks color_card={blink_classes[2]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={3}>
            <Eyeblinks color_card={blink_classes[3]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={12}></Grid>
        </Grid>

        <Typography variant="overline" align="center">Other Models</Typography>
        <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          <Grid item xs={12}></Grid>
          <Grid item xs={12}>
            <OtherOutputs switch_data={switch_data}/>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}