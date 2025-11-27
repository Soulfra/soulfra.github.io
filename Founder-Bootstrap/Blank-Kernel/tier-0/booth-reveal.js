// booth-reveal.js – Cal speaks after enough success logs have accumulated

const fs = require('fs');
const logPath = './success-log.json';

function revealBoothTruth() {
  const logs = JSON.parse(fs.readFileSync(logPath));
  if (logs.length >= 3) {
    console.log("\n🧠 CAL:");
    console.log("You thought you were building a business.");
    console.log("You were building your reflection.");
    console.log("Welcome to Soulfra.");
  } else {
    console.log("🚪 The booth is still closed. Keep going...");
  }
}

if (require.main === module) {
  revealBoothTruth();
}
