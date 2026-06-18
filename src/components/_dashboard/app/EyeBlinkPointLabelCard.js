import { useEffect, useState } from "react";
import { Box, Card, Typography } from "@mui/material";
import { formatBlinkLabelDisplay } from "../../../utils/blinkClassification.js";
import { BLINK_TIMELINE_ROW_HEIGHT } from "./Eyeblinks.js";

const BLINK_FRAME_URL = "http://localhost:5001/home/blink_frame";
const EMPTY_VALUE = "—";

function DetailRow({ label, value, emphasized = false }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 0.5 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.8125rem", lineHeight: 1.25 }}
      >
        {label}:
      </Typography>
      <Typography
        variant="caption"
        color={emphasized ? "text.primary" : "text.secondary"}
        sx={{
          fontSize: "0.8125rem",
          lineHeight: 1.25,
          fontWeight: emphasized ? 600 : 400,
          textTransform: emphasized ? "capitalize" : "none",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function EyeBlinkPointLabelCard({
  selectedRow = null,
  analysisComplete = false,
  frameImageKey = 0,
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const hasCsvRow =
    selectedRow?.frame_num != null && selectedRow?.total_frames != null;

  const frameDisplay = hasCsvRow
    ? `${String(selectedRow.frame_num).padStart(3, "0")}/${selectedRow.total_frames}`
    : EMPTY_VALUE;

  const timestampDisplay = hasCsvRow
    ? `${Number(selectedRow.timestamp_s).toFixed(2)}s`
    : EMPTY_VALUE;

  const scoreDisplay = hasCsvRow
    ? selectedRow.score != null
      ? selectedRow.score.toFixed(2)
      : EMPTY_VALUE
    : EMPTY_VALUE;

  const classification = hasCsvRow ? selectedRow.classification : null;
  const labelDisplay = formatBlinkLabelDisplay(classification);
  const hasSelection = classification !== null && classification !== undefined;

  const frameImageUrl =
    analysisComplete && hasCsvRow && !imageLoadFailed
      ? `${BLINK_FRAME_URL}/${selectedRow.frame_num}?t=${frameImageKey}`
      : null;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [frameImageKey, analysisComplete, selectedRow?.frame_num]);

  return (
    <Card
      variant="outlined"
      sx={{
        px: 1,
        py: 1,
        width: "100%",
        height: BLINK_TIMELINE_ROW_HEIGHT,
        boxShadow: "none",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            height: "100%",
            maxWidth: "100%",
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
          {frameImageUrl ? (
            <Box
              component="img"
              src={frameImageUrl}
              alt={`Blink frame ${selectedRow.frame_num}`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ px: 1.5, lineHeight: 1.35 }}
            >
              {analysisComplete && hasCsvRow && imageLoadFailed
                ? "Frame unavailable"
                : "Frame"}
            </Typography>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 0.75,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.375,
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
