// AgentMinter.js – Promote agent, mint ownership, update registry

const fs = require('fs');
const registryPath = './AgentRegistry.json';

function mintAgentTokens(agentId, creatorId, initialRevenue = 0) {
  const registry = JSON.parse(fs.readFileSync(registryPath));
  const tokens = 100;
  registry.agents[agentId] = {
    name: agentId,
    creator: creatorId,
    status: "active",
    grade: "Seed",
    revenue: initialRevenue,
    tokens_total: tokens,
    tokens_owned: { [creatorId]: 40 }, // Creator keeps 40%
    dividends_paid: 0,
    buyback_price_per_token: 0,
    is_buyback_active: false
  };

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log(`✅ Agent '${agentId}' promoted with 100 tokens.`);
}

if (require.main === module) {
  const agentId = process.argv[2] || "agent-xyz";
  const creatorId = process.argv[3] || "qr-founder";
  const revenue = parseInt(process.argv[4] || "0");
  mintAgentTokens(agentId, creatorId, revenue);
}

module.exports = { mintAgentTokens };
