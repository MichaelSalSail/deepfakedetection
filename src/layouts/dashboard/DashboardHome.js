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
// components
import Page from "../../components/Page.js";
import axios from "axios";
// <Grid container spacing={3}>
// <div><img src="courtroom.jpg" width="400"/></div>

export default function DashboardHome() {

  return (
    <Page title="About">
      <Container maxWidth="xl">
        <Box sx={{ pb: 5 }}>
          <Typography variant="h2" align="center">Deepfake Detection</Typography>
          <p align="center"><img src="/static/mock-images/avatars/courtroom.jpg" width="509" height="287"/></p>
        </Box>
        <Box>
            <Typography variant="h3" align="center">About</Typography>
            <p align="center">Welcome to Deepfake Detection. For our CS Senior Project, we decided to 
               create an application that uses multiple ML models to help lawyers in the
               courtroom identify deepfake videos. Lawyers should interpret the results
               and make their own judgments on the legitimacy of a video. 
            </p>
            <Typography variant="h3" align="center">How it Works</Typography>
            <p align="center">The backend uses 1 base model and 3 user trust models. The base
               model will return a continuous score on the likelihood of a deepfake.
               The application alerts the user on suspicious video elements detected
               from the 3 user trust models. For more details, the lawyer can view
               the raw outputs from the 3 models.
            </p>
            <Typography variant="h3" align="center">Credits</Typography>
            <p align="center">Chukwudi Udoka, Denny Liang, Michael Salamon, Ravid Rahman</p>
        </Box>
      </Container>
    </Page>
  );
}
