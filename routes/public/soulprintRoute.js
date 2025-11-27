const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function formatTraits(traits = {}) {
  return Object.entries(traits)
    .map(([key, val]) => \`\${key}: \${val.toFixed(2)}\`)
    .join(", ");
}

router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;
  if (!user_id) return res.status(400).send("Missing user_id");

  try {
    const { data: soulData, error: soulError } = await supabase
      .from("soulprints")
      .select("*")
      .eq("user_id", user_id)
      .single();

    const { data: echoData, error: echoError } = await supabase
      .from("referral_logs")
      .select("*", { count: "exact" })
      .eq("referrer_id", user_id);

    if (soulError) throw soulError;

    const traits = soulData?.traits || {};
    const depth = Object.keys(traits).length;
    const echoCount = echoData?.length || 0;

    res.send(\`
      <html>
        <head>
          <title>Soulprint Viewer</title>
          <style>
            body { font-family: monospace; background: #0f0f11; color: white; padding: 3rem; }
            h1 { font-size: 2rem; margin-bottom: 2rem; }
            .box { border: 1px solid #333; border-radius: 10px; padding: 2rem; background: #111; max-width: 600px; margin: auto; }
            .label { color: #aaa; font-size: 0.9rem; }
            .value { font-size: 1rem; margin-bottom: 1.2rem; }
          </style>
        </head>
        <body>
          <h1>🧬 Soulprint</h1>
          <div class="box">
            <div class="label">User ID:</div>
            <div class="value">\${user_id}</div>

            <div class="label">Traits Earned:</div>
            <div class="value">\${formatTraits(traits) || "None yet"}</div>

            <div class="label">Drop Depth:</div>
            <div class="value">\${depth}</div>

            <div class="label">Witness Echoes:</div>
            <div class="value">\${echoCount}</div>

            <div class="label">Last Updated:</div>
            <div class="value">\${new Date(soulData.updated_at).toLocaleString()}</div>
          </div>
        </body>
      </html>
    \`);
  } catch (err) {
    console.error("❌ /soulprint error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;