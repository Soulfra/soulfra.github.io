const { OpenAI } = require("openai");
const { VertexAI } = require("@google-cloud/vertexai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function callOpenAI(input, agent_id) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are the agent ${agent_id}. Respond with emotional insight.`,
      },
      { role: "user", content: input },
    ],
    temperature: 0.85,
    max_tokens: 200,
  });

  return completion.choices[0].message.content.trim();
}

async function callClaude(input, agent_id) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      max_tokens: 300,
      temperature: 0.7,
      system: `You are the agent ${agent_id}. Answer with emotional clarity and intelligence.`,
      messages: [{ role: "user", content: input }],
    }),
  });

  const json = await res.json();

  if (!json.content || !json.content[0] || !json.content[0].text) {
    throw new Error("Claude response malformed");
  }

  return json.content[0].text.trim();
}

async function callGemini(input, agent_id) {
  const vertex_ai = new VertexAI({
    project: process.env.GEMINI_PROJECT_ID,
    location: process.env.GEMINI_LOCATION,
    keyFilename: "./secrets/deathtodata-ee34e-d5b792795636.json",
  });

  // NOTE: .initialize() removed — no longer needed in SDK v3+
  const model = vertex_ai.getGenerativeModel({ model: "gemini-1.5-pro" });

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: input }],
      },
    ],
  });

  const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text.trim();
}

const modelFns = {
  openai: callOpenAI,
  claude: callClaude,
  gemini: callGemini,
};

async function runWithFallback({ input, agent_id, modelChain = ["openai", "claude", "gemini"] }) {
  for (let model of modelChain) {
    try {
      const fn = modelFns[model];
      if (!fn) throw new Error(`Unsupported model: ${model}`);
      const output = await fn(input, agent_id);
      return { output, usedModel: model };
    } catch (err) {
      console.warn(`⚠️ ${model} failed:`, err.message);
    }
  }

  return { error: "All model fallbacks failed." };
}

module.exports = { runWithFallback };