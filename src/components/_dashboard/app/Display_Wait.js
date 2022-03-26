import * as React from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

export default function Display_Wait() {
  const [progress, setProgress] = React.useState(1);
  // true runtime per video second
  const runtime_rate = 0
  // total video duration
  const video_secs = 10.99
  // per_increment = (runtime_rate * video_secs * 1000 ms)/100
  let per_increment = 100

  React.useEffect(() => {
    const timer = setInterval(() => {
      // prevProgress + (some number): the rate at which the progress display increases
      setProgress((prevProgress) => (prevProgress === 100 ? 100 : prevProgress + 1));
      // extra value below: the amount of time in milliseconds for each increment
    }, per_increment);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgressWithLabel value={progress} />
    </Box>
  );
}