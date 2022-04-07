import * as React from 'react';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from "react";

import faker from "faker";
import PropTypes from "prop-types";
// material
import { Card, Typography, CardContent, Box, Button } from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineConnector,
  TimelineSeparator,
  TimelineDot,
} from "@mui/lab";
import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';

// ----------------------------------------------------------------------

OrderItem.propTypes = {
  item: PropTypes.object,
  isLast: PropTypes.bool,
};

function OrderItem({ item, isLast, result_beard, result_shades }) {
  const {type, title} = item;
  // obtain the booleans
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

const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));

export default function OtherOutputs(input) {
  const [timeline, setTimeline] = useState([]);
  let result_beard = input["results"]["models"][2];
  let result_shades = input["results"]["models"][3];
  // only need 4 values
  let from_beard=result_beard["beard"]
  let from_shades=result_shades["shades"]
  let output_beard=result_beard["raw_output"]
  let output_shades=result_shades["raw_output"]

  let beard_content="The subject is young and/or female."
  if(from_beard===true)
    beard_content="There appears to be an adult male."
 
  let shades_content="It's unlikely the subject has eyewear"
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
      <CardContent>
        <Box>
          <HtmlTooltip
          title={
                  <React.Fragment>
                    {output_beard}
                  </React.Fragment>
                }
              >
              <Button color="secondary">Beard Raw Data</Button>
          </HtmlTooltip>
          <HtmlTooltip
          title={
                  <React.Fragment>
                    {output_shades}
                  </React.Fragment>
                }
              >
              <Button color="secondary">Shades Raw Data</Button>
          </HtmlTooltip>
          <Timeline>
            {timeline.map((item) => (
              <OrderItem
                key={item.title}
                item={item}
                isLast={true}
                result_beard={result_beard}
                result_shades={result_shades}
              />
            ))}
          </Timeline>
        </Box>
      </CardContent>
    </Card>
  );
}
