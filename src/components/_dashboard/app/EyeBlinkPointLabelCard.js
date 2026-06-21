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

export default function EyeBlinkPointLabelCard({
  selectedRow = null,
  analysisComplete = false,
  frameImageKey = 0,
  timelineRows = null,
  onSelectRow,
  onFrameImageLoadingChange,
  livePreviewActive = false,
  livePreviewFrameNum = null,
  livePreviewFrameKey = 0,
}) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [frameImageLoading, setFrameImageLoading] = useState(false);

  const isLivePreview = livePreviewActive && livePreviewFrameNum != null;

  const hasCsvRow =
    !isLivePreview &&
    selectedRow?.frame_num != null &&
    selectedRow?.total_frames != null;

  const frameDisplay = isLivePreview
    ? String(livePreviewFrameNum)
    : hasCsvRow
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

  const frameImageUrl = isLivePreview && !imageLoadFailed
    ? `${BLINK_FRAME_URL}/${livePreviewFrameNum}?t=${livePreviewFrameKey}`
    : analysisComplete && hasCsvRow && !imageLoadFailed
      ? `${BLINK_FRAME_URL}/${selectedRow.frame_num}?t=${frameImageKey}`
      : null;

  const showNavOverlay =
    analysisComplete && timelineRows?.length > 0 && hasCsvRow;

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
    livePreviewFrameNum,
    livePreviewFrameKey,
  ]);

  useEffect(() => {
    if ((isLivePreview || (analysisComplete && hasCsvRow)) && !imageLoadFailed) {
      setFrameImageLoading(true);
    } else {
      setFrameImageLoading(false);
    }
  }, [
    frameImageKey,
    analysisComplete,
    selectedRow?.frame_num,
    imageLoadFailed,
    hasCsvRow,
    isLivePreview,
    livePreviewFrameNum,
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
                  ? `live-${livePreviewFrameNum}-${livePreviewFrameKey}`
                  : `${selectedRow.frame_num}-${frameImageKey}`
              }
              ref={handleImageRef}
              src={frameImageUrl}
              alt={
                isLivePreview
                  ? `Blink frame ${livePreviewFrameNum}`
                  : `Blink frame ${selectedRow.frame_num}`
              }
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
              {analysisComplete && hasCsvRow && imageLoadFailed
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
