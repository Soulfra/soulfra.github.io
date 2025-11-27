// /services/soulprintViewer.js
import fs from 'fs';
import path from 'path';

const SOULPRINTS_PATH = path.join('uploads', 'soulprints.json');

// Load and parse soulprints.json
export function loadSoulprints() {
  if (!fs.existsSync(SOULPRINTS_PATH)) {
    console.warn('⚠️ No soulprints.json found yet.');
    return {};
  }

  const rawData = fs.readFileSync(SOULPRINTS_PATH);
  return JSON.parse(rawData);
}

// Get a specific user's soulprint
export function getSoulprintForUser(userId) {
  const soulprints = loadSoulprints();
  return soulprints[userId] || null;
}