import { useEffect, useState } from "react";
import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
// material
import { Card, CardHeader, Box } from "@mui/material";
//
import { BaseOptionChart } from "../../charts";

// ----------------------------------------------------------------------

const CHART_DATA = [
  {
    name: "Demo-Chart",
    data: [
      {
        x: "1",
        y: "34",
      },
      {
        x: "2",
        y: "21",
      },
      {
        x: "3",
        y: "23",
      },
      {
        x: "4",
        y: "32",
      },
      {
        x: "5",
        y: "65",
      },
      {
        x: "6",
        y: "90",
      },
      {
        x: "7",
        y: "30",
      },
      {
        x: "8",
        y: "30",
      },
    ],
  },
];

export default function AppWebsiteVisits({ deepfakeResults }) {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    let formattedSeries = deepfakeResults.map((p, i) => ({
      x: (i + 1).toString(),
      y: parseInt(p * 100).toString(),
    }));
    const chartData = [{ name: "Deep Fake Chart", data: formattedSeries }];
    setSeries(chartData);
  }, [deepfakeResults]);

  const chartOptions = {
    chart: { id: "demo-chart" },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    markers: {
      size: 2,
    },
    xaxis: {
      type: "category",
    },
    noData: {
      text: "No Data",
    },
  };

  return (
    <Card>
      <CardHeader title="Deep Fake Probabilities" subheader="(Per second)" />
      <Box sx={{ p: 3, pb: 1 }} dir="ltr">
        <ReactApexChart
          type="line"
          series={series}
          options={chartOptions}
          height={364}
        />
      </Box>
    </Card>
  );
}
