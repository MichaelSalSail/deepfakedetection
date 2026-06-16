import { alpha } from "@mui/material/styles";

export const BLINK_OPEN = {
  lighter: "#F3E8FF",
  dark: "#6D28D9",
  darker: "#5B21B6",
};

export const BLINK_CLOSED = {
  lighter: "#DBE2FE",
  dark: "#4338CA",
  darker: "#312E81",
};

export const CLASSIFICATION_TO_LABEL = {
  [-2]: "missing",
  [-1]: "unknown",
  1: "closed",
  2: "open",
};

export function getClassificationStrokeColor(classification, theme) {
  switch (classification) {
    case 2:
      return BLINK_OPEN.lighter;
    case 1:
      return BLINK_CLOSED.lighter;
    case -1:
      return alpha(theme.palette.error.light, 0.35);
    case -2:
      return theme.palette.error.lighter;
    default:
      return theme.palette.grey[200];
  }
}

export function getBlinkLabel(classification) {
  return CLASSIFICATION_TO_LABEL[classification] ?? null;
}

export function formatBlinkLabelDisplay(classification) {
  const label = getBlinkLabel(classification);
  if (!label) {
    return "—";
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}
