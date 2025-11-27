const { imageAgent } = require("./imageAgent");
const { VertexAI } = require("@google-cloud/vertexai");

/**
 * Gemini fallback (prompt-to-prompt, then DALL·E pass-through)
 */
async function callGeminiImage(prompt, mood = "neutral") {
  try {
    const vertex_ai = new VertexAI({
      project: process.env.GEMINI_PROJECT_ID,
      location: process.env.GEMINI_LOCATION,
      keyFilename: "./secrets/deathtodata-ee34e-d5b792795636.json"
    });

    const model = vertex_ai.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate an image prompt: ${prompt}. Mood: ${mood}` }]
        }
      ]
    });

    const generatedPrompt = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedPrompt) throw new Error("No prompt returned from Gemini.");

    const dalleImage = await imageAgent(generatedPrompt, mood);
    return dalleImage ? { ...dalleImage, source: "gemini" } : null;
  } catch (err) {
    console.warn("⚠️ Gemini image fallback failed:", err.message);
    return null;
  }
}

/**
 * Replicate fallback (using global fetch)
 */
async function callReplicate(prompt, mood = "neutral") {
  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "your-model-version-id-here",
        input: { prompt: `${prompt}, style: ${mood}` }
      })
    });

    const data = await response.json();
    if (!data?.output?.[0]) throw new Error("No image returned from Replicate");

    return {
      image_url: data.output[0],
      prompt_used: prompt,
      alt_text: `Replicate fallback: ${prompt}`,
      source: "replicate"
    };
  } catch (err) {
    console.warn("⚠️ Replicate image fallback failed:", err.message);
    return null;
  }
}

/**
 * Tries DALL·E first, then Gemini, then Replicate
 */
async function imageRouter(prompt, mood = "neutral") {
  const routes = [
    async () => {
      const result = await imageAgent(prompt, mood);
      return result ? { ...result, source: "dalle" } : null;
    },
    () => callGeminiImage(prompt, mood),
    () => callReplicate(prompt, mood)
  ];

  for (const route of routes) {
    const result = await route();
    if (result) return result;
  }

  return {
    image_url: "https://via.placeholder.com/1024",
    prompt_used: prompt,
    alt_text: `Fallback placeholder for: ${prompt}`,
    source: "placeholder"
  };
}

module.exports = { imageRouter };