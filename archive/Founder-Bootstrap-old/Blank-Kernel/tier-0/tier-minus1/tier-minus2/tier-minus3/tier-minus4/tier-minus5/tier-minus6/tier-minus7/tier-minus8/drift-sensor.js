// drift-sensor.js – Flags forks that exceed allowable logic drift

function analyzeDriftScore(userScore, maxAllowed = 0.15) {
  console.log("📉 Analyzing reflection drift score:", userScore);
  if (userScore > maxAllowed) {
    console.warn("⚠️  Drift exceeds trust threshold. Fork may be unstable.");
    return false;
  } else {
    console.log("✅ Fork within safe lineage range.");
    return true;
  }
}

module.exports = { analyzeDriftScore };
