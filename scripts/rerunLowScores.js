require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const dropsPath = path.join(__dirname, "../drops");
const folders = fs.readdirSync(dropsPath).filter((f) =>
  fs.statSync(path.join(dropsPath, f)).isDirectory()
);

const threshold = 7;

(async () => {
  console.log(`🔁 Rechecking all drops below layout score ${threshold}...\n`);

  for (const drop of folders) {
    const auditPath = path.join(dropsPath, drop, "audit.json");
    const brandingPath = path.join(dropsPath, drop, "branding.json");

    if (!fs.existsSync(auditPath)) continue;

    try {
      const audit = JSON.parse(fs.readFileSync(auditPath));
      if (audit.score >= threshold) continue;

      const branding = JSON.parse(fs.readFileSync(brandingPath));
      const mood = branding?.mood || "neutral";

      console.log(`♻️  Rerunning drop: ${drop} (score: ${audit.score})...`);
      const cmd = `node scripts/dropAssembler.js ${drop} ${mood}`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Failed to rerun ${drop}:`, error.message);
          return;
        }
        console.log(`✅ Drop reprocessed: ${drop}`);
      });
    } catch (err) {
      console.error(`❌ Failed to parse audit or branding for ${drop}:`, err.message);
    }
  }
})();