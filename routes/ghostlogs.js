const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params
    if (!user_id) return res.status(400).json({ error: "Missing user ID" })

    const { data, error } = await supabase
      .from("ghost_logs")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Failed to fetch ghost logs:", error)
      return res.status(500).json({ error: "Error retrieving ghost logs" })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error("❌ /ghostlogs/:user_id error:", err.message)
    return res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router