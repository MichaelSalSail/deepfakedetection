import { useCallback, useEffect, useState } from "react";
import { Box, Card, IconButton, Typography } from "@mui/material";
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

function formatBlinkScoreDisplay(score) {
  if (score == null || Number.isNaN(Number(score))) {
    return EMPTY_VALUE;
  }
  return Number(score).toFixed(2);
}

export default function EyeBlinkPointLabelCard({
  selectedRow = null,
  analysisComplete = false,
  frameImageKey = 0,
  timelineRows = null,
  onSelectRow,
  onFrameImageLoadingChange,
  livePreviewActive = false,
  livePreviewRow = null,
  livePreviewFrameKey = 0,
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [frameImageLoading, setFrameImageLoading] = useState(false);

  const isLivePreview = livePreviewActive && livePreviewRow != null;
  const displayRow = isLivePreview ? livePreviewRow : selectedRow;
  const hasRow =
    displayRow?.frame_num != null && displayRow?.total_frames != null;

  const frameDisplay = hasRow
    ? `${String(displayRow.frame_num).padStart(3, "0")}/${displayRow.total_frames}`
    : EMPTY_VALUE;

  const timestampDisplay = hasRow
    ? `${Number(displayRow.timestamp_s).toFixed(2)}s`
    : EMPTY_VALUE;

  const scoreDisplay = hasRow
    ? formatBlinkScoreDisplay(displayRow.score)
    : EMPTY_VALUE;

  const classification = hasRow ? displayRow.classification : null;
  const labelDisplay = formatBlinkLabelDisplay(classification);
  const hasSelection = classification !== null && classification !== undefined;

  const frameImageUrl = hasRow && !imageLoadFailed
    ? `${BLINK_FRAME_URL}/${displayRow.frame_num}?t=${
        isLivePreview ? livePreviewFrameKey : frameImageKey
      }`
    : null;

  const showNavOverlay =
    !isLivePreview &&
    analysisComplete &&
    timelineRows?.length > 0 &&
    selectedRow?.frame_num != null &&
    selectedRow?.total_frames != null;

  const currentIndex = showNavOverlay
    ? timelineRows.findIndex((row) => row.frame_num === selectedRow.frame_num)
    : -1;

  const canGoPrev = currentIndex > 0;
  const canGoNext =
    currentIndex >= 0 && currentIndex < timelineRows.length - 1;

  const finishImageLoading = useCallback(() => {
    setFrameImageLoading(false);
  }, []);

  const handleImageLoad = useCallback(() => {
    finishImageLoading();
  }, [finishImageLoading]);

  const handleImageError = useCallback(() => {
    setImageLoadFailed(true);
    finishImageLoading();
  }, [finishImageLoading]);

  const handleImageRef = useCallback(
    (img) => {
      if (img?.complete) {
        if (img.naturalWidth > 0) {
          finishImageLoading();
        } else {
          handleImageError();
        }
      }
    },
    [finishImageLoading, handleImageError]
  );

  const handlePrev = () => {
    if (frameImageLoading || !canGoPrev) {
      return;
    }
    onSelectRow?.(timelineRows[currentIndex - 1]);
  };

  const handleNext = () => {
    if (frameImageLoading || !canGoNext) {
      return;
    }
    onSelectRow?.(timelineRows[currentIndex + 1]);
  };

  useEffect(() => {
    setImageLoadFailed(false);
  }, [
    frameImageKey,
    analysisComplete,
    selectedRow?.frame_num,
    livePreviewRow?.frame_num,
    livePreviewFrameKey,
  ]);

  useEffect(() => {
    if (hasRow && !imageLoadFailed) {
      setFrameImageLoading(true);
    } else {
      setFrameImageLoading(false);
    }
  }, [
    frameImageKey,
    analysisComplete,
    selectedRow?.frame_num,
    imageLoadFailed,
    hasRow,
    isLivePreview,
    livePreviewRow?.frame_num,
    livePreviewFrameKey,
  ]);

  useEffect(() => {
    onFrameImageLoadingChange?.(frameImageLoading);
  }, [frameImageLoading, onFrameImageLoadingChange]);

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
            position: "relative",
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
              key={
                isLivePreview
                  ? `live-${displayRow.frame_num}-${livePreviewFrameKey}`
                  : `${displayRow.frame_num}-${frameImageKey}`
              }
              ref={handleImageRef}
              src={frameImageUrl}
              alt={`Blink frame ${displayRow.frame_num}`}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ px: 1.5, lineHeight: 1.35 }}
            >
              {!isLivePreview && analysisComplete && hasRow && imageLoadFailed
                ? "Frame unavailable"
                : "Frame"}
            </Typography>
          )}

          {showNavOverlay && (
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                px: 0.5,
                py: 0.25,
                borderRadius: "8px 8px 0 0",
                bgcolor: "rgba(0, 0, 0, 0.45)",
              }}
            >
              <IconButton
                size="small"
                aria-label="Previous frame"
                disabled={!canGoPrev || frameImageLoading}
                onClick={handlePrev}
                sx={{
                  color: "common.white",
                  p: 0.25,
                  minWidth: 24,
                  minHeight: 24,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.35)" },
                }}
              >
                {"<"}
              </IconButton>
              <IconButton
                size="small"
                aria-label="Next frame"
                disabled={!canGoNext || frameImageLoading}
                onClick={handleNext}
                sx={{
                  color: "common.white",
                  p: 0.25,
                  minWidth: 24,
                  minHeight: 24,
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.35)" },
                }}
              >
                {">"}
              </IconButton>
            </Box>
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
