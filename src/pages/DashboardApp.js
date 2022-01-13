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
import LoadingButton from "@mui/lab/LoadingButton";
import ReactPlayer from "react-player";
// components
import Page from "../components/Page";
import {
  AppTasks,
  AppNewUsers,
  AppBugReports,
  AppItemOrders,
  AppNewsUpdate,
  AppWeeklySales,
  AppOrderTimeline,
  AppCurrentVisits,
  AppWebsiteVisits,
  AppTrafficBySite,
  AppCurrentSubject,
  AppConversionRates,
} from "../components/_dashboard/app";

import axios from "axios";

const API_URL = "http://0593-67-84-165-192.ngrok.io";
const EYE_BLINK_PREDICTIONS = {
  0: [0.0, 3.33, 86.67, 10.0],
  1: [0.0, 0.0, 86.67, 13.33],
  2: [0.0, 0.0, 100.0, 0.0],
  3: [0.0, 0.0, 83.33, 16.67],
  4: [0.0, 0.0, 46.67, 53.33],
  5: [0.0, 0.0, 20.0, 80.0],
};
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

  const formatEyeBlinkData = (predictions) => {
    let totalMissing = 0;
    let totalUnknown = 0;
    let totalOpened = 0;
    let totalClosed = 0;
    Object.values(predictions).forEach((p) => {
      totalMissing += p[0];
      totalUnknown += p[1];
      totalOpened += p[2];
      totalClosed += p[3];
    });
    setMissingFrames(totalMissing);
    setUnknownFrames(totalUnknown);
    setOpenedFrames(totalOpened);
    setClosedFrames(totalClosed);
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
    getDeepFakePrediction()
      .then((res) => {
        console.log("DEEPFAKE rees-----", res.data.preditction);
        setDeepfakeResults(Object.values(res.data.preditction));
        getEyeBlinkPrediction()
          .then((res) => {
            console.log("EYEBLINK res-----", res.data.preditction);
            formatEyeBlinkData(res.data.preditction);
            setModelLoading(false);
          })
          .catch((err) => {
            console.log("err", err);
            setModelLoading(false);
          });
      })
      .catch((err) => {
        console.log("err", err);
        setModelLoading(false);
      });
  };

  return (
    <Page title="Deep Fake Detection">
      <Container maxWidth="xl">
        <Box sx={{ pb: 5 }}>
          <Typography variant="h4">Is the video a deep fake?</Typography>
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

          {/* <Grid item xs={12} md={6} lg={4}>
            <AppOrderTimeline />
          </Grid> */}

          <Grid item xs={12} sm={6} md={3}>
            <AppItemOrders
              {...{ missingFrames, unknownFrames, openedFrames, closedFrames }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AppNewUsers
              {...{ missingFrames, unknownFrames, openedFrames, closedFrames }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AppWeeklySales
              {...{ missingFrames, unknownFrames, openedFrames, closedFrames }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <AppBugReports
              {...{ missingFrames, unknownFrames, openedFrames, closedFrames }}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <AppWebsiteVisits {...{ deepfakeResults }} />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppOrderTimeline
              {...{ missingFrames, unknownFrames, openedFrames, closedFrames }}
            />
          </Grid>

          {/* <Grid item xs={12} md={6} lg={8}>
            <AppNewsUpdate />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppWebsiteVisits />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppTrafficBySite />
          </Grid>

          <Grid item xs={12} md={6} lg={8}>
            <AppTasks />
          </Grid> */}
        </Grid>
      </Container>
    </Page>
  );
}
