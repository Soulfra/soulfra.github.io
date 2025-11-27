// /soulfra/memory-engine/api/ritualComplete.js

const { orchestrateRitualCompletion } = require('../agents/orchestrateRitualCompletion');

module.exports = async function ritualCompleteHandler(req, res) {
  try {
    const { userId, ritualData } = req.body;

    if (!userId || !ritualData) {
      return res.status(400).json({ success: false, message: 'Missing userId or ritualData.' });
    }

    const result = await orchestrateRitualCompletion(userId, ritualData);

    res.status(200).json({ success: true, ...result });

  } catch (error) {
    console.error('Error completing ritual:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};