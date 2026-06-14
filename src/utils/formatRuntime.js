export default function formatRuntime(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds * 100) / 100}s`;
  }
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${minutes}m ${secs}s`;
}
