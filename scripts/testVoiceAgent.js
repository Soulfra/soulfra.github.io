require("dotenv").config();
const { brandVoiceAgent } = require("../utils/brandVoiceAgent");

(async () => {
  const copy = await brandVoiceAgent({
    dropName: "NiceLeak",
    mood: "playful",
  });

  console.log("🗣️ Brand Voice Output:\n", copy);
})();