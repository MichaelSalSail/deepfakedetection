import merge from "lodash/merge";
import Chart from "react-apexcharts";
// material
import { Card, CardContent, Box, useTheme } from "@mui/material";
import BaseOptionChart from "../../charts/BaseOptionChart.js";

// Static placeholder — no data wiring yet
const PLACEHOLDER_SERIES = [
  {
    name: "Classification",
    data: [
      [0, 2],
      [2, 2],
      [2, 3],
      [5, 3],
      [5, 2],
      [7, 1],
      [10, 2],
    ],
  },
];

export default function EyeBlinkTimelineChart() {
  const theme = useTheme();
  const baseOptions = BaseOptionChart();

  const options = merge({}, baseOptions, {
    chart: {
      type: "line",
      animations: { enabled: false },
    },
    colors: [theme.palette.grey[400]],
    stroke: {
      width: 2,
      curve: "stepline",
      dashArray: 6,
    },
    markers: { size: 0 },
    legend: { show: false },
    tooltip: { enabled: false },
    grid: {
      strokeDashArray: 3,
      borderColor: theme.palette.divider,
      padding: { left: 8, right: 16 },
    },
    xaxis: {
      type: "numeric",
      min: 0,
      max: 10,
      tickAmount: 5,
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
      min: 0,
      max: 3,
      tickAmount: 4,
      title: {
        text: "Classification",
        style: {
          fontSize: "12px",
          fontWeight: 500,
          color: theme.palette.text.secondary,
        },
      },
      labels: {
        formatter: () => "",
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
