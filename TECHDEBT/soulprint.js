const express = require('express');
const router = express.Router();
const { pool } = require('../config/postgresClient');

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT traits, tokens_used, created_at
       FROM agent_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
       [userId]
    );

    const traits = result.rows.flatMap(row => row.traits || []);
    const traitCount = traits.reduce((acc, trait) => {
      acc[trait] = (acc[trait] || 0) + 1;
      return acc;
    }, {});

    const totalTokens = result.rows.reduce((sum, row) => sum + (row.tokens_used || 0), 0);

    res.json({
      recentLogs: result.rows,
      traitSummary: traitCount,
      totalTokensUsed: totalTokens
    });

  } catch (err) {
    console.error("❌ Error in soulprintViewer:", err.message);
    res.status(500).json({ error: 'Failed to load soulprint.' });
  }
});

module.exports = router;