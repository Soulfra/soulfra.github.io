// /utils/encryptionUtils.js

import fs from 'fs';
import path from 'path';
import Arweave from 'arweave';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Arweave client
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

// Load wallet key from .env or separate config (for now we assume private key in .env as BASE64)
const walletKey = JSON.parse(Buffer.from(process.env.SACRED_ARWEAVE_KEY, 'base64').toString('utf-8'));

export async function encryptAndUploadToArweave(filePath) {
  if (!walletKey) {
    throw new Error('Arweave wallet key not configured.');
  }

  const absoluteFilePath = path.resolve(filePath);

  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error('File does not exist for encryption and upload.');
  }

  const fileBuffer = fs.readFileSync(absoluteFilePath);

  // Optional: insert encryption step here later if needed
  const data = fileBuffer; // currently no encryption

  console.log('🔗 Uploading ritual to Arweave...');

  const transaction = await arweave.createTransaction({ data }, walletKey);

  // Optionally add tags to identify Soulfra rituals
  transaction.addTag('App-Name', 'SoulfraMemoryEngine');
  transaction.addTag('Content-Type', 'audio/wav');
  transaction.addTag('Soulfra-Version', '1.0');

  await arweave.transactions.sign(transaction, walletKey);

  const response = await arweave.transactions.post(transaction);

  if (response.status !== 200 && response.status !== 202) {
    console.error('❌ Arweave upload failed:', response);
    throw new Error('Failed to upload ritual to Arweave.');
  }

  console.log('✅ Ritual uploaded to Arweave. Transaction ID:', transaction.id);

  return transaction.id;
}