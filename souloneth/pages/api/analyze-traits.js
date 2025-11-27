// /pages/api/analyze-traits.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { input_text } = req.body;
  if (!input_text) {
    return res.status(400).json({ message: 'No input_text provided.' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an emotional resonance extractor for a sacred ritual system. Output ONLY strict raw JSON without any explanation. No commentary. Only output JSON like { \"hope\": 0.2, \"grief\": 0.5, \"reflection\": 0.3 }. Use double quotes only. No extra text. No apologies. No English sentences."
          },
          {
            role: "user",
            content: `Analyze this oath: ${input_text}`
          }
        ],
        temperature: 0.2
      })
    });

    const openaiData = await openaiRes.json();

    const completionText = openaiData.choices?.[0]?.message?.content || '{}';
    const emotionalSnapshot = JSON.parse(completionText);

    console.log('Sacred Emotional Snapshot:', emotionalSnapshot);

    return res.status(200).json({ emotional_snapshot: emotionalSnapshot });

  } catch (error) {
    console.error('Error analyzing emotional fingerprint:', error.message);
    return res.status(500).json({ message: 'Failed to analyze traits.' });
  }
}