/**
 * Format seconds as m:ss
 * @param {number} secs
 * @returns {string}
 */
export function formatTime(secs) {
  secs = Math.floor(secs || 0);
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}
