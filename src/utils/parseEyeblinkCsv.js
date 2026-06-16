/**
 * Parse eyeblink_data.csv text into row objects for the timeline chart.
 * Expects columns: frame_num, total_frames, timestamp_s, score, label, classification
 */
export function parseEyeblinkCsv(csvText) {
  if (!csvText || typeof csvText !== "string") {
    return [];
  }

  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return [];
  }

  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const parts = line.split(",");
    if (parts.length < 6) {
      continue;
    }

    const timestamp_s = Number(parts[2]);
    const classification = Number(parts[5]);
    if (Number.isNaN(timestamp_s) || Number.isNaN(classification)) {
      continue;
    }

    rows.push({
      frame_num: Number(parts[0]),
      total_frames: Number(parts[1]),
      timestamp_s,
      score: parts[3] === "" ? null : Number(parts[3]),
      label: parts[4],
      classification,
    });
  }

  return rows;
}
