// /services/memoryStorage.js
import fs from 'fs';
import path from 'path';
import { uploadToArweave } from '../utils/arweaveUploader.js';
import { encryptFile } from '../utils/encryptionUtils.js';

const ENCRYPTION_KEY = process.env.SACRED_ENCRYPTION_KEY || 'f7e1a76d8a6f8b5e3c79d8c8d1e91d29f7e1a76d8a6f8b5e3c79d8c8d1e91d29';

export async function saveRitualMemory(file, metadata) {
  const userId = metadata.userId || 'anonymous';

  const userFolder = path.join('uploads', userId);
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }

  const encryptedPath = path.join(userFolder, file.filename + '.enc');

  // Encrypt file
  const ivHex = await encryptFile(file.path, encryptedPath, ENCRYPTION_KEY);

  if (process.env.NODE_ENV === 'development') {
    return {
      storage: 'local',
      path: encryptedPath,
      metadata,
      timestamp: new Date().toISOString(),
      iv: ivHex
    };
  } else {
    // Upload encrypted file
    const txId = await uploadToArweave(encryptedPath);
    return {
      storage: 'arweave',
      arweaveTxId: txId,
      metadata,
      timestamp: new Date().toISOString(),
      iv: ivHex
    };
  }
}