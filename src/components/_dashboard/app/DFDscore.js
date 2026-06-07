// material
import { Card, CardContent, Typography } from "@mui/material";

// ----------------------------------------------------------------------

function getDfdDisplay(dfdScore) {
  if (dfdScore === 0) {
    return {
      color: "grey",
      verdict:
        "No reliable score — run analysis first, or no usable face was found in the video.",
      failureHint: null,
    };
  }
  if (dfdScore === 50) {
    return {
      color: "grey",
      verdict: "No reliable score — analysis may not have completed successfully.",
      failureHint:
        "Often means the analysis failed (e.g. out of memory). Try a shorter video.",
    };
  }
  if (dfdScore < 48) {
    return { color: "green", verdict: "Likely Authentic", failureHint: null };
  }
  if (dfdScore <= 68) {
    return { color: "yellow", verdict: "Uncertain", failureHint: null };
  }
  return { color: "red", verdict: "Likely deepfake", failureHint: null };
}

export default function DFDscore(input) {
  const dfdScore = input["results"]["models"][0]["DFD"];
  const { color, verdict, failureHint } = getDfdDisplay(dfdScore);

  return (
    <Card>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
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
        {failureHint ? (
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            display="block"
            sx={{ mt: 1, px: 1 }}
          >
            {failureHint}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
