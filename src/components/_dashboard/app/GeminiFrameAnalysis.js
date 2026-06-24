import { useEffect, useState } from "react";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { alpha, Box, Card, CardContent, Tooltip, Typography } from "@mui/material";

const SUBJECT_REFERENCE_URL = "http://localhost:5001/home/face_crop";
const EYEBLINK_EXAMPLE_URL = "http://localhost:5001/home/eyeblink_example";

// ----------------------------------------------------------------------

const dashedBorderSx = {
  border: "1px dashed",
  borderColor: (theme) => alpha(theme.palette.info.main, 0.45),
};

const collageTooltipProps = {
  arrow: true,
  placement: "right",
  componentsProps: {
    tooltip: {
      sx: {
        maxWidth: "none",
        p: 1,
        bgcolor: "common.white",
        color: "text.primary",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
        boxShadow: 2,
      },
    },
  },
};

function FramePlaceholder({
  label,
  variant = "collage",
  subjectImageUrl = null,
  imageUrl = null,
  enableHoverPreview = false,
}) {
  const isSubject = variant === "subject";
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const resolvedImageUrl = isSubject ? subjectImageUrl : imageUrl;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [resolvedImageUrl]);

  const showCollageImage = !isSubject && resolvedImageUrl && !imageLoadFailed;
  const collageImage = showCollageImage ? (
    <Box
      component="img"
      src={resolvedImageUrl}
      alt={label}
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 72,
        objectFit: "contain",
        display: "block",
      }}
      onError={() => setImageLoadFailed(true)}
    />
  ) : null;

  const collageImageWithOptionalPreview =
    showCollageImage && enableHoverPreview ? (
      <Tooltip
        {...collageTooltipProps}
        title={
          <Box
            component="img"
            src={resolvedImageUrl}
            alt={`${label} enlarged`}
            sx={{
              display: "block",
              maxWidth: 420,
              width: "100%",
              height: "auto",
            }}
          />
        }
      >
        <Box
          sx={{
            width: "100%",
            minHeight: 72,
            display: "flex",
            cursor: "zoom-in",
          }}
        >
          {collageImage}
        </Box>
      </Tooltip>
    ) : (
      collageImage
    );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: isSubject ? "0 0 auto" : 1,
        minHeight: isSubject ? 0 : 72,
        alignItems: "stretch",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="medium"
        sx={{ mb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      {isSubject ? (
        <Box
          sx={{
            width: "100%",
            bgcolor: "common.white",
            display: "flex",
            justifyContent: "center",
            py: 0.25,
          }}
        >
          {subjectImageUrl && !imageLoadFailed ? (
            <Box
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                borderRadius: 1.5,
                overflow: "hidden",
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
              }}
            >
              <Box
                component="img"
                src={subjectImageUrl}
                alt="Subject reference crop"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={() => setImageLoadFailed(true)}
              />
            </Box>
          ) : (
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 1.5,
              ...dashedBorderSx,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              px: 0.5,
            }}
          >
            <ImageOutlinedIcon
              sx={{
                fontSize: 18,
                color: (theme) => alpha(theme.palette.info.dark, 0.5),
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ lineHeight: 1.2, fontSize: "0.6rem" }}
            >
              Subject crop
            </Typography>
          </Box>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 72,
            width: "100%",
            borderRadius: 1.5,
            bgcolor: "common.white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            px: 1,
            py: showCollageImage ? 0.5 : undefined,
            overflow: "hidden",
            ...(showCollageImage ? {} : dashedBorderSx),
          }}
        >
          {showCollageImage ? (
            collageImageWithOptionalPreview
          ) : (
            <>
              <ImageOutlinedIcon
                sx={{
                  fontSize: 28,
                  color: (theme) => alpha(theme.palette.info.dark, 0.5),
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{ lineHeight: 1.3, fontSize: "0.7rem" }}
              >
                Frame Collage
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function GeminiFrameAnalysis({
  aiAnalysisComplete = false,
  analysisComplete = false,
  subjectImageKey = 0,
  noFace = false,
}) {
  const subjectImageUrl =
    analysisComplete && !noFace
      ? `${SUBJECT_REFERENCE_URL}?t=${subjectImageKey}`
      : null;
  const eyeBlinkExampleUrl = analysisComplete
    ? `${EYEBLINK_EXAMPLE_URL}?t=${subjectImageKey}`
    : null;

  return (
    <Card
      sx={{
        width: "100%",
        bgcolor: (theme) => alpha(theme.palette.info.light, 0.35),
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.info.main, 0.12)}`,
      }}
    >
      <CardContent sx={{ py: 2, px: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 2.5 },
            alignItems: "stretch",
            minHeight: { md: 300 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              flexShrink: 0,
              width: { xs: "100%", md: 176 },
              minHeight: { md: 300 },
            }}
          >
            <FramePlaceholder
              label="Subject"
              variant="subject"
              subjectImageUrl={subjectImageUrl}
            />
            <FramePlaceholder label="Video Summary" variant="collage" enableHoverPreview />
            <FramePlaceholder
              label="Eye Blink Example"
              variant="collage"
              imageUrl={eyeBlinkExampleUrl}
              enableHoverPreview
            />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: 1.5,
              bgcolor: "common.white",
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
              px: 2,
              py: 1.5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              AI output
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontStyle: aiAnalysisComplete ? "normal" : "italic",
                lineHeight: 1.65,
                opacity: aiAnalysisComplete ? 1 : 0.72,
              }}
            >
              {aiAnalysisComplete
                ? "Gemini finished running! Analysis would go here."
                : "Gemini will review the full scene frame and the cropped subject frame to describe what it sees — setting, eyewear reflections, facial details, and signs of manipulation or AI generation. Results will appear here after analysis."}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
