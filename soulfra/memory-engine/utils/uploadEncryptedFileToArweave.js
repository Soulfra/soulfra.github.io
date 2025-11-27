
// uploadEncryptedFileToArweave.js
import Arweave from "arweave";
import fs from "fs";

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

export async function uploadEncryptedFileToArweave(filePath, walletKey) {
  const data = fs.readFileSync(filePath);
  const transaction = await arweave.createTransaction({ data }, walletKey);
  transaction.addTag('Content-Type', 'application/octet-stream');

  await arweave.transactions.sign(transaction, walletKey);
  await arweave.transactions.post(transaction);

  return transaction.id;
}
