export const GEMINI_OPTIONAL_NOTE =
  "Note: No eye-blink example was available (optional). Analysis used the subject crop and video summary only.";

export function shouldShowGeminiOptionalNote(preflight) {
  return !preflight?.eyeblink_example;
}
