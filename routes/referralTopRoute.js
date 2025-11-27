const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/top", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("top_referrers")
      .select("*")
      .limit(10);

    if (error) {
      return res.status(500).json({ error: "Supabase query failed", detail: error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("❌ /api/referrals/top error:", err);
    res.status(500).json({ error: "Internal Server Error", detail: err.message });
  }
});

module.exports = router;