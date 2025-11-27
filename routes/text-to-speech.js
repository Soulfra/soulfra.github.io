const express = require("express")
const router = express.Router()
const axios = require("axios")

router.post("/", async (req, res) => {
  const { text, user_id, tokens_awarded } = req.body

  if (!text || typeof text !== "string" || text.trim() === "") {
    return res.status(400).json({ error: "Missing or invalid 'text' input for TTS." })
  }

  const usePremium = tokens_awarded >= 100
  console.log("🧾 TTS Request:", { user_id, tokens_awarded, usePremium })

  try {
    if (usePremium) {
      // ✅ ElevenLabs premium voice
      const elevenRes = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/Yko7PKHZNXotIFUBG7I9`, // Replace with your voice ID
        {
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.3,
            similarity_boost: 0.85
          }
        },
        {
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        }
      )

      res.setHeader("Content-Type", "audio/mpeg")
      return res.send(elevenRes.data)
    } else {
      // ✅ OpenAI TTS fallback
      const openaiRes = await axios.post(
        "https://api.openai.com/v1/audio/speech",
        {
          model: "tts-1",
          input: text,
          voice: "alloy"
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          responseType: "arraybuffer"
        }
      )

      res.setHeader("Content-Type", "audio/mpeg")
      return res.send(openaiRes.data)
    }
  } catch (err) {
    console.error("🛑 TTS generation error:", err?.response?.data || err.message)
    res.status(500).json({ error: "TTS generation failed", detail: err.message })
  }
})

module.exports = router