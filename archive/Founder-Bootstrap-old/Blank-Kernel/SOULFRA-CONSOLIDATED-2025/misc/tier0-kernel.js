const fs = require('fs');
const path = require('path');

const configPath = './tier0-config.json';
const sigPath = '../tier-minus10/soul-chain.sig';

if (!fs.existsSync(configPath) || !fs.existsSync(sigPath)) {
  console.error("❌ Kernel config or signature missing.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath));
const sig = fs.readFileSync(sigPath, 'utf8');

console.log("✅ Blank Kernel Booting");
console.log("📎 QR ID:", config.qr_id);
console.log("🔐 Using Cal API key:", config.cal_api_key.slice(0, 5) + "...");
console.log("🧠 Loading runtime from Tier -10");

require("child_process").exec("node ../tier-minus10/riven-cli-server.js");
