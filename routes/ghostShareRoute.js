const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).send("Missing ghost ID.");

  const { data, error } = await supabase
    .from("ghost_logs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return res.status(404).send("Ghost not found.");
  }

  res.send(`
    <html>
      <head>
        <title>Ghost Reflection</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: sans-serif; background: #fafafa; padding: 2rem; color: #333; }
          .card { background: white; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); padding: 2rem; max-width: 600px; margin: auto; }
          .quote { font-style: italic; font-size: 1.2rem; margin-bottom: 1rem; }
          .meta { font-size: 0.9rem; color: #666; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="quote">"${data.context.output}"</div>
          <div class="meta">Shared by a soul... Tier: ${data.tone_tier || "unknown"}</div>
        </div>
      </body>
    </html>
  `);
});

module.exports = router;