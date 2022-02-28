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
let result_beard = require('../../../pages/AllResultsJSON/result_beard.json');
let result_shades = require('../../../pages/AllResultsJSON/result_shades.json');

// ----------------------------------------------------------------------
const from_beard=result_beard["beard"]
const from_shades=result_shades["shades"]

// ----------------------------------------------------------------------

OrderItem.propTypes = {
  item: PropTypes.object,
  isLast: PropTypes.bool,
};

function OrderItem({ item, isLast }) {
  const {type, title} = item;
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

export default function OtherOutputs() {
  const [timeline, setTimeline] = useState([]);

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
              />
            ))}
          </Timeline>
        </Box>
      </CardContent>
    </Card>
  );
}
