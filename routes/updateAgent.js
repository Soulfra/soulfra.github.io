const express = require("express")
const router = express.Router()
const runAgent = require("../utils/runtime/runAgent")

router.post("/", async (req, res) => {
  try {
    const result = await runAgent("updateAgent", req.body)
    res.status(200).json({ success: true, result })
  } catch (err) {
    console.error("❌ /update-agent error:", err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router