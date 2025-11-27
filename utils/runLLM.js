const { OpenAI } = require("openai")
const { jsonLog } = require("./jsonLog")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function runLLM(prompt, agentName = "unknown", fallback = null, parse = true) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: `${agentName} agent` },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    })

    const raw = response.choices[0].message.content.trim()

    if (!parse) {
      jsonLog(agentName, { prompt, raw })
      return raw
    }

    const cleaned = raw.replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(cleaned)
    jsonLog(agentName, { prompt, raw, cleaned, parsed })
    return parsed
  } catch (err) {
    console.warn(`⚠️ runLLM failed for ${agentName}:`, err.message)
    if (fallback) {
      console.warn("🪂 Falling back to local logic...")
      return fallback()
    }
    return null
  }
}

module.exports = { runLLM }