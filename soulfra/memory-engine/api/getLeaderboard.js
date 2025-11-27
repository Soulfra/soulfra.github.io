// /soulfra/memory-engine/api/getLeaderboard.js

const { supabase } = require('../../helpers/supabaseClient');
const { getCurrentSeasonId } = require('../arena/currentSeasonManager');

module.exports = async function getLeaderboardHandler(req, res) {
  try {
    const seasonId = getCurrentSeasonId();

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, soulfra_xp')
      .order('soulfra_xp', { ascending: false })
      .limit(130);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }

    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};