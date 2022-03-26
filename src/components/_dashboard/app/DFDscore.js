import { useEffect, useState } from "react";
import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
// material
import { Card, CardContent, Typography, Box } from "@mui/material";

// ----------------------------------------------------------------------

export default function DFDscore(input) {
  let DFD_result = require('../../../utils/AllResultsJSON/result_default.json')[0];
  // switch_data equates to number of 'Generate Results' button clicks
  if((input["switch_data"]%2)===1)
    DFD_result = require('../../../utils/AllResultsJSON/result_update.json')[0];
  
  // The base model score falls under 3 ranges.
  // Each range corresponds to a different color.
  let score_color=""
  if(DFD_result["DFD"]===0)
    score_color="grey"
  else if(DFD_result["DFD"]<48)
    score_color="green"
  else if(DFD_result["DFD"]>=48 && DFD_result["DFD"]<=68)
    score_color="yellow"
  else
    score_color="red"
  
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" fontWeight= 'medium' fontFamily= 'Monospace' fontSize= 'h6.fontSize' textAlign= 'center'>
          SCORE: {<Typography color={score_color} fontWeight= 'bold'>{DFD_result["DFD"]}%</Typography>}
        </Typography>
      </CardContent>
    </Card>
  );
}