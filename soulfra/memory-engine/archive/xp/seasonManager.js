// /soulfra/xp/seasonManager.js

/**
 * Get current Reflection Arena season ID.
 * 
 * @returns {string} - Season ID
 */
function getCurrentSeasonId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS months are 0-indexed

  // Example: 2025-04 (April 2025 season)
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Tag a ritual with the current season ID.
 * 
 * @param {object} ritualData - Ritual payload
 * @returns {object} - Ritual with season attached
 */
function tagRitualWithSeason(ritualData) {
  ritualData.season_id = getCurrentSeasonId();
  return ritualData;
}

module.exports = {
  getCurrentSeasonId,
  tagRitualWithSeason
};