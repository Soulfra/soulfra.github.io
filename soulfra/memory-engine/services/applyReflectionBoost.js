// /services/applyReflectionBoost.js

export function applyReflectionBoost(user, traitsTriggered) {
  if (!user || !traitsTriggered) {
    throw new Error('Missing user or traits triggered.');
  }

  const boostActive = traitsTriggered.includes('reflection') || traitsTriggered.includes('forgiveness');

  const updatedUser = { ...user };
  if (boostActive) {
    updatedUser.xpBoostMultiplier = 1.5; // 50% bonus
  } else {
    updatedUser.xpBoostMultiplier = 1.0;
  }

  return { user: updatedUser, boostActive };
}