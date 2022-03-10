import { useEffect, useState } from "react";

import faker from "faker";
import PropTypes from "prop-types";
// material
import { Card, Typography, CardHeader, CardContent, Box } from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  TimelineDot,
} from "@mui/lab";
// utils
import { fDateTime } from "../../../utils/formatTime.js";

// ----------------------------------------------------------------------

OrderItem.propTypes = {
  item: PropTypes.object,
  isLast: PropTypes.bool,
};

function OrderItem({ item, isLast, switch_data }) {
  const {type, title} = item;
  let result_beard = require('../../../pages/AllResultsJSON/result_default.json')[2];
  let result_shades = require('../../../pages/AllResultsJSON/result_default.json')[3];
  // switch_data equates to number of 'Generate Results' button clicks
  if((switch_data%2)===1)
  {
    result_beard = require('../../../pages/AllResultsJSON/result_update.json')[2];
    result_shades = require('../../../pages/AllResultsJSON/result_update.json')[3];
  }
  let from_beard=result_beard["beard"]
  let from_shades=result_shades["shades"]

  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot
          sx={{
            bgcolor:
              (type === "Beard" && from_beard===true && "success.main") ||
              (type === "Shades" && from_shades===true && "success.main") ||
              "error.main",
          }}
        />
        {isLast ? null : <TimelineConnector />}
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="paragraph" sx={{ color: "text.secondary" }}>
          {type}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}

export default function OtherOutputs(input) {
  const [timeline, setTimeline] = useState([]);
  let result_beard = require('../../../pages/AllResultsJSON/result_default.json')[2];
  let result_shades = require('../../../pages/AllResultsJSON/result_default.json')[3];
  // switch_data equates to number of 'Generate Results' button clicks
  if((input["switch_data"]%2)===1)
  {
    result_beard = require('../../../pages/AllResultsJSON/result_update.json')[2];
    result_shades = require('../../../pages/AllResultsJSON/result_update.json')[3];
  }
  let from_beard=result_beard["beard"]
  let from_shades=result_shades["shades"]
  // const output_beard=result_beard["raw_output"]
  // const output_shades=result_shades["raw_output"]

  var beard_content="The subject is young and/or female."
  if(from_beard===true)
    beard_content="There appears to be an adult male."
 
  var shades_content="It's unlikely the subject has eyewear"
  if(from_shades===true)
    shades_content="It's likely the subject has eyewear." 

  useEffect(() => {

    setTimeline([
      {
        title: `${beard_content}`,
        time: faker.date.past(),
        type: "Beard",
      },
      {
        title: `${shades_content}`,
        time: faker.date.past(),
        type: "Shades",
      }
    ]);
  }, [beard_content, shades_content]);

  return (
    <Card
      sx={{
        "& .MuiTimelineItem-missingOppositeContent:before": {
          display: "none",
        },
      }}
    >
      <CardHeader title="Facial Description" />
      <CardContent>
        <Box>
          <Timeline>
            {timeline.map((item) => (
              <OrderItem
                key={item.title}
                item={item}
                isLast={true}
                switch_data={input["switch_data"]}
              />
            ))}
          </Timeline>
        </Box>
      </CardContent>
    </Card>
  );
}
