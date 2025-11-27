require("dotenv").config();
const { runStyleAgent } = require("../utils/runStyleAgent");

(async () => {
  const styles = await runStyleAgent("playful");
  console.log("💅 Style Agent Output:\n", styles);
})();