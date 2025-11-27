// /utils/arweaveUploader.js
import arweave from './arweaveClient.js';
import fs from 'fs';

const walletPath = './wallet.json'; // your real Arweave wallet JSON
const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf8'));

export async function uploadToArweave(filePath) {
  const data = fs.readFileSync(filePath);

  const transaction = await arweave.createTransaction({ data }, wallet);

  transaction.addTag('Content-Type', 'audio/webm'); // or application/json if uploading soulprints

  await arweave.transactions.sign(transaction, wallet);

  const response = await arweave.transactions.post(transaction);

  if (response.status === 200 || response.status === 202) {
    console.log(`✅ Uploaded to Arweave: https://arweave.net/${transaction.id}`);
    return transaction.id;
  } else {
    throw new Error('Failed to upload to Arweave.');
  }
}