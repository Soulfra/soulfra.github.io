const express = require("express")
const router = express.Router()
const { runAgent } = require("../utils/runtime/runAgent")

router.post("/", async (req, res) => {
  try {
    const { agentName, input } = req.body

    if (!agentName || !input) {
      return res.status(400).json({ error: "Missing agentName or input" })
    }

    const result = await runAgent(agentName, input)
    res.status(200).json({ result })
  } catch (err) {
    console.error("❌ /run-agent error:", err.message)
    res.status(500).json({ error: "Agent failed", detail: err.message })
  }
})

module.exports = router