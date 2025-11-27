import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "No transcript provided" });
  }

  try {
    const prompt = `
You are an emotional resonance analyzer for a sacred ritual system. Based only on the user's words, estimate the emotional distribution.

The traits you must estimate are:
- reflective
- chaotic
- hopeful
- melancholic
- intense
- playful

Rules:
- Assign each trait a value between 0.0 and 1.0
- Make sure the sum of all traits equals 1.0
- Return ONLY a JSON object without explanation or extra words.

Example JSON:
{
  "reflective": 0.3,
  "chaotic": 0.2,
  "hopeful": 0.3,
  "melancholic": 0.1,
  "intense": 0.05,
  "playful": 0.05
}

Now, analyze the following transcript:
"${transcript}"
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const rawText = completion.choices[0].message.content.trim();

    const traits = JSON.parse(rawText);

    return res.status(200).json({ success: true, traits });
  } catch (err) {
    console.error("🔥 analyzeTraits error:", err.message);
    return res.status(500).json({ error: "Unexpected failure", details: err.message });
  }
}