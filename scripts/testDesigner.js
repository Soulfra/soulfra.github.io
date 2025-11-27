require("dotenv").config();
const { designerAgentLoop } = require("../utils/designerAgentLoop");

(async () => {
  await designerAgentLoop("NiceLeak", "playful");
})();