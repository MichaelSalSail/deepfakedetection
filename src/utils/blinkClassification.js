export const CLASSIFICATION_TO_LABEL = {
  [-2]: "missing",
  [-1]: "unknown",
  1: "closed",
  2: "open",
};

export function getBlinkLabel(classification) {
  return CLASSIFICATION_TO_LABEL[classification] ?? null;
}
