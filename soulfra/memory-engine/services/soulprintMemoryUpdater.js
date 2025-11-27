// /services/soulprintMemoryUpdater.js
import fs from 'fs';
import path from 'path';
import { uploadToArweave } from '../utils/arweaveUploader.js';

const SOULPRINTS_PATH = path.join('uploads', 'soulprints.json');

// Helper: Load soulprints from local JSON
function loadSoulprints() {
  if (!fs.existsSync(SOULPRINTS_PATH)) {
    return {};
  }
  const raw = fs.readFileSync(SOULPRINTS_PATH);
  return JSON.parse(raw);
}

// Helper: Save soulprints back to local JSON
function saveSoulprints(soulprints) {
  fs.writeFileSync(SOULPRINTS_PATH, JSON.stringify(soulprints, null, 2));
}

// Main: Add new memory to soulprint + upload latest soulprint file to Arweave
export async function addMemoryToSoulprint(userId, ritualMemory) {
  const soulprints = loadSoulprints();

  if (!soulprints[userId]) {
    soulprints[userId] = {
      userId,
      memories: []
    };
  }

  soulprints[userId].memories.push(ritualMemory);

  // Save locally first
  saveSoulprints(soulprints);

  // Upload updated soulprints.json to Arweave
  const soulprintsFilePath = path.resolve(SOULPRINTS_PATH);
  const txId = await uploadToArweave(soulprintsFilePath);

  console.log(`✅ Sacred soulprint uploaded to Arweave: https://arweave.net/${txId}`);

  return txId; // Return the new Arweave transaction ID
}