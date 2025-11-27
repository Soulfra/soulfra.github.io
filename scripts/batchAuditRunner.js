require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { layoutAuditAgent } = require("../agents/layoutAuditAgent");

const dropsPath = path.join(__dirname, "../drops");
const folders = fs.readdirSync(dropsPath).filter((f) =>
  fs.statSync(path.join(dropsPath, f)).isDirectory()
);

(async () => {
  console.log("🧪 Running layout audits on all drops:\n");

  for (const drop of folders) {
    const indexPath = path.join(dropsPath, drop, "index.html");
    if (!fs.existsSync(indexPath)) continue;

    const html = fs.readFileSync(indexPath, "utf-8");

    let mood = "neutral";
    const brandingPath = path.join(dropsPath, drop, "branding.json");
    if (fs.existsSync(brandingPath)) {
      try {
        const branding = JSON.parse(fs.readFileSync(brandingPath));
        mood = branding?.style?.styleNote || "neutral";
      } catch {
        console.warn(`⚠️ Could not parse branding.json for ${drop}`);
      }
    }

    const result = await layoutAuditAgent(html, mood);
    if (result) {
      console.log(`📄 ${drop} — Score: ${result.score}/10`);
      console.log(`📝 Notes: ${result.notes}`);
      if (result.issues?.length) {
        console.table(result.issues);
      }
    } else {
      console.warn(`⚠️ Audit failed for: ${drop}`);
    }
  }
})();