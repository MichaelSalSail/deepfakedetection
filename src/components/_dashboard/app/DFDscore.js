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
    return {
      color: "yellow",
      verdict: "Uncertain",
      failureHint: "Use the Subject and Eye Blink results to help reach a conclusion.",
    };
  }
  return { color: "red", verdict: "Likely deepfake", failureHint: null };
}

export default function DFDscore({ results, prominent = false }) {
  const dfdScore = results["models"][0]["DFD"];
  const { color, verdict, failureHint } = getDfdDisplay(dfdScore);

  return (
    <Card
      sx={{
        height: prominent ? "100%" : "auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent
        sx={{
          flex: prominent ? 1 : "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: prominent ? "center" : "flex-start",
          alignItems: "center",
          textAlign: "center",
          pt: prominent ? 4 : 2,
          pb: prominent ? 3 : 1.5,
          px: 2,
          "&:last-child": { pb: prominent ? 3 : 1.5 },
        }}
      >
        <Typography
          fontWeight="bold"
          color={color}
          fontFamily="Monospace"
          sx={{
            fontSize: prominent ? { xs: "2.25rem", md: "2.75rem" } : "h6.fontSize",
            lineHeight: 1.1,
            mb: prominent ? 3 : 1,
          }}
        >
          SCORE: {dfdScore}%
        </Typography>
        <Typography
          variant={prominent ? "body1" : "subtitle2"}
          color={color}
          sx={{
            maxWidth: 320,
            opacity: dfdScore === 0 || dfdScore === 50 ? 0.9 : 1,
          }}
        >
          {verdict}
        </Typography>
        {failureHint ? (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1.5, px: 1, maxWidth: 320 }}
          >
            {failureHint}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}
