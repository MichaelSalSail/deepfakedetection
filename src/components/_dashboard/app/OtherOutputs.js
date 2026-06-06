import { useEffect, useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
// material
import {
  Box,
  Card,
  CardContent,
  Grid,
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

function FactRow({ label, value }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </Box>
  );
}

export default function OtherOutputs({ results, analysisComplete, subjectImageKey }) {
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
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            One subject per video — the face used for age, gender, and eyewear checks.
          </Typography>
          <Tooltip title={SUBJECT_HELP} arrow placement="left">
            <IconButton size="small" aria-label="About subject analysis">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 280,
                mx: "auto",
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
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ px: 2 }}
                >
                  {analysisComplete
                    ? "Subject crop unavailable"
                    : "Subject crop will appear here after analysis"}
                </Typography>
              )}
            </Box>
            {imageUrl ? (
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                align="center"
                sx={{ mt: 1 }}
              >
                Cropped face from your video
              </Typography>
            ) : null}
          </Grid>

          <Grid item xs={12} sm={7} md={8}>
            <FactRow label="Age" value={age} />
            <FactRow label="Gender" value={gender} />
            <FactRow label="Eyewear" value={eyewear} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
