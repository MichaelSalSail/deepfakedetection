import CheckIcon from "@mui/icons-material/Check";
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
    { label: "Eye Blink Model", duration: formatRuntime(blinkRuntime) },
    { label: "Subject", duration: formatRuntime(subjectRuntime) },
    { label: "Total", duration: formatRuntime(totalRuntime), isTotal: true },
  ];
}

function DurationBox({ duration }) {
  return (
    <Box
      sx={{
        px: 0.5,
        py: 0,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "grey.400",
        borderRadius: 0.5,
        boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05)",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: "Monospace",
          fontWeight: 600,
          fontSize: "0.7rem",
          lineHeight: 1.25,
        }}
      >
        {duration}
      </Typography>
    </Box>
  );
}

function RuntimeValue({ duration, isTotal }) {
  if (isTotal) {
    return <DurationBox duration={duration} />;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
      <DurationBox duration={duration} />
      <CheckIcon sx={{ fontSize: 12, color: "success.main" }} aria-hidden />
    </Box>
  );
}

export default function ModelTimingLog({ results }) {
  const timingRows = buildTimingRows(results?.models ?? []);

  return (
    <Box
      sx={{
        width: "fit-content",
        flexShrink: 0,
        height: 36.5,
        boxSizing: "border-box",
        px: 1.25,
        bgcolor: "#F5F0E6",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "grey.300",
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "nowrap",
      }}
    >
      <Typography
        variant="caption"
        color="text.primary"
        sx={{
          fontWeight: 600,
          whiteSpace: "nowrap",
          lineHeight: 1.25,
          pr: 1,
          mr: 1,
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
            gap: 0.5,
            whiteSpace: "nowrap",
            pl: index > 0 ? 0.75 : 0,
            ml: index > 0 ? 0.75 : 0,
            borderLeft: index > 0 ? "1px solid" : "none",
            borderColor: "grey.400",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: row.isTotal ? 600 : 400, lineHeight: 1.25 }}
          >
            {row.label}
          </Typography>
          <RuntimeValue duration={row.duration} isTotal={row.isTotal} />
        </Box>
      ))}
    </Box>
  );
}
