const express = require("express");
const router = express.Router();
const db = require("../config/postgresClient");

router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const result = await db.query(
      "SELECT tokens_earned, tokens_spent FROM users WHERE user_id = $1",
      [userId]
    );

    console.log("✅ Query result:", result.rows);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found",
        userId,
        tokens_earned: 0,
        tokens_spent: 0,
        balance: 0
      });
    }

    const { tokens_earned, tokens_spent } = result.rows[0];

    return res.json({
      userId,
      tokens_earned,
      tokens_spent,
      balance: tokens_earned - tokens_spent
    });
  } catch (err) {
    console.error("❌ Token balance route error:", err); // ← Log full error
    return res.status(500).json({ error: "Failed to retrieve token balance." });
  }
});

module.exports = router;
