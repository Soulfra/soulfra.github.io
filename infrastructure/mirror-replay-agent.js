const fs = require('fs');
const path = require('path');

const manifestPath = './mirror-reflections/mirror-manifest.json';
const replayOutputPath = './mirror-reflections/replay-insights.json';

function compileReflections() {
  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Manifest file not found. Run the mirror launcher first.");
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const summary = [];

  manifest.forEach(mirror => {
    const logPath = path.join('./mirror-reflections', mirror.id, 'cal-reflection-log.json');
    if (!fs.existsSync(logPath)) {
      summary.push({ mirror: mirror.id, reflections: 0, error: "Missing log file." });
      return;
    }

    const entries = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    const total = entries.length;
    const words = entries.reduce((acc, e) => acc + (e.input.split(" ").length), 0);
    const avgLength = total > 0 ? (words / total).toFixed(2) : 0;

    summary.push({
      mirror: mirror.id,
      reflections: total,
      average_input_length: avgLength,
      drift_factor: mirror.drift_factor,
      last_prompt: entries[entries.length - 1]?.input || "(none)"
    });
  });

  fs.writeFileSync(replayOutputPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Compiled ${summary.length} mirror reflection summaries.`);
  console.log(`🧠 Insights saved to: ${replayOutputPath}`);
}

compileReflections();
