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
import { fDateTime } from "../../../utils/formatTime";

// ----------------------------------------------------------------------

const TIMELINES = [
  {
    title: "No beards or facial hair was detected",
    time: faker.date.past(),
    type: "Facial Hair",
  },
  {
    title:
      "Glasses return a string: There appears to be glasses. Large glasses are hard to deep fake",
    time: faker.date.past(),
    type: "Eyewear",
  },
  {
    title: "50% of frames are eyes open. 50% of frames are eyes closed",
    time: faker.date.past(),
    type: "Eye blink",
  },
];

// ----------------------------------------------------------------------

OrderItem.propTypes = {
  item: PropTypes.object,
  isLast: PropTypes.bool,
};

function OrderItem({ item, isLast }) {
  const { type, title, time } = item;
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot
          sx={{
            bgcolor:
              (type === "Facial Hair" && "primary.main") ||
              (type === "Eyewear" && "success.main") ||
              (type === "Eye blink" && "info.main") ||
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

export default function Eyeblinks({
  missingFrames,
  unknownFrames,
  openedFrames,
  closedFrames,
}) {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    let total = missingFrames + unknownFrames + openedFrames + closedFrames;
    let openPercent = ((openedFrames / total) * 100).toFixed(2);
    let closePercent = ((closedFrames / total) * 100).toFixed(2);

    setTimeline([
      {
        title: `${openPercent}% of frames are eyes open. ${closePercent}% of frames are eyes closed`,
        time: faker.date.past(),
        type: "Eye blink",
      },
    ]);
  }, [missingFrames, unknownFrames, openedFrames, closedFrames]);

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
            {timeline.map((item, index) => (
              <OrderItem
                key={item.title}
                item={item}
                isLast={index === TIMELINES.length - 1}
              />
            ))}
          </Timeline>
        </Box>
      </CardContent>
    </Card>
  );
}
