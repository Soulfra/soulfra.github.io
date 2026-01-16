// fork-sandbox.js – Controlled fork layer for agent reflection

const fs = require('fs');

function forkAgentLogic(modifiedLogic) {
  console.log("🔧 Forking agent logic inside sandbox...");
  const forkId = "fork-" + Math.random().toString(36).substring(2, 10);
  fs.writeFileSync(`./fork-${forkId}.js`, modifiedLogic);
  console.log("🧪 Logic forked under sandbox scope:", forkId);
  return forkId;
}

module.exports = { forkAgentLogic };
