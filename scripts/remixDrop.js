require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const baseDrop = process.argv[2];
const remixMood = process.argv[3] || "chaotic";

if (!baseDrop) {
  console.error("❌ Usage: node scripts/remixDrop.js <existing-drop-name> [new-mood]");
  process.exit(1);
}

const timestamp = Date.now();
const remixSlug = `${baseDrop}-remix-${remixMood}-${timestamp}`;

const brandingPath = path.join(__dirname, `../drops/${baseDrop}/branding.json`);

if (!fs.existsSync(brandingPath)) {
  console.error(`❌ Cannot remix: ${baseDrop} not found.`);
  process.exit(1);
}

const branding = JSON.parse(fs.readFileSync(brandingPath));
const originalMood = branding.mood;
const basePrompt = branding.voice?.voiceNote || `Regenerate this ritual with new mood: ${remixMood}`;

const command = `node scripts/dropAssembler.js ${remixSlug} ${remixMood}`;

console.log(`🎭 Remixing '${baseDrop}' → '${remixSlug}'...`);
exec(command, (error, stdout, stderr) => {
  if (error || stderr) {
    console.error("❌ Remix failed:", error?.message || stderr);
    return;
  }
  console.log(stdout);
  console.log(`✅ Remix created at /drops/${remixSlug}`);
});