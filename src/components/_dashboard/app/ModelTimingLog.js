import { Box, Typography } from "@mui/material";

const TIMING_ROWS = [
  { label: "Base Model", duration: "0s" },
  { label: "Subject", duration: "0s" },
  { label: "Eye Blink Model", duration: "0s" },
  { label: "Total", duration: "0s", isTotal: true },
];

export default function ModelTimingLog() {
  return (
    <Box
      sx={{
        ml: { xs: 0, sm: 1.25 },
        mt: { xs: 1.5, sm: 0 },
        px: 2,
        py: 1,
        bgcolor: "#F5F0E6",
        borderRadius: 1,
        border: "1px solid",
        borderColor: "grey.300",
        display: "flex",
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
          pr: 1.5,
          mr: 1.5,
          borderRight: "1px solid",
          borderColor: "grey.400",
        }}
      >
        Analysis Runtime
      </Typography>
      {TIMING_ROWS.map((row, index) => (
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
