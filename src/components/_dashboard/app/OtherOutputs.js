import { useEffect, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
// material
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

const FACE_CROP_URL = "http://localhost:5001/home/face_crop";
const SUBJECT_HELP =
  "Eyewear and facial hair are often harder to fake, so they can be signs of a genuine video. " +
  "These models focus on one person only—the cropped face shown here. " +
  "If your video has multiple people, the results describe just this subject.";

function formatAge(age, isPlaceholder) {
  if (isPlaceholder || age === 0) {
    return "?";
  }
  return String(age);
}

function formatGender(gender, isPlaceholder) {
  if (isPlaceholder || gender === "??") {
    return "?";
  }
  return gender;
}

function formatShades(shades, isPlaceholder) {
  if (isPlaceholder) {
    return "?";
  }
  return shades ? "Detected" : "Not detected";
}

function FactRow({ label, value, isLast }) {
  return (
    <Box sx={{ mb: isLast ? 0 : 1 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="medium" lineHeight={1.2}>
        {value}
      </Typography>
    </Box>
  );
}

export default function OtherOutputs({ results, analysisComplete, subjectImageKey, compact = false }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const person = results["models"][2];
  const shades = results["models"][3];
  const isPlaceholder = !analysisComplete || (person["age"] === 0 && person["gender"] === "??");

  const age = formatAge(person["age"], isPlaceholder);
  const gender = formatGender(person["gender"], isPlaceholder);
  const eyewear = formatShades(shades["shades"], isPlaceholder);

  const imageUrl = analysisComplete && !imageLoadFailed
    ? `${FACE_CROP_URL}?t=${subjectImageKey}`
    : null;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [subjectImageKey, analysisComplete]);

  return (
    <Card
      sx={{
        height: compact ? "auto" : { md: "100%" },
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          py: compact ? 1.5 : 2,
          flex: compact ? "none" : 1,
          display: "flex",
          flexDirection: "column",
          "&:last-child": { pb: compact ? 1.5 : 2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", mb: compact ? 1 : 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1, pr: 1 }}>
            One subject per video — results reflect only this face.
          </Typography>
          <Tooltip title={SUBJECT_HELP} arrow placement="left">
            <IconButton size="small" aria-label="About subject analysis" sx={{ mt: -0.5 }}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: compact ? 1.5 : 2,
            alignItems: compact ? "stretch" : "center",
            flexDirection: compact ? "column" : "row",
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: compact ? "100%" : "68%",
              maxWidth: compact ? 140 : 240,
              mx: compact ? "auto" : 0,
              flexShrink: 0,
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
            {imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt="Cropped face used for subject analysis"
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
                {analysisComplete
                  ? "Crop unavailable"
                  : "Crop appears after analysis"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: compact ? "row" : "column",
              flexWrap: compact ? "wrap" : "nowrap",
              justifyContent: compact ? "space-around" : "center",
              gap: compact ? 1 : 0,
            }}
          >
            <FactRow label="Age" value={age} isLast={compact} />
            <FactRow label="Gender" value={gender} isLast={compact} />
            <FactRow label="Eyewear" value={eyewear} isLast />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
