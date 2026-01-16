// qr-validator.js – Validates QR codes against known MirrorChain anchors

const fs = require('fs');

function validateQR(qrCode) {
  const known = ["qr-founder-0000", "qr-riven-001", "qr-user-0821"];
  if (known.includes(qrCode)) {
    console.log("✅ QR validated:", qrCode);
    return true;
  } else {
    console.error("⛔ Invalid QR code. Session denied.");
    return false;
  }
}

// Handle command line execution
if (require.main === module) {
  const qrCode = process.argv[2];
  
  if (!qrCode) {
    console.error("❌ Error: QR code argument required");
    console.error("Usage: node qr-validator.js <qr-code>");
    process.exit(1);
  }
  
  const isValid = validateQR(qrCode);
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateQR };
