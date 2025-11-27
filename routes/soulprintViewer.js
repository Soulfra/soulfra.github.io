const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")
require("dotenv").config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

router.get("/:userId", async (req, res) => {
  const { userId } = req.params

  try {
    const { data, error } = await supabase
      .from("soulprints")
      .select("traits, updated_at")
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("❌ Soulprint fetch error:", error.message)
      return res.status(404).json({ error: "User not found" })
    }

    res.status(200).json({
      user_id: userId,
      traits: data.traits,
      updated_at: data.updated_at
    })
  } catch (err) {
    console.error("🔥 Soulprint view error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

module.exports = router