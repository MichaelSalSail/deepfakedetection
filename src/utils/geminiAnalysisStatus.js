export const GEMINI_OPTIONAL_NOTE =
  "Note: No eye-blink example was available (optional). Analysis used the subject crop and video summary only.";

export function canRunGeminiAnalysis(preflight) {
  return Boolean(preflight?.subject && preflight?.video_summary);
}

export function buildGeminiSkipMessage(preflight) {
  if (canRunGeminiAnalysis(preflight)) {
    return null;
  }

  const missing = [];
  if (!preflight?.subject) {
    missing.push("subject_reference.png");
  }
  if (!preflight?.video_summary) {
    missing.push("video_summary.png");
  }

  if (missing.length === 0) {
    return "Skipped AI analysis. Missing required inputs.";
  }
  if (missing.length === 1) {
    return `Skipped AI analysis. Missing required input: ${missing[0]}.`;
  }
  return `Skipped AI analysis. Missing required inputs: ${missing.join(" and ")}.`;
}

export function shouldShowGeminiOptionalNote(preflight) {
  return canRunGeminiAnalysis(preflight) && !preflight?.eyeblink_example;
}
