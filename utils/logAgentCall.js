const { pool } = require('../config/postgresClient');

async function logAgentCall({ userId, agent, input, output, traits = [], tokens = 1 }) {
  console.log("💾 Attempting to log to agent_logs...");
  console.log("🧠 Data preview:");
  console.log("  userId:", userId);
  console.log("  agent:", agent);
  console.log("  traits:", traits);
  console.log("  tokens:", tokens);

  try {
    const result = await pool.query(
      `INSERT INTO agent_logs (user_id, agent, input, output, traits, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, agent, input, output, traits, tokens]
    );

    console.log("✅ Log success — rowCount:", result.rowCount);
  } catch (err) {
    console.error("❌ Log failed:", err.message);
    console.error("🛠 Full error object:", err);
  }
}

module.exports = { logAgentCall };