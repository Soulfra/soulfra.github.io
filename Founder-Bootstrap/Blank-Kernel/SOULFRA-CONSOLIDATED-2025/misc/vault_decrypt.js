const fs = require('fs');
const crypto = require('crypto');
const child_process = require('child_process');

function getDeviceId() {
  try {
    const id = child_process.execSync("ioreg -rd1 -c IOPlatformExpertDevice | awk -F\\\" '/IOPlatformUUID/ {print $4}'").toString().trim();
    return id || "fallback";
  } catch {
    return "fallback";
  }
}

const deviceId = getDeviceId();
const key = crypto.createHash('sha256').update(deviceId).digest();
const encrypted = fs.readFileSync('./user-reflection-log.encrypted', 'utf8');
const raw = Buffer.from(encrypted, 'base64');
const iv = raw.slice(0, 16);
const ciphertext = raw.slice(16);

try {
  const decipher = crypto.createDecipheriv('aes-256-cfb', key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  fs.writeFileSync('./cal-reflection-log.json', decrypted);
  console.log("✅ Vault decrypted. Log restored.");
} catch {
  console.error("❌ Decryption failed. Cal trust broken.");
  process.exit(1);
}
