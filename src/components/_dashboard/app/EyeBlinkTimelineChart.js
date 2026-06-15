import merge from "lodash/merge";
import Chart from "react-apexcharts";
// material
import { Card, CardContent, Box, useTheme } from "@mui/material";
import BaseOptionChart from "../../charts/BaseOptionChart.js";

const DURATION_SECONDS = 10;

// missing=-2, unknown=-1, closed=1, open=2 — fixed placeholder at each whole second
const PLACEHOLDER_DATA = [
  [0, 2],
  [1, 2],
  [2, 1],
  [3, -1],
  [4, -2],
  [5, -2],
  [6, -1],
  [7, 1],
  [8, 2],
  [9, 2],
  [10, 1],
];

const PLACEHOLDER_SERIES = [
  {
    name: "Classification",
    data: PLACEHOLDER_DATA,
  },
];

export default function EyeBlinkTimelineChart() {
  const theme = useTheme();
  const baseOptions = BaseOptionChart();
  const axisColor = theme.palette.text.primary;

  const options = merge({}, baseOptions, {
    chart: {
      type: "line",
      animations: { enabled: false },
    },
    colors: [theme.palette.grey[500]],
    stroke: {
      width: 2,
      curve: "straight",
    },
    markers: { size: 0 },
    legend: { show: false },
    tooltip: { enabled: false },
    annotations: {
      yaxis: [
        {
          y: 0,
          borderColor: axisColor,
          borderWidth: 2,
          strokeDashArray: 0,
        },
      ],
    },
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider,
      padding: { left: 8, right: 16 },
    },
    xaxis: {
      type: "numeric",
      min: 0,
      max: DURATION_SECONDS,
      tickAmount: DURATION_SECONDS,
      axisBorder: {
        show: true,
        color: axisColor,
        height: 2,
      },
      axisTicks: {
        show: true,
        color: axisColor,
      },
      title: {
        text: "Time (s)",
        style: {
          fontSize: "12px",
          fontWeight: 500,
          color: theme.palette.text.secondary,
        },
      },
    },
    yaxis: {
      min: -2,
      max: 2,
      tickAmount: 4,
      forceNiceScale: false,
      title: {
        text: "Classification",
        style: {
          fontSize: "12px",
          fontWeight: 500,
          color: theme.palette.text.secondary,
        },
      },
      labels: {
        formatter: (value) => {
          const rounded = Math.round(value);
          if (rounded >= -2 && rounded <= 2) {
            return String(rounded);
          }
          return "";
        },
      },
    },
  });

  return (
    <Card sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          py: 1.5,
          px: 1,
          "&:last-child": { pb: 1.5 },
        }}
      >
        <Box sx={{ flex: 1, minHeight: 220, height: 240 }}>
          <Chart
            type="line"
            series={PLACEHOLDER_SERIES}
            options={options}
            width="100%"
            height={240}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
