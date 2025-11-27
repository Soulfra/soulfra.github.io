// /memory-engine/services/arenaLeaderboardManager.js

export async function updateLeaderboard(user, ritualScore) {
  if (!user || typeof ritualScore !== 'number') {
    throw new Error('Missing user or invalid ritual score for leaderboard update.');
  }

  const updatedUser = { ...user };

  updatedUser.totalRituals = (updatedUser.totalRituals || 0) + 1;
  updatedUser.totalRitualScore = (updatedUser.totalRitualScore || 0) + ritualScore;

  return updatedUser;
}

export async function rankUsers(users) {
  if (!Array.isArray(users)) {
    throw new Error('Invalid users array for ranking.');
  }

  const ranked = [...users].sort((a, b) => (b.totalRitualScore || 0) - (a.totalRitualScore || 0));

  return ranked.map((user, index) => ({
    ...user,
    rank: index + 1
  }));
}