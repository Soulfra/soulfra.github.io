// /assistant/ritualValidator.js
import { loadSoulfraBlueprint } from './soulfra_assistant.js';
import { validateEnv } from './validators/validateEnv.js';
import { validateWhisper } from './validators/validateWhisper.js';
import { validateSupabase } from './validators/validateSupabase.js';
import { validateArweave } from './validators/validateArweave.js';
import { validateDockerContainers } from './validators/validateDockerContainers.js';
import { validateWhisperAPI } from './validators/validateWhisperAPI.js';
import { validateNodeDisk } from './validators/validateNodeDisk.js';
import { validateNodeCPU } from './validators/validateNodeCPU.js';
import { validateSSLCert } from './validators/validateSSLCert.js';
import { validateNodeHeartbeat } from './validators/validateNodeHeartbeat.js';

async function runValidators() {
  console.log('\n🌌 Loading Soulfra Sacred Blueprint...');
  loadSoulfraBlueprint();

  console.log('\n🛡️ Running Sacred Ritual System Validators...\n');

  try {
    await validateEnv();
    await validateWhisper();
    await validateSupabase();
    await validateArweave();
    await validateDockerContainers();
    await validateWhisperAPI();
    await validateNodeDisk();
    await validateNodeCPU();
    await validateSSLCert();
    await validateNodeHeartbeat();

    console.log('\n✅ Sacred Ritual System Healthy.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Sacred Ritual System Integrity Failed:', error.message);
    process.exit(1);
  }
}

runValidators();