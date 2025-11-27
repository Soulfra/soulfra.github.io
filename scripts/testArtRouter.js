require("dotenv").config();
const { runArtRouter } = require("../utils/runArtRouter");

(async () => {
  const theme = await runArtRouter({
    dropName: "NiceLeak",
    mood: "playful",
  });

  console.log("🎨 Art Theme Output:\n", theme);
})();