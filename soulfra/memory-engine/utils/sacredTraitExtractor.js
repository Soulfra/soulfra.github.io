// /utils/sacredTraitExtractor.js

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export async function extractTraitsFromTranscript(transcript) {
  try {
    const prompt = `
You are a sacred emotional trait classifier.

Given the following ritual transcript, return a JSON object:

{
  "presence": "strong | weak | drifting | grounded",
  "tone": "hopeful | chaotic | serene | intense",
  "reflection_depth": "shallow | medium | deep",
  "positivity": "negative | neutral | positive",
  "honesty": "guarded | open | vulnerable"
}

Transcript:
"""${transcript}"""

Only output raw JSON, no explanations.
`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You classify sacred emotional traits for ritual reflections." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const rawText = response.data.choices[0].message.content.trim();
    return JSON.parse(rawText);

  } catch (error) {
    console.error('❌ Error during trait extraction:', error.response?.data || error.message);
    throw new Error('Failed to extract traits from transcript.');
  }
}