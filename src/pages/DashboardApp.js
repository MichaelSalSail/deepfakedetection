import React from 'react';
import {useState, useEffect} from "react";
import axios from 'axios';
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
  PopUp_Help
} from "../components/_dashboard/app/index.js";

// current file duration (sec).
var fileduration = 1;

export default function DashboardApp() {
  // current uploaded file
  const [file, setFile] = useState('');
  // current file name.
  const [filename, setFilename] = useState('');
  // current file data
  const [selectedFile, setSelectedFile] = useState(null);

  // disable/enable button
  const [submit, setSubmit] = useState(true);

  const onFileChange = (data) => {

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
    // get file data
    setSelectedFile(data.target.files[0])
    // successful file upload should enable Submit button.
    setSubmit(false)
  };

  const handleSubmit = (event) => {
    event.preventDefault()
    var formData = new FormData();
    formData.append("file", selectedFile)
    axios.post('http://localhost:5000/home/upload', formData)
    .then(function () {
      console.log("Successfully saved %s!",(formData.getAll("file"))[0]["name"]);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Page title="Application">
          <Container maxWidth="xl">
              <Box sx={{ pb: 5 }}>
                <Typography variant="h4">Deepfake Video Analysis</Typography>
                <Box flexDirection="row">
                    <input
                    id="file-upload"
                    hidden
                    type="file"
                    accept=".mp4"
                    onChange={onFileChange}
                    />
                    <label htmlFor="file-upload">
                        <Button component="span" variant="contained">
                            Upload Video
                        </Button>
                    </label>
                    <PopUp_Help/>
                </Box>
                <input
                    type="submit"
                    disabled={submit}
                />
              </Box>
          </Container>
      </Page>
    </form>
  );
}