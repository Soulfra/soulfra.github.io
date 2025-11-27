const { pool } = require('../config/postgresClient');

async function updateTokenUsage(userId, tokens) {
  try {
    await pool.query(
      `UPDATE users SET tokens = tokens - $1 WHERE id = $2`,
      [tokens, userId]
    );
  } catch (err) {
    console.error("❌ updateTokenUsage error:", err.message);
  }
}

module.exports = { updateTokenUsage };