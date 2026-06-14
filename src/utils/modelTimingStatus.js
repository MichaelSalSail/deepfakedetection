import defaultModels from "./result_default.json";
import formatRuntime from "./formatRuntime.js";

function matchesDefaultValues(model, index) {
  if (!model) {
    return true;
  }
  const defaults = defaultModels[index] ?? {};
  return Object.keys(defaults)
    .filter((key) => key !== "runtime")
    .every((key) => model[key] === defaults[key]);
}

export function isModelTimingError(model, index) {
  return matchesDefaultValues(model, index) || (model?.runtime ?? 0) === 0;
}

export function buildModelTimingRows(models = [], analysisComplete = false) {
  const baseError = analysisComplete && isModelTimingError(models[0], 0);
  const blinkError = analysisComplete && isModelTimingError(models[1], 1);
  const subjectError = analysisComplete && (
    isModelTimingError(models[2], 2) || isModelTimingError(models[3], 3)
  );

  const baseDuration = baseError ? "?" : formatRuntime(models[0]?.runtime ?? 0);
  const blinkDuration = blinkError ? "?" : formatRuntime(models[1]?.runtime ?? 0);
  const subjectDuration = subjectError
    ? "?"
    : formatRuntime((models[2]?.runtime ?? 0) + (models[3]?.runtime ?? 0));

  const anyUnknown = analysisComplete && (
    baseDuration === "?" || blinkDuration === "?" || subjectDuration === "?"
  );

  const totalDuration = anyUnknown
    ? "?"
    : formatRuntime(
        (models[0]?.runtime ?? 0) +
          (models[1]?.runtime ?? 0) +
          (models[2]?.runtime ?? 0) +
          (models[3]?.runtime ?? 0)
      );

  return [
    {
      label: "Base Model",
      duration: baseDuration,
      hasError: baseError,
      showStatusIcon: analysisComplete,
    },
    {
      label: "Eye Blink Model",
      duration: blinkDuration,
      hasError: blinkError,
      showStatusIcon: analysisComplete,
    },
    {
      label: "Subject",
      duration: subjectDuration,
      hasError: subjectError,
      showStatusIcon: analysisComplete,
    },
    { label: "Total", duration: totalDuration, isTotal: true },
  ];
}
