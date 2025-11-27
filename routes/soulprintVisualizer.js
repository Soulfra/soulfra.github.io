const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

/**
 * Returns a user's current soulprint: traits, top traits, recent shifts
 */
router.get("/:userId", async (req, res) => {
  const { userId } = req.params

  try {
    const { data, error } = await supabase
      .from("soulprints")
      .select("traits, updated_at")
      .eq("user_id", userId)
      .single()

    if (error || !data) {
      console.error("❌ Soulprint fetch error:", error?.message || "No data")
      return res.status(404).json({ error: "Soulprint not found" })
    }

    const traits = data.traits || {}
    const sorted = Object.entries(traits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([trait]) => trait)

    res.status(200).json({
      user_id: userId,
      traits,
      top_traits: sorted,
      updated_at: data.updated_at
    })
  } catch (err) {
    console.error("🔥 Soulprint viewer error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router