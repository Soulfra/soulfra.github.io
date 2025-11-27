export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { input_text } = req.body;

  if (!input_text) {
    return res.status(400).json({ message: 'Missing input_text.' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an emotional resonance analyzer. When analyzing an oath, respond ONLY with strict valid JSON like: { \"hope\": 0.4, \"grief\": 0.3, \"reflection\": 0.3 }"
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

    return res.status(200).json({ emotional_snapshot: emotionalSnapshot });
  } catch (error) {
    console.error('Error analyzing traits:', error.message);
    return res.status(500).json({ message: 'Failed to analyze traits.', error: error.message });
  }
}