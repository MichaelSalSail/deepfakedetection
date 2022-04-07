import { useEffect, useState } from "react";
import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
// material
import { Card, CardContent, Typography, Box } from "@mui/material";

// ----------------------------------------------------------------------

export default function DFDscore(input) {
  // The base model score falls under 3 ranges.
  // Each range corresponds to a different color.
  let score_color=""
  // a score of 50 occurs when predict_on_video() encountered an error
  if(input["results"]["models"][0]["DFD"]===0 || input["results"]["models"][0]["DFD"]===50)
    score_color="grey"
  else if(input["results"]["models"][0]["DFD"]<48)
    score_color="green"
  else if(input["results"]["models"][0]["DFD"]>=48 && input["results"]["models"][0]["DFD"]<=68)
    score_color="yellow"
  else
    score_color="red"
  
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" fontWeight= 'bold' color={score_color} fontFamily= 'Monospace' fontSize= 'h6.fontSize' textAlign= 'center'>
          SCORE: {input["results"]["models"][0]["DFD"]}%
        </Typography>
      </CardContent>
    </Card>
  );
}