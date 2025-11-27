const express = require("express")
const router = express.Router()
const { runAgent } = require("../utils/runtime/runAgent")
const { spendTokensOrShare } = require("../utils/spendTokensOrShare")
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

router.post("/", async (req, res) => {
  try {
    const { user_id, confession, unlockDivine = false } = req.body
    if (!user_id || !confession) {
      return res.status(400).json({ error: "Missing user_id or confession" })
    }

    const ghost = await runAgent("ghostScoreAgent", { user_id, confession })

    let divine_result = null
    let divine_unlocked = false

    if (ghost.ghost_tier >= 9 || unlockDivine) {
      const unlockResult = await spendTokensOrShare(user_id, 100)
      if (unlockResult.unlocked) {
        divine_result = await runAgent("voiceOfGodAgent", {
          user_id,
          transcript: confession,
          traits: ghost.traits
        })
        divine_unlocked = true
      }
    }

    const { data: insertData, error: insertError } = await supabase
      .from("ghost_logs")
      .insert({
        user_id,
        confession,
        traits: ghost.traits,
        ghost_score: ghost.ghost_score,
        ghost_tier: ghost.ghost_tier,
        ghost_message: ghost.ghost_message,
        divine_tier: divine_result?.tier || (divine_unlocked ? "unlocked" : null),
        tokens_awarded: divine_result?.tokens_awarded || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.warn("⚠️ Supabase insert warning:", insertError)
    }

    return res.status(200).json({
      ...ghost,
      divine_unlocked,
      divine_result,
      id: insertData?.id || null
    })
  } catch (err) {
    console.error("❌ /ghostmemeter error:", err.message)
    return res.status(500).json({ error: "Internal Server Error", detail: err.message })
  }
})

module.exports = router