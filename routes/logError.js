// routes/logError.js
const express = require("express");
const router = express.Router();
const { supabase } = require("../lib/supabaseClient");

router.post("/", async (req, res) => {
  try {
    const { user_id, route, error_msg, payload, timestamp } = req.body;

    if (!route || !error_msg || !timestamp) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { error } = await supabase.from("error_logs").insert([
      { user_id, route, error_msg, payload, timestamp }
    ]);

    if (error) {
      console.error("❌ Supabase error log insert error:", error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    return res.status(200).json({ message: "✅ Error logged" });
  } catch (err) {
    console.error("🔥 logError route error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
