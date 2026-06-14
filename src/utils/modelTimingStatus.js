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

export function getModelErrors(models = []) {
  const baseError = isModelTimingError(models[0], 0);
  const blinkError = isModelTimingError(models[1], 1);
  const subjectError =
    isModelTimingError(models[2], 2) || isModelTimingError(models[3], 3);
  return { baseError, blinkError, subjectError };
}

export function hasAnyModelError(models = []) {
  const { baseError, blinkError, subjectError } = getModelErrors(models);
  return baseError || blinkError || subjectError;
}

export function buildModelTimingRows(models = [], analysisComplete = false) {
  const { baseError, blinkError, subjectError } = getModelErrors(models);
  const baseFailed = analysisComplete && baseError;
  const blinkFailed = analysisComplete && blinkError;
  const subjectFailed = analysisComplete && subjectError;

  const baseDuration = baseFailed ? "?" : formatRuntime(models[0]?.runtime ?? 0);
  const blinkDuration = blinkFailed ? "?" : formatRuntime(models[1]?.runtime ?? 0);
  const subjectDuration = subjectFailed
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
      hasError: baseFailed,
      showStatusIcon: analysisComplete,
    },
    {
      label: "Eye Blink Model",
      duration: blinkDuration,
      hasError: blinkFailed,
      showStatusIcon: analysisComplete,
    },
    {
      label: "Subject",
      duration: subjectDuration,
      hasError: subjectFailed,
      showStatusIcon: analysisComplete,
    },
    { label: "Total", duration: totalDuration, isTotal: true },
  ];
}
