import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Typography } from "@mui/material";
import { buildModelTimingRows } from "../../../utils/modelTimingStatus.js";

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

function RuntimeValue({ duration, isTotal, hasError, showStatusIcon }) {
  if (isTotal) {
    return <DurationBox duration={duration} />;
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
      <DurationBox duration={duration} />
      {showStatusIcon ? (
        hasError ? (
          <CloseIcon sx={{ fontSize: 12, color: "error.main" }} aria-hidden />
        ) : (
          <CheckIcon sx={{ fontSize: 12, color: "success.main" }} aria-hidden />
        )
      ) : null}
    </Box>
  );
}

export default function ModelTimingLog({ results, analysisComplete = false }) {
  const timingRows = buildModelTimingRows(results?.models ?? [], analysisComplete);

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
          <RuntimeValue
            duration={row.duration}
            isTotal={row.isTotal}
            hasError={row.hasError}
            showStatusIcon={row.showStatusIcon}
          />
        </Box>
      ))}
    </Box>
  );
}
