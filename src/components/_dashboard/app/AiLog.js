import CheckIcon from "@mui/icons-material/Check";
import { alpha, Box, Typography } from "@mui/material";

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

export default function AiLog({ duration = "0s", complete = false }) {
  return (
    <Box
      sx={{
        width: "fit-content",
        flexShrink: 0,
        height: 36.5,
        boxSizing: "border-box",
        px: 1.25,
        bgcolor: (theme) => alpha(theme.palette.info.light, 0.35),
        borderRadius: 1,
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
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
          borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
        }}
      >
        AI Log
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          whiteSpace: "nowrap",
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.25 }}>
          Gemini
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
          <DurationBox duration={duration} />
          {complete ? (
            <CheckIcon sx={{ fontSize: 12, color: "success.main" }} aria-hidden />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
