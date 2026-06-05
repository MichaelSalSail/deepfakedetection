// material
import { Card, CardContent, Typography } from "@mui/material";

// ----------------------------------------------------------------------

function getDfdDisplay(dfdScore) {
  if (dfdScore === 0 || dfdScore === 50) {
    return {
      color: "grey",
      verdict:
        "No reliable score — run analysis first, or no usable face was found in the video.",
    };
  }
  if (dfdScore < 48) {
    return { color: "green", verdict: "Likely Authentic" };
  }
  if (dfdScore <= 68) {
    return { color: "yellow", verdict: "Uncertain" };
  }
  return { color: "red", verdict: "Likely deepfake" };
}

export default function DFDscore(input) {
  const dfdScore = input["results"]["models"][0]["DFD"];
  const { color, verdict } = getDfdDisplay(dfdScore);

  return (
    <Card>
      <CardContent>
        <Typography
          variant="body2"
          fontWeight="bold"
          color={color}
          fontFamily="Monospace"
          fontSize="h6.fontSize"
          textAlign="center"
        >
          SCORE: {dfdScore}%
        </Typography>
        <Typography
          variant="subtitle2"
          color={color}
          textAlign="center"
          sx={{ mt: 1, opacity: dfdScore === 0 || dfdScore === 50 ? 0.9 : 1 }}
        >
          {verdict}
        </Typography>
      </CardContent>
    </Card>
  );
}
