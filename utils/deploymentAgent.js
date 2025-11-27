const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

async function deploymentAgent(dropName, copyToPublic = true) {
  return new Promise((resolve, reject) => {
    try {
      const folderPath = path.join(__dirname, `../drops/${dropName}`);
      const zipPath = path.join(__dirname, `../drops/${dropName}.zip`);

      if (!fs.existsSync(folderPath)) {
        return reject(new Error(`❌ Folder not found: /drops/${dropName}`));
      }

      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      output.on("close", () => {
        console.log(`📦 Zip created: ${zipPath} (${archive.pointer()} bytes)`);

        if (copyToPublic) {
          const publicPath = path.join(__dirname, `../public`);
          if (!fs.existsSync(publicPath)) fs.mkdirSync(publicPath);
          fs.cpSync(folderPath, publicPath, { recursive: true });
          console.log("✅ Copied drop to /public for serving.");
        }

        resolve(zipPath);
      });

      archive.on("error", (err) => reject(err));
      archive.pipe(output);
      archive.directory(folderPath, false);
      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { deploymentAgent };