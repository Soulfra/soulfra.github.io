const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
const runAgent = require("../utils/runtime/runAgent")
const { updateSoulprint } = require("../utils/soulprintUpdater")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function validateFeedbackPayload(body) {
  const required = [
    "user_id",
    "agent_name",
    "input",
    "output",
    "score",
    "comment",
    "timestamp",
    "traits" // ✅ assuming you're logging trait insights with feedback
  ]
  const missing = required.filter((field) => !body[field])
  return missing
}

router.post("/", async (req, res) => {
  try {
    const payload = req.body
    const missing = validateFeedbackPayload(payload)

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required field(s): ${missing.join(", ")}`
      })
    }

    // ✅ Validate or preprocess via agent
    await runAgent("recordFeedback", payload)

    // ✅ Insert into feedback log table
    const { error } = await supabase.from("feedback_logs").insert([payload])
    if (error) {
      console.error("❌ Feedback insert error:", error)
      return res.status(500).json({
        error: "Database insert failed",
        detail: error.message
      })
    }

    // ✅ Update the user's soulprint based on traits in the payload
    const { user_id, traits } = payload
    const updatedSoulprint = await updateSoulprint(user_id, traits)

    return res.status(200).json({
      message: "✅ Feedback recorded and soulprint updated",
      soulprint: updatedSoulprint
    })
  } catch (err) {
    console.error("🔥 Feedback route error:", err)
    return res.status(500).json({ error: "Server error" })
  }
})

module.exports = router