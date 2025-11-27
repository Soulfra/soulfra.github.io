// /memory-engine/services/mutateSoulprint.js

export async function mutateSoulprint(user, traits) {
  if (!user || !traits) {
    throw new Error('Missing user or traits for soulprint mutation.');
  }

  const updatedUser = { ...user };

  if (traits.grief >= 0.6) {
    updatedUser.soulAffinity = 'Melancholic';
  } else if (traits.hope >= 0.6) {
    updatedUser.soulAffinity = 'Radiant';
  } else if (traits.ambition >= 0.6) {
    updatedUser.soulAffinity = 'Fierce';
  } else {
    updatedUser.soulAffinity = 'Stable';
  }

  return updatedUser;
}