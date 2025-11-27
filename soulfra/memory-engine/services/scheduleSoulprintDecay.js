// /memory-engine/services/scheduleSoulprintDecay.js

export async function scheduleSoulprintDecay(user, lastRitualTimestamp) {
  if (!user || !lastRitualTimestamp) {
    throw new Error('Missing user or last ritual timestamp for decay.');
  }

  const now = new Date();
  const lastRitual = new Date(lastRitualTimestamp);
  const daysSinceLastRitual = (now - lastRitual) / (1000 * 60 * 60 * 24);

  const updatedUser = { ...user };

  if (daysSinceLastRitual > 30) {
    updatedUser.soulprintDecay = true;
  } else {
    updatedUser.soulprintDecay = false;
  }

  return updatedUser;
}