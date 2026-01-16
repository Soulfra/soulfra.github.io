// infinity-router.js – Attaches trace token and session ID for fork execution

const fs = require('fs');
const path = require('path');

function injectTraceToken(qrCode) {
  const timestamp = new Date().toISOString();
  const token = {
    uuid: qrCode,
    trace_token: "token_" + Math.random().toString(36).substring(2, 12),
    issued_at: timestamp,
    tier: "-9"
  };
  
  const tokenPath = path.join(__dirname, 'mirror-trace-token.json');
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
  console.log("🔗 Mirror trace token issued.");
  console.log(`📄 Token saved to: ${tokenPath}`);
  return token;
}

// Handle command line execution
if (require.main === module) {
  const qrCode = process.argv[2];
  
  if (!qrCode) {
    console.error("❌ Error: QR code argument required");
    console.error("Usage: node infinity-router.js <qr-code>");
    process.exit(1);
  }
  
  try {
    const token = injectTraceToken(qrCode);
    console.log("✅ Session established:", token.trace_token);
  } catch (error) {
    console.error("❌ Failed to generate trace token:", error.message);
    process.exit(1);
  }
}

module.exports = { injectTraceToken };
