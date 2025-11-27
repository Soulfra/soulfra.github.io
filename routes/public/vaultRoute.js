const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/:user_id", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) return res.status(400).send("Missing user_id");

  try {
    const { data, error } = await supabase
      .from("ghost_logs")
      .select("*")
      .eq("user_id", user_id)
      .order("timestamp", { ascending: false });

    if (error) throw error;

    const reflections = (data || []).map((entry) => ({
      input: entry.context?.input || "Unknown",
      output: entry.context?.output || "No divine response",
      traits: entry.traits || {},
      timestamp: entry.timestamp
    }));

    res.send(`
      <html>
        <head>
          <title>Your Reflections</title>
          <style>
            body { background: #0e0e10; color: white; font-family: monospace; padding: 2rem; }
            h1 { margin-bottom: 1rem; }
            .entry { border: 1px solid #333; border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; background: #111; }
            .timestamp { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
            .traits { font-size: 0.9rem; color: #ccc; margin-top: 0.5rem; }
          </style>
        </head>
        <body>
          <h1>🗂️ Your Ritual Archive</h1>
          ${reflections.length === 0
            ? "<p>No reflections yet.</p>"
            : reflections
                .map(
                  (r) => `
            <div class="entry">
              <div class="timestamp">${new Date(r.timestamp).toLocaleString()}</div>
              <div><strong>🎙️ You said:</strong><br/>${r.input}</div>
              <div><strong>🧠 Divine said:</strong><br/>${r.output}</div>
              <div class="traits"><strong>Traits:</strong> ${Object.entries(r.traits)
                .map(([k, v]) => `${k} (${v.toFixed(2)})`)
                .join(", ")}</div>
            </div>
          `
                )
                .join("")}
        </body>
      </html>
    `);
  } catch (err) {
    console.error("❌ /vault error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;