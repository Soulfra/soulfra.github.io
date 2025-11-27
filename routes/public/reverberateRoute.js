const express = require("express");
const router = express.Router();
const { runAgent } = require("../utils/runAgent");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const remixToneOptions = [
  "divine_truth",
  "gentle_echo",
  "apocalyptic_indifference"
];

function pickTone(tone) {
  return remixToneOptions.includes(tone) ? tone : remixToneOptions[Math.floor(Math.random() * remixToneOptions.length)];
}

router.post("/", async (req, res) => {
  const { user_id, original_transcript, tone } = req.body;
  if (!user_id || !original_transcript) {
    return res.status(400).send("Missing user_id or original_transcript");
  }

  const selectedTone = pickTone(tone);
  const remixPrompt = `[REVERBERATE MODE - ${selectedTone.toUpperCase()}]
The user previously said: "${original_transcript}". Respond again using the tone "${selectedTone}".`;

  try {
    const divine = await runAgent("voiceOfGodAgent", {
      user_id,
      transcript: remixPrompt,
      traits: {},
      remix_mode: true,
      tone: selectedTone
    });

    res.status(200).json({
      user_id,
      original_transcript,
      tone: selectedTone,
      response: divine?.context?.output || "No divine response.",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("❌ /reverberate error:", err.message);
    res.status(500).send("Something went wrong.");
  }
});

module.exports = router;