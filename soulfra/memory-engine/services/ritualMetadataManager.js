// /memory-engine/services/ritualMetadataManager.js

export async function archiveRitual(userId, ritualData) {
  if (!userId || !ritualData) {
    throw new Error('Missing userId or ritualData for ritual archiving.');
  }

  const archivedRitual = {
    userId,
    ritualTimestamp: new Date().toISOString(),
    inputText: ritualData.input_text || '',
    emotionalSnapshot: ritualData.traits || {},
    season: ritualData.season || 'Unknown',
    outcome: ritualData.outcome || 'Completed'
  };

  return archivedRitual;
}

export async function getArchivedRituals(userId, archivedList) {
  if (!userId || !Array.isArray(archivedList)) {
    throw new Error('Missing userId or invalid archive list.');
  }

  return archivedList.filter(ritual => ritual.userId === userId);
}