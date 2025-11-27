const express = require("express")
const router = express.Router()
const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: "Missing ghost ID" })

    const { data, error } = await supabase
      .from("ghost_logs")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("❌ Failed to fetch ghost log:", error)
      return res.status(404).json({ error: "Ghost log not found" })
    }

    return res.status(200).json(data)
  } catch (err) {
    console.error("❌ /ghostlog/:id error:", err.message)
    return res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router