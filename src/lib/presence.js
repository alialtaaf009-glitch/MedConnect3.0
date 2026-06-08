// "Online" = active in the last 5 minutes (Option A: last-seen based).
export function isOnline(lastSeen) {
  if (!lastSeen) return false;
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  return diffMs < 5 * 60 * 1000; // 5 minutes
}
