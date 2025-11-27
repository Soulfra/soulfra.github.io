// scripts/runAgent.js
require("dotenv").config();
const { runAgentCore } = require("../utils/runAgentCore");

const agentId = process.argv[2];
const input = process.argv.slice(3).join(" ");

if (!agentId || !input) {
  console.error("❌ Usage: node scripts/runAgent.js <agent_id> <input>");
  process.exit(1);
}

async function runAgent() {
  try {
    const result = await runAgentCore({
      agent_id: agentId,
      input,
      user_id: "cli-dev",
      timestamp: new Date().toISOString(),
    });

    if (result.error) {
      console.error("❌ Agent run failed:", result.error);
    } else {
      console.log("🔁 Agent response:");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (err) {
    console.error("🔥 Unexpected error:", err.message);
  }
}

runAgent();