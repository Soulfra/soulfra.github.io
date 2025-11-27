const express = require("express");
const router = express.Router();
const db = require("../config/postgresClient");

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await db.query("SELECT traits, tokens_used, created_at FROM agent_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [userId]);

    const traitSummary = {};
    let totalTokens = 0;

    for (let row of result.rows) {
      (row.traits || []).forEach(t => {
        traitSummary[t] = (traitSummary[t] || 0) + 1;
      });
      totalTokens += row.tokens_used || 0;
    }

    res.json({
      recentLogs: result.rows,
      traitSummary,
      totalTokensUsed: totalTokens
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to retrieve soulprint", details: e.message });
  }
});

module.exports = router;