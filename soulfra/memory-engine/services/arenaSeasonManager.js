// /memory-engine/services/arenaSeasonManager.js

let currentSeason = 'Dawn of Renewal'; // Default starting season

export async function getCurrentSeason() {
  return currentSeason;
}

export async function setCurrentSeason(newSeason) {
  if (!newSeason) {
    throw new Error('Missing new season to set.');
  }
  currentSeason = newSeason;
  return currentSeason;
}

export async function startNewArenaSeason(seasonName) {
  if (!seasonName) {
    throw new Error('Missing season name to start.');
  }
  currentSeason = seasonName;
  console.log(`Sacred new arena season started: ${seasonName}`);
  return currentSeason;
}