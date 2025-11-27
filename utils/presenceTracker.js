function updateStreak(currentStreak, lastSeenTimestamp) {
  const now = Date.now();
  const oneDay = 1000 * 60 * 60 * 24;
  const timeSince = now - new Date(lastSeenTimestamp).getTime();

  if (timeSince > oneDay * 2) return 1; // reset streak
  return currentStreak + 1;
}

module.exports = { updateStreak };