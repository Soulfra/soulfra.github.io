const express = require("express");
const router = express.Router();
const { runAgentCore } = require("../utils/runAgentCore");

router.post("/", async (req, res) => {
  try {
    const { agent_id, input, user_id, timestamp } = req.body;

    if (!agent_id || !input) {
      return res.status(400).json({ error: "Missing required fields: agent_id and input are required." });
    }

    const result = await runAgentCore({ agent_id, input, user_id, timestamp });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({ message: "✅ Agent run successful", data: result });
  } catch (err) {
    console.error("🔥 runAgent route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;