const fs = require("fs");
const path = require("path");

const dropPath = path.join(__dirname, "../drops");
const memoryPath = path.join(__dirname, "../dropMemory.json");

let memory = {};
if (fs.existsSync(memoryPath)) {
  memory = JSON.parse(fs.readFileSync(memoryPath));
}

const folders = fs.readdirSync(dropPath).filter((f) =>
  fs.statSync(path.join(dropPath, f)).isDirectory()
);

folders.forEach((folder) => {
  const brandingPath = path.join(dropPath, folder, "branding.json");
  const auditPath = path.join(dropPath, folder, "audit.json");

  if (!fs.existsSync(brandingPath) || !fs.existsSync(auditPath)) return;

  try {
    const branding = JSON.parse(fs.readFileSync(brandingPath));
    const audit = JSON.parse(fs.readFileSync(auditPath));

    memory[folder] = {
      mood: branding.mood,
      traits: branding?.voice?.voiceNote || null,
      layoutScore: audit.score,
      headline: branding?.voice?.headline,
      primaryCTA: branding?.voice?.cta?.primary,
      imageSource: branding?.image?.source,
      scoreNotes: audit.notes,
      issues: audit.issues
    };
  } catch (err) {
    console.warn(`⚠️ Could not log traits for: ${folder}`, err.message);
  }
});

fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
console.log("🧠 dropMemory.json updated.");