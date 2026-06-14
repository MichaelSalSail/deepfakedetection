import { Box, Typography } from "@mui/material";
import formatRuntime from "../../../utils/formatRuntime.js";

function modelRuntime(model) {
  return model?.runtime ?? 0;
}

function buildTimingRows(models) {
  const baseRuntime = modelRuntime(models[0]);
  const blinkRuntime = modelRuntime(models[1]);
  const ageGenderRuntime = modelRuntime(models[2]);
  const shadesRuntime = modelRuntime(models[3]);
  const subjectRuntime = ageGenderRuntime + shadesRuntime;
  const totalRuntime = baseRuntime + blinkRuntime + ageGenderRuntime + shadesRuntime;

  return [
    { label: "Base Model", duration: formatRuntime(baseRuntime) },
    { label: "Subject", duration: formatRuntime(subjectRuntime) },
    { label: "Eye Blink Model", duration: formatRuntime(blinkRuntime) },
    { label: "Total", duration: formatRuntime(totalRuntime), isTotal: true },
  ];
}

export default function ModelTimingLog({ results }) {
  const timingRows = buildTimingRows(results?.models ?? []);

  return (
    <Box
      sx={{
        px: 2,
        py: 1,
        bgcolor: "#F5F0E6",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "grey.300",
        display: "flex",
        alignItems: "center",
        flexWrap: "nowrap",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="caption"
        color="text.primary"
        sx={{
          fontWeight: 600,
          whiteSpace: "nowrap",
          pr: 1.5,
          mr: 1.5,
          borderRight: "1px solid",
          borderColor: "grey.400",
        }}
      >
        Runtime Log
      </Typography>
      {timingRows.map((row, index) => (
        <Box
          key={row.label}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            whiteSpace: "nowrap",
            pl: index > 0 ? 1.5 : 0,
            ml: index > 0 ? 1.5 : 0,
            borderLeft: index > 0 ? "1px solid" : "none",
            borderColor: "grey.400",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: row.isTotal ? 600 : 400 }}
          >
            {row.label}
          </Typography>
          <Typography
            variant="caption"
            color="text.primary"
            sx={{ fontFamily: "Monospace", fontWeight: row.isTotal ? 600 : 400 }}
          >
            {row.duration}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
