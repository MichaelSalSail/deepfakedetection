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
} from "@mui/material";
import LoadingButton from "@mui/lab/node/LoadingButton/index.js";
import ReactPlayer from "react-player";
// components
import Page from "../components/Page.js";
import {
  Eyeblinks,
  OtherOutputs,
  DFDchart,
  PopUp_Help
} from "../components/_dashboard/app/index.js";

import axios from "axios";

const API_URL = "http://0593-67-84-165-192.ngrok.io";
const blink_classes=["missing","unknown","open","closed"];// new Array("unknown")
var switch_data = 0;

//  index 0: amount of missing frames
//  index 1: amount of unknown frames
//  index 2: amount of opened frames
//  index 3: amount of closed eyes frames

export default function DashboardApp() {
  const [file, setFile] = useState();
  const [base64File, setBase64File] = useState();
  const [base64Loading, setBase64Loading] = useState(false);

  // deepfake
  const [deepfakeResults, setDeepfakeResults] = useState([]);

  // eyeblink
  const [missingFrames, setMissingFrames] = useState(0);
  const [unknownFrames, setUnknownFrames] = useState(0);
  const [openedFrames, setOpenedFrames] = useState(0);
  const [closedFrames, setClosedFrames] = useState(0);

  const [modelLoading, setModelLoading] = useState(false);

  const formatEyeBlinkData = () => {
    let totalMissing = 0;
    let totalUnknown = 0;
    let totalOpened = 0;
    let totalClosed = 0;
    
    setMissingFrames(totalMissing);
    setUnknownFrames(totalUnknown);
    setOpenedFrames(totalOpened);
    setClosedFrames(totalClosed);

    return Promise.resolve(totalMissing);
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

  const onGenerate = () => {
    setModelLoading(true);
    switch_data+=1;
    formatEyeBlinkData().then((res) => {
      setModelLoading(false);
    })
    .catch((err) => {
      console.log("err", err);
      setModelLoading(false);
    });
    return switch_data;
  };

  return (
    <Page title="Application">
      <Container maxWidth="xl">
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
              <Button component="span" variant="contained">
                Upload Video
              </Button>
            </label>
            {modelLoading ? (
              <LoadingButton loading={modelLoading} />
            ) : (
              <Button
                style={{ marginLeft: 10 }}
                component="span"
                variant="contained"
                onClick={onGenerate}
              >
                Generate Results
              </Button>
            )}
            <PopUp_Help/>
          </Box>
        </Box>

        <Grid container spacing={3}>
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

          <Grid item xs={12} sm={6} md={3}>
            <Eyeblinks color_card={blink_classes[0]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Eyeblinks color_card={blink_classes[1]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Eyeblinks color_card={blink_classes[2]} switch_data={switch_data} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Eyeblinks color_card={blink_classes[3]} switch_data={switch_data} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <OtherOutputs switch_data={switch_data}/>
          </Grid>
          <Grid item xs={12} md={6} lg={8}>
            <DFDchart deepfakeResults={deepfakeResults} switch_data={switch_data} />
          </Grid>

        </Grid>
      </Container>
    </Page>
  );
}
