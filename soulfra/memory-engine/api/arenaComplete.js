// /soulfra/memory-engine/api/arenaComplete.js

const { orchestrateArenaRitualCompletion } = require('../agents/orchestrateArenaRitualCompletion');

module.exports = async function arenaCompleteHandler(req, res) {
  try {
    const { userId, ritualData } = req.body;

    if (!userId || !ritualData) {
      return res.status(400).json({ success: false, message: 'Missing userId or ritualData.' });
    }

    const result = await orchestrateArenaRitualCompletion(userId, ritualData);

    res.status(200).json({ success: true, ...result });

  } catch (error) {
    console.error('Error completing arena ritual:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};