require("dotenv").config();
const { runCodeRouter } = require("../utils/runCodeRouter");

(async () => {
  const prompt = "Generate a landing hero section for a soft anonymous compliments app called NiceLeak.";
  const mood = "playful";

  const code = await runCodeRouter({ prompt, mood });

  console.log("🔧 Generated Code:\n", code);
})();