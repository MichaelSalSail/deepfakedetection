import { useEffect, useState } from "react";
import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
// material
import { Card, CardHeader, Box } from "@mui/material";
//
import { BaseOptionChart } from "../../charts/index.js";
let DFD_result = require('../../../pages/AllResultsJSON/result_update.json')[0];

// ----------------------------------------------------------------------

const CHART_DATA = [
  {
    name: "Demo-Chart",
    data: [DFD_result["DFD"],DFD_result["DFD"],DFD_result["DFD"],
           DFD_result["DFD"],DFD_result["DFD"]],
  },
];

export default function DFDchart({ deepfakeResults }) {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    let formattedSeries = deepfakeResults.map((p, i) => ({
      x: (i + 1).toString(),
      y: parseInt(p * 100).toString(),
    }));
    const chartData = [{ name: "Deepfake Chart", data: formattedSeries }];
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
      categories: [2, 4, 6, 8, 10]
    },
  };

  return (
    <Card>
      <CardHeader title="Deepfake Probabilities" subheader="(Per second)" />
      <Box sx={{ p: 3, pb: 1 }} dir="ltr">
        <ReactApexChart
          type="line"
          series={CHART_DATA}
          options={chartOptions}
          height={364}
        />
      </Box>
    </Card>
  );
}