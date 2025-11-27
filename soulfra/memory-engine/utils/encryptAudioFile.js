
// encryptAudioFile.js
import crypto from "crypto";
import fs from "fs";

export function encryptAudioFile(inputPath, outputPath, secretKey) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);

  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);

  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on('finish', () => resolve({ iv: iv.toString('hex') }));
    output.on('error', reject);
  });
}
