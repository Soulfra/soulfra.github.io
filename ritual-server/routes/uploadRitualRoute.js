import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const router = express.Router();
const upload = multer({ dest: "/tmp" });
const execPromise = promisify(exec);

router.post("/", upload.single("file"), async (req, res) => {
  console.log("📥 /uploadRitual route hit");

  try {
    const filePath = req.file.path;
    const outputPath = filePath + ".wav";

    console.log("🎙️ Transcoding audio via ffmpeg...");
    await execPromise(`ffmpeg -y -i ${filePath} -ar 16000 -ac 1 -c:a pcm_s16le ${outputPath}`);

    const fileStream = fs.createReadStream(outputPath);

    const formData = new FormData();
    formData.append("file", fileStream, {
      filename: "ritual.wav",
      contentType: "audio/wav"
    });
    formData.append("model", "whisper-1");

    console.log("🧠 Sending to OpenAI Whisper...");
    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const result = await whisperRes.json();
    console.log("📝 Whisper response:", result);

    const transcript = result.text;

    if (!transcript) {
      console.error("❌ Whisper transcription failed.");
      return res.status(500).json({ error: "Transcription failed", result });
    }

    if (!transcript.toLowerCase().includes("the ritual begins")) {
      console.warn("⚠️ User did not say the sacred phrase.");
      return res.status(400).json({ error: "You must speak the sacred invocation to continue: 'the ritual begins'." });
    }

    console.log("🧬 Sending transcript to /analyzeTraits");
    const analysisRes = await fetch("https://souloneth.vercel.app/api/analyzeTraits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript })
    });

    const final = await analysisRes.json();
    console.log("✅ Traits:", final.traits);

    return res.status(200).json({ success: true, traits: final.traits });
  } catch (err) {
    console.error("🔥 uploadRitual error:", err.message);
    return res.status(500).json({ error: "Unexpected failure", details: err.message });
  }
});

export default router;