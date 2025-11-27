const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fake badge logic for display tiers
function getWitnessTitle(echoes) {
  if (echoes >= 100) return "🌊 Ritual Catalyst";
  if (echoes >= 50) return "🕯️ Deep Echoer";
  if (echoes >= 20) return "📡 Shared Signal";
  if (echoes >= 5) return "💌 Known Witness";
  if (echoes >= 1) return "👁️ Initial Reflection";
  return "👻 Unheard";
}

router.get("/:code", async (req, res) => {
  const { code } = req.params;

  if (!code || !code.startsWith("witness_")) {
    return res.status(404).send("Invalid witness code.");
  }

  try {
    const { data, error } = await supabase
      .from("referral_logs")
      .select("*", { count: "exact" })
      .eq("referrer_id", code);

    if (error) throw error;

    const echoes = data?.length || 0;
    const title = getWitnessTitle(echoes);

    res.send(`
      <html>
        <head>
          <title>Witness Echo Stats</title>
          <style>
            body { font-family: monospace; background: #0f0f11; color: white; text-align: center; padding: 4rem; }
            .badge { font-size: 1.5rem; margin-bottom: 0.5rem; }
            .code { font-size: 1.1rem; color: #aaa; margin-bottom: 1rem; }
            .echoes { font-size: 2rem; font-weight: bold; }
            .footer { margin-top: 3rem; font-size: 0.7rem; color: #555; }
          </style>
        </head>
        <body>
          <div class="badge">${title}</div>
          <div class="code">${code}</div>
          <div class="echoes">${echoes} Echo${echoes !== 1 ? "es" : ""}</div>
          <div class="footer">Witness tracking by SoulOnEth</div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error("Witness route error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;