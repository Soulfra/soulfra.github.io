export const config = {
  api: {
    bodyParser: false
  }
};

import { IncomingForm } from "formidable";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";

const parseForm = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ multiples: false });
    form.uploadDir = "/tmp";
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { files } = await parseForm(req);
    const audio = files.file;

    if (!audio) {
      return res.status(400).json({ error: "Missing uploaded audio file" });
    }

    const fileStream = fs.createReadStream(audio.filepath);

    const formData = new FormData();
    formData.append("file", fileStream, {
      filename: "ritual.webm", // Keep real filename
      contentType: "audio/webm"
    });
    formData.append("model", "whisper-1");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData
    });

    const result = await whisperRes.json();
    const transcript = result.text;

    if (!transcript) {
      return res.status(500).json({ error: "Transcription failed", result });
    }

    const analysisRes = await fetch("https://souloneth.vercel.app/api/analyzeTraits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript })
    });

    const final = await analysisRes.json();

    return res.status(200).json({ success: true, traits: final.traits });
  } catch (err) {
    console.error("UploadRitual direct error:", err.message);
    return res.status(500).json({ error: "Unexpected failure", details: err.message });
  }
}