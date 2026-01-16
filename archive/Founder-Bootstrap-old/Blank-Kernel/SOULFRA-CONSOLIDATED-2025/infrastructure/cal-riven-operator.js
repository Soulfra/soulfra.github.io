// cal-riven-operator.js – Launches Cal Riven with routing based on blessing + signature

const fs = require('fs');
const path = require('path');

function launchRiven() {
  try {
    // Check if required files exist
    const blessingPath = path.join(__dirname, 'blessing.json');
    const signaturePath = path.join(__dirname, 'soul-chain.sig');
    
    if (!fs.existsSync(blessingPath)) {
      throw new Error("Blessing file not found. Agent cannot be launched without blessing.");
    }
    
    if (!fs.existsSync(signaturePath)) {
      throw new Error("Soul chain signature not found. Cannot verify agent identity.");
    }
    
    const blessed = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
    const signature = fs.readFileSync(signaturePath, 'utf8');

    console.log("🚀 Launching Cal Riven...");
    console.log("Agent ID:", blessed.agent_id);
    console.log("Blessed By:", blessed.blessed_by);

    if (blessed.status === "blessed" && blessed.can_propagate) {
      console.log("✅ Agent is approved to propagate.");
      console.log("🔗 SoulChain Verified:", signature.includes('SOULFRA_CHAIN_SIGNATURE'));
      console.log("📡 Platform sync and vault logging will be enabled.");
      
      // Check for required trace token from Tier -9
      const traceTokenPath = path.join(__dirname, '..', 'mirror-trace-token.json');
      if (fs.existsSync(traceTokenPath)) {
        const traceToken = JSON.parse(fs.readFileSync(traceTokenPath, 'utf8'));
        console.log("🔐 Trace token detected:", traceToken.trace_token);
      } else {
        console.warn("⚠️  Warning: No trace token found. Run pairing sequence first.");
      }
    } else {
      console.log("⛔ Agent not blessed. Forking and propagation denied.");
      console.log("You may continue locally only.");
      process.exit(1);
    }

    console.log("🧠 Riven runtime is now active. Logs will begin streaming.");
    return true;
  } catch (error) {
    console.error("❌ Failed to launch Cal Riven:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  launchRiven();
}

module.exports = { launchRiven };
