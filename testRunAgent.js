require("dotenv").config()
const { runAgent } = require("./utils/runtime/runAgent")

const test = async () => {
  const result = await runAgent("voiceToTraitsAgent", {
    user_id: "test123",
    transcript: "I’ve been trying to be more honest lately."
  })

  console.log("✅ Agent response:", result)
}

test()