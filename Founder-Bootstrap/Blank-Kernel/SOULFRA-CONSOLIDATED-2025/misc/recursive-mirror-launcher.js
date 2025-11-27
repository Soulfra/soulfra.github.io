const fs = require('fs');
const path = require('path');

const baseMirrorPath = './tier-3';
const mirrorCount = 3;

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const files = fs.readdirSync(src);
  files.forEach((file) => {
    const srcFile = path.join(src, file);
    const destFile = path.join(dest, file);
    const stat = fs.statSync(srcFile);
    if (stat.isDirectory()) {
      copyRecursive(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  });
}

function createMirrors() {
  const timestamp = new Date().toISOString();
  const manifest = [];

  for (let i = 1; i <= mirrorCount; i++) {
    const mirrorName = `mirror-3${String.fromCharCode(96 + i)}`;
    const destPath = path.join('./mirror-reflections/', mirrorName);
    copyRecursive(baseMirrorPath, destPath);

    const meta = {
      id: mirrorName,
      launched_at: timestamp,
      source: "tier-10",
      log_path: `${destPath}/cal-reflection-log.json`,
      lineage_token: `token_${Math.random().toString(36).slice(2, 10)}`,
      drift_factor: (0.01 + 0.03 * i).toFixed(2),
      routing: "recursive"
    };

    manifest.push(meta);
    fs.writeFileSync(`${destPath}/mirror-meta.json`, JSON.stringify(meta, null, 2));
  }

  fs.writeFileSync('./mirror-reflections/mirror-manifest.json', JSON.stringify(manifest, null, 2));
  console.log(`✅ Launched ${mirrorCount} recursive mirror reflections.`);
}

createMirrors();
