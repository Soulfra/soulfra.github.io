const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
const runAgent = require("../utils/runtime/runAgent")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

router.post("/", async (req, res) => {
  const { agent_name, input, output, traits } = req.body

  try {
    // ✅ Optionally run validation or preprocessing
    await runAgent("logAgent", { agent_name, input, output, traits })

    // ✅ Insert into Supabase log table
    const { error } = await supabase.from("agent_logs").insert([
      {
        agent_name,
        input,
        output,
        traits,
        timestamp: new Date().toISOString()
      }
    ])

    if (error) {
      console.error("❌ Failed to log agent:", error)
      return res.status(500).json({ error: "Database insert failed" })
    }

    res.status(200).json({ message: "✅ Agent log saved successfully" })
  } catch (err) {
    console.error("❌ Error in /log-agent:", err.message)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router