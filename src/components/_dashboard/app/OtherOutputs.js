import { useEffect, useState } from "react";
// material
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

import { isNoFaceScenario } from "../../../utils/modelTimingStatus.js";

const FACE_CROP_URL = "http://localhost:5001/home/face_crop";

function formatAgeRange(ageMin, ageMax, isPlaceholder) {
  if (isPlaceholder || (ageMin === 0 && ageMax === 0)) {
    return "?";
  }
  if (ageMin === ageMax) {
    return String(ageMin);
  }
  return `${ageMin} – ${ageMax}`;
}

function formatGenderScore(score, isPlaceholder) {
  if (isPlaceholder || score == null) {
    return "?";
  }
  return `${Number(score).toFixed(1)}%`;
}

function formatShadesScore(score) {
  if (score == null) {
    return "?";
  }
  return `${Number(score).toFixed(1)}%`;
}

function genderScoreColor(score) {
  if (score >= 60) return "green";
  if (score <= 40) return "red";
  return "warning.dark";
}

function orderGenderScoreRows(manScore, womanScore, isPlaceholder) {
  const rows = [
    { label: "Man", score: manScore },
    { label: "Woman", score: womanScore },
  ];
  if (isPlaceholder || manScore == null || womanScore == null) {
    return rows;
  }
  const rank = (color) => {
    if (color === "green") return 0;
    if (color === "warning.dark") return 1;
    return 2;
  };
  return [...rows].sort((a, b) => {
    const rankDiff =
      rank(genderScoreColor(Number(a.score))) -
      rank(genderScoreColor(Number(b.score)));
    if (rankDiff !== 0) {
      return rankDiff;
    }
    return Number(b.score) - Number(a.score);
  });
}

const STAT_LABEL_SX = {
  display: "block",
  mb: 0.75,
  lineHeight: 1.2,
};

function FactRow({ label, value, centered = false }) {
  return (
    <Box sx={{ textAlign: centered ? "center" : "left" }}>
      <Typography variant="caption" color="text.secondary" sx={STAT_LABEL_SX}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight="medium" lineHeight={1.2}>
        {value}
      </Typography>
    </Box>
  );
}

function GenderScoresTable({ manScore, womanScore, isPlaceholder }) {
  const rows = orderGenderScoreRows(manScore, womanScore, isPlaceholder);

  return (
    <Box
      sx={{
        display: "inline-block",
        border: "1px solid",
        borderColor: "grey.300",
        borderRadius: 1,
        overflow: "hidden",
        minWidth: 120,
      }}
    >
      {rows.map(({ label, score }, index) => (
        <Box
          key={label}
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 1.5,
            px: 1.25,
            py: 0.5,
            borderTop: index > 0 ? "1px solid" : "none",
            borderColor: "grey.300",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" fontWeight="medium" lineHeight={1.2}>
            {label}
          </Typography>
          <Typography
            variant="body2"
            fontWeight="medium"
            lineHeight={1.2}
            color={
              isPlaceholder || score == null
                ? undefined
                : genderScoreColor(Number(score))
            }
          >
            {formatGenderScore(score, isPlaceholder)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function GenderScoresBox({ manScore, womanScore, isPlaceholder, centered = false }) {
  return (
    <Box sx={{ textAlign: centered ? "center" : "left" }}>
      <Typography variant="caption" color="text.secondary" sx={STAT_LABEL_SX}>
        Gender
      </Typography>
      <GenderScoresTable
        manScore={manScore}
        womanScore={womanScore}
        isPlaceholder={isPlaceholder}
      />
    </Box>
  );
}

export default function OtherOutputs({ results, analysisComplete, subjectImageKey, compact = false }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const person = results["models"][2];
  const shades = results["models"][3];
  const noFace = analysisComplete && isNoFaceScenario(results.models);
  const isPlaceholder =
    !analysisComplete ||
    (person.age_min === 0 &&
      person.age_max === 0 &&
      person.gender_man_score == null &&
      person.gender_woman_score == null);

  const ageDisplay = formatAgeRange(person.age_min, person.age_max, isPlaceholder);
  const manScore = person.gender_man_score;
  const womanScore = person.gender_woman_score;
  const showEyewear = !isPlaceholder && shades["shades"];
  const shadesScore = shades["shades_score"];

  const imageUrl = analysisComplete && !noFace && !imageLoadFailed
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
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          sx={{ display: "block", mb: compact ? 1 : 1.5 }}
        >
          Estimated age range, gender likelihood, and eyewear.
        </Typography>

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
                {!analysisComplete
                  ? "Crop appears after analysis"
                  : noFace
                    ? "No face detected"
                    : "Crop unavailable"}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              width: "100%",
              display: "flex",
              flexDirection: showEyewear ? (compact ? "row" : "column") : "row",
              flexWrap: showEyewear && compact ? "wrap" : "nowrap",
              justifyContent: showEyewear && compact ? "space-around" : "center",
              alignItems: "flex-start",
              gap: showEyewear ? (compact ? 1 : 1.5) : 4,
            }}
          >
            <FactRow label="Age" value={ageDisplay} centered={!showEyewear} />
            <GenderScoresBox
              manScore={manScore}
              womanScore={womanScore}
              isPlaceholder={isPlaceholder}
              centered={!showEyewear}
            />
            {showEyewear && (
              <FactRow label="Eyewear" value={formatShadesScore(shadesScore)} />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
