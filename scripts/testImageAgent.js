require("dotenv").config();
const { imageAgent } = require("../utils/imageAgent");

(async () => {
  const result = await imageAgent("A soft anonymous leak of love and curiosity", "playful");
  console.log("🖼️ Image Result:\n", result);
})();