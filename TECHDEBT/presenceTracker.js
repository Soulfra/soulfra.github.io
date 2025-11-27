const { pool } = require('../config/postgresClient');

async function updateStreak(userId) {
  try {
    const result = await pool.query(
      `SELECT created_at FROM agent_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`, [userId]);

    const last = result.rows[0]?.created_at;
    if (!last) return;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const lastDay = new Date(last);
    const isYesterday = lastDay.toDateString() === yesterday.toDateString();

    const query = isYesterday
      ? `UPDATE users SET streak = streak + 1 WHERE id = $1`
      : `UPDATE users SET streak = 1 WHERE id = $1`;

    await pool.query(query, [userId]);
  } catch (err) {
    console.error("❌ updateStreak error:", err.message);
  }
}

module.exports = { updateStreak };