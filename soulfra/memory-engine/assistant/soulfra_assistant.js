import fs from 'fs';
import path from 'path';

export function loadSoulfraBlueprint() {
  const blueprintPath = path.resolve('assistant/blueprint.json');
  if (!fs.existsSync(blueprintPath)) {
    console.error('❌ Blueprint not found.');
    process.exit(1);
  }
  const raw = fs.readFileSync(blueprintPath);
  const data = JSON.parse(raw);
  console.log('🌌 Loaded Soulfra Blueprint:');
  console.log(`Project: ${data.project}`);
  console.log(`Current Phase: ${data.current_phase}`);
  console.log(`Sacred Principles: ${data.sacred_principles.join(', ')}`);
  console.log(`Next Phases: ${data.next_phases.join(', ')}`);
}