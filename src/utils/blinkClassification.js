export const CLASSIFICATION_TO_LABEL = {
  [-2]: "missing",
  [-1]: "unknown",
  1: "closed",
  2: "open",
};

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
