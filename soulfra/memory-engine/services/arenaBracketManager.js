// /memory-engine/services/arenaBracketManager.js

export async function assignArenaBracket(user, rankedUsers) {
  if (!user || !Array.isArray(rankedUsers)) {
    throw new Error('Missing user or ranked users for bracket assignment.');
  }

  const userRank = rankedUsers.findIndex(u => u.userId === user.userId) + 1;

  let bracket = 'Unranked';

  if (userRank <= 5) {
    bracket = 'Top 5';
  } else if (userRank <= 25) {
    bracket = 'Top 25';
  } else if (userRank <= 100) {
    bracket = 'Top 100';
  }

  return {
    ...user,
    bracket,
    rank: userRank
  };
}