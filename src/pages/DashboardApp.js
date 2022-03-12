import { useState, useEffect } from "react";
// material
import {
  Box,
  Grid,
  Container,
  Typography,
  Button,
  Card,
  CardHeader,
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
  DFDchart,
  PopUp_Help,
  Display_Wait
} from "../components/_dashboard/app/index.js";

import axios from "axios";

const API_URL = "http://0593-67-84-165-192.ngrok.io";
const blink_classes=["missing","unknown","open","closed"];
var switch_data = 0;

//  index 0: amount of missing frames
//  index 1: amount of unknown frames
//  index 2: amount of opened frames
//  index 3: amount of closed eyes frames

export default function DashboardApp() {
  const [file, setFile] = useState('');
  const [base64File, setBase64File] = useState();
  const [base64Loading, setBase64Loading] = useState(false);

  // deepfake
  const [deepfakeResults, setDeepfakeResults] = useState([]);

  // alternate between button and loading icon
  const [modelLoading, setModelLoading] = useState(false);

  // alerts
  const [open, setOpen] = useState(false);

  const update_click = () => {
    switch_data+=1;
  };

  const wait_for_models = () => {
    let place_holder=0;
    setTimeout(() => {
      update_click();
    }, 10000);
    return Promise.resolve(place_holder);
  };

  const onGenerate = () => {
    setModelLoading(true);
    wait_for_models().then((res) => {
      setTimeout(() => {
        setModelLoading(false);
      }, 10000);
    })
    .catch((err) => {
      console.log("err", err);
      setTimeout(() => {
        setModelLoading(false);
      }, 10000);
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
    setFile(URL.createObjectURL(data.target.files[0]));
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
        <Collapse in={open}>
          <Alert severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOpen(false);
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
        <Box sx={{ pb: 5 }}>
          <Typography variant="h4">Is this a deepfake?</Typography>
          <Box flexDirection="row">
            <input
              id="file-upload"
              hidden
              type="file"
              onChange={onFileChange}
            />
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
            </label>
              {modelLoading ? (
                <LoadingButton loading={modelLoading} />
              ) : (
                <Button
                  disabled={open}
                  style={{ marginLeft: 10 }}
                  component="span"
                  variant="contained"
                  onClick={() => {
                    if(switch_data===0 && file==='')
                    {
                      setOpen(true);
                    }
                    // if((switch_data%2)===1)
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

        <Grid container rowSpacing={3} columnSpacing={{ xs: 1, sm: 2, md: 3 }} justifyContent="center">
          <Grid item xs={12} md={6} lg={12}>
            <Card>
              <CardHeader
                title="Video File"
                subheader="(REQUIRED: Human Face)"
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
          </Grid>

          <Grid item xs={8}>
            {modelLoading ? (
              <Display_Wait/>
            ) : (
              <Typography variant="h4" align="center">Results</Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <DFDchart deepfakeResults={deepfakeResults} switch_data={switch_data} />
          </Grid>
          
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
          
          <Grid item xs={12}>
            <OtherOutputs switch_data={switch_data}/>
          </Grid>
        </Grid>

      </Container>
    </Page>
  );
}