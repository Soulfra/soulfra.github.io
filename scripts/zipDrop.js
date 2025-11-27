require("dotenv").config();
const { deploymentAgent } = require("../utils/deploymentAgent");

(async () => {
  await deploymentAgent("NiceLeak");
})();