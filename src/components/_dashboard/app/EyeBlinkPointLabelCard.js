import { Card, Typography } from "@mui/material";
import { getBlinkLabel } from "../../../utils/blinkClassification.js";

export default function EyeBlinkPointLabelCard({ classification }) {
  const label = getBlinkLabel(classification);

  return (
    <Card
      variant="outlined"
      sx={{
        px: 2,
        py: 1,
        minWidth: 140,
        textAlign: "center",
        boxShadow: "none",
      }}
    >
      <Typography
        variant="body2"
        color={label ? "text.primary" : "text.secondary"}
        sx={{ textTransform: "capitalize", fontWeight: label ? 600 : 400 }}
      >
        {label ?? "Select a point"}
      </Typography>
    </Card>
  );
}
