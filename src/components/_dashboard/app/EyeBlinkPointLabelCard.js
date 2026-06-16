import { Box, Card, Typography } from "@mui/material";
import { formatBlinkLabelDisplay } from "../../../utils/blinkClassification.js";

const PLACEHOLDER_FRAME = "001/155";
const PLACEHOLDER_TIMESTAMP = "0.27s";
const PLACEHOLDER_SCORE = "0.99";

function DetailRow({ label, value, emphasized = false }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}:
      </Typography>
      <Typography
        variant="body2"
        color={emphasized ? "text.primary" : "text.secondary"}
        sx={{
          fontWeight: emphasized ? 600 : 400,
          textTransform: emphasized ? "capitalize" : "none",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function EyeBlinkPointLabelCard({ selectedRow = null }) {
  const hasCsvRow =
    selectedRow?.frame_num != null && selectedRow?.total_frames != null;

  const frameDisplay = hasCsvRow
    ? `${String(selectedRow.frame_num).padStart(3, "0")}/${selectedRow.total_frames}`
    : PLACEHOLDER_FRAME;

  const timestampDisplay = hasCsvRow
    ? `${Number(selectedRow.timestamp_s).toFixed(2)}s`
    : selectedRow?.x != null
      ? `${Number(selectedRow.x).toFixed(2)}s`
      : PLACEHOLDER_TIMESTAMP;

  const scoreDisplay = hasCsvRow
    ? selectedRow.score != null
      ? selectedRow.score.toFixed(2)
      : "—"
    : PLACEHOLDER_SCORE;

  const classification = hasCsvRow
    ? selectedRow.classification
    : selectedRow?.y ?? null;

  const labelDisplay = formatBlinkLabelDisplay(classification);
  const hasSelection = classification !== null && classification !== undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        px: 2,
        py: 1.5,
        width: "100%",
        maxWidth: 200,
        boxShadow: "none",
      }}
    >
      <Box
        sx={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "grey.100",
          border: "1px dashed",
          borderColor: "grey.300",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ px: 1.5, lineHeight: 1.35 }}
        >
          Frame
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <DetailRow label="Frame" value={frameDisplay} />
        <DetailRow label="Timestamp" value={timestampDisplay} />
        <DetailRow label="Score" value={scoreDisplay} />
        <DetailRow label="Label" value={labelDisplay} emphasized={hasSelection} />
      </Box>
    </Card>
  );
}
