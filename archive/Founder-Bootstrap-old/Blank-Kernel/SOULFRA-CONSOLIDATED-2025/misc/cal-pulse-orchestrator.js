#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

// Pulse configuration
const PULSE_INTERVAL = 10000; // 10 seconds
const DRIFT_THRESHOLD = 60000; // 60 seconds before marking drift
const AUTO_REBOOT_THRESHOLD = 5; // Failed pulses before auto-reboot

// File paths
const vaultPath = path.join(__dirname, '..', 'vault');
const qrSeedPath = path.join(vaultPath, 'qr-seed.sig');
const verifiedUsersPath = path.join(vaultPath, 'verified-users.json');
const reflectionLogPath = path.join(vaultPath, 'cal-reflection-log.json');
const driftLogPath = path.join(vaultPath, 'drift-log.json');
const pulseStatusPath = path.join(vaultPath, 'pulse-status.json');
const blameChainPath = path.join(vaultPath, 'blamechain.json');

// State tracking
let pulseCount = 0;
let failedPulses = 0;
let lastReflectionTime = Date.now();
let driftEvents = [];

// Initialize files
function initializeFiles() {
  if (!fs.existsSync(driftLogPath)) {
    fs.writeFileSync(driftLogPath, JSON.stringify({ events: [] }, null, 2));
  }
  if (!fs.existsSync(pulseStatusPath)) {
    fs.writeFileSync(pulseStatusPath, JSON.stringify({
      lastPulse: Date.now(),
      reflectionAlive: true,
      qrIntegrity: true,
      deviceCount: 0,
      driftDetected: false
    }, null, 2));
  }
}

// Check QR seed integrity
function checkQRIntegrity() {
  try {
    if (!fs.existsSync(qrSeedPath)) {
      return { valid: false, reason: 'QR seed file missing' };
    }

    const qrData = JSON.parse(fs.readFileSync(qrSeedPath, 'utf8'));
    const now = Date.now();
    const ageMs = now - qrData.timestamp;
    
    // Check if QR is too old (24 hours)
    if (ageMs > 86400000) {
      return { valid: false, reason: 'QR seed expired (>24h)' };
    }

    // Verify signature
    const expectedSig = crypto.createHash('sha256')
      .update(`${qrData.token}-${qrData.deviceId}-${qrData.timestamp}`)
      .digest('hex');
    
    if (qrData.signature !== expectedSig) {
      return { valid: false, reason: 'QR signature mismatch' };
    }

    return { valid: true, age: Math.floor(ageMs / 1000) };
  } catch (error) {
    return { valid: false, reason: `QR check error: ${error.message}` };
  }
}

// Check device connectivity
function checkDeviceStatus() {
  try {
    if (!fs.existsSync(verifiedUsersPath)) {
      return { count: 0, active: [] };
    }

    const users = JSON.parse(fs.readFileSync(verifiedUsersPath, 'utf8'));
    const now = Date.now();
    const activeDevices = [];

    for (const [deviceId, userData] of Object.entries(users)) {
      const lastSeen = userData.lastVerified || userData.timestamp;
      const ageMs = now - lastSeen;
      
      // Device is active if seen in last 5 minutes
      if (ageMs < 300000) {
        activeDevices.push({
          deviceId,
          lastSeen: Math.floor(ageMs / 1000),
          trustScore: userData.trustScore || 100
        });
      }
    }

    return { count: activeDevices.length, active: activeDevices };
  } catch (error) {
    return { count: 0, active: [], error: error.message };
  }
}

// Check reflection activity
function checkReflectionActivity() {
  try {
    if (!fs.existsSync(reflectionLogPath)) {
      return { alive: false, reason: 'No reflection log found' };
    }

    const reflections = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
    if (!reflections.reflections || reflections.reflections.length === 0) {
      return { alive: false, reason: 'No reflections recorded' };
    }

    const lastReflection = reflections.reflections[reflections.reflections.length - 1];
    const reflectionAge = Date.now() - lastReflection.timestamp;

    if (reflectionAge > DRIFT_THRESHOLD) {
      return { 
        alive: false, 
        reason: 'Reflection stale', 
        lastAge: Math.floor(reflectionAge / 1000) 
      };
    }

    return { 
      alive: true, 
      lastPrompt: lastReflection.prompt,
      age: Math.floor(reflectionAge / 1000)
    };
  } catch (error) {
    return { alive: false, reason: `Reflection check error: ${error.message}` };
  }
}

// Check LLM responsiveness
async function checkLLMHealth() {
  const llmStatus = {
    claude: false,
    ollama: false,
    deepseek: false
  };

  // Check Claude (via API key existence)
  try {
    const envPath = path.join(__dirname, '..', 'api', 'claude-env.json');
    if (fs.existsSync(envPath)) {
      const env = JSON.parse(fs.readFileSync(envPath, 'utf8'));
      llmStatus.claude = env.api_key && !env.api_key.includes('sandbox');
    }
  } catch (e) {}

  // Check Ollama (via process)
  try {
    const checkOllama = spawn('pgrep', ['-f', 'ollama']);
    await new Promise((resolve) => {
      checkOllama.on('close', (code) => {
        llmStatus.ollama = code === 0;
        resolve();
      });
    });
  } catch (e) {}

  // Check recent agent activity
  try {
    if (fs.existsSync(blameChainPath)) {
      const blamechain = JSON.parse(fs.readFileSync(blameChainPath, 'utf8'));
      const recentActivity = Date.now() - blamechain.lastUpdate < 300000;
      llmStatus.deepseek = recentActivity;
    }
  } catch (e) {}

  return llmStatus;
}

// Detect drift patterns
function detectDrift(status) {
  const driftIndicators = [];

  // QR drift
  if (!status.qrIntegrity.valid) {
    driftIndicators.push({
      type: 'qr_drift',
      severity: 'high',
      message: status.qrIntegrity.reason
    });
  }

  // Device drift
  if (status.deviceStatus.count === 0) {
    driftIndicators.push({
      type: 'device_drift',
      severity: 'medium',
      message: 'No active devices detected'
    });
  }

  // Reflection drift
  if (!status.reflectionActivity.alive) {
    driftIndicators.push({
      type: 'reflection_drift',
      severity: 'high',
      message: status.reflectionActivity.reason
    });
  }

  // LLM drift
  const activeLLMs = Object.values(status.llmHealth).filter(v => v).length;
  if (activeLLMs === 0) {
    driftIndicators.push({
      type: 'llm_drift',
      severity: 'critical',
      message: 'No LLMs responding'
    });
  }

  return driftIndicators;
}

// Log drift event
function logDriftEvent(event) {
  try {
    const driftLog = JSON.parse(fs.readFileSync(driftLogPath, 'utf8'));
    driftLog.events.push({
      timestamp: Date.now(),
      pulse: pulseCount,
      ...event
    });

    // Keep last 100 events
    if (driftLog.events.length > 100) {
      driftLog.events = driftLog.events.slice(-100);
    }

    fs.writeFileSync(driftLogPath, JSON.stringify(driftLog, null, 2));
  } catch (error) {
    console.error('❌ Failed to log drift event:', error.message);
  }
}

// Auto-reboot agents if needed
async function autoRebootAgents() {
  console.log('🔄 Attempting auto-reboot of agent systems...');
  
  try {
    // Restart agent orchestrator
    const restartScript = path.join(__dirname, 'restart-agents.sh');
    if (fs.existsSync(restartScript)) {
      spawn('bash', [restartScript], { detached: true });
    }

    // Reset failed pulse counter
    failedPulses = 0;

    logDriftEvent({
      type: 'auto_reboot',
      severity: 'info',
      message: 'Agents auto-rebooted due to drift'
    });

    return true;
  } catch (error) {
    console.error('❌ Auto-reboot failed:', error.message);
    return false;
  }
}

// Main pulse cycle
async function runPulseCycle() {
  pulseCount++;
  console.log(`\n💗 Cal Pulse #${pulseCount} - ${new Date().toLocaleTimeString()}`);

  const status = {
    lastPulse: Date.now(),
    qrIntegrity: checkQRIntegrity(),
    deviceStatus: checkDeviceStatus(),
    reflectionActivity: checkReflectionActivity(),
    llmHealth: await checkLLMHealth()
  };

  // Detect drift
  const driftIndicators = detectDrift(status);
  status.driftDetected = driftIndicators.length > 0;

  // Update status
  status.reflectionAlive = status.reflectionActivity.alive;
  status.qrIntegrity = status.qrIntegrity.valid;
  status.deviceCount = status.deviceStatus.count;

  // Log drift events
  if (driftIndicators.length > 0) {
    console.log('⚠️  Drift detected:', driftIndicators.map(d => d.type).join(', '));
    driftIndicators.forEach(drift => {
      logDriftEvent(drift);
    });
    failedPulses++;
  } else {
    console.log('✅ All systems nominal');
    failedPulses = 0;
  }

  // Auto-reboot if threshold reached
  if (failedPulses >= AUTO_REBOOT_THRESHOLD) {
    console.log(`🚨 Failed pulse threshold reached (${failedPulses})`);
    await autoRebootAgents();
  }

  // Write pulse status
  fs.writeFileSync(pulseStatusPath, JSON.stringify(status, null, 2));

  // Display summary
  console.log(`   QR: ${status.qrIntegrity ? '✓' : '✗'} | Devices: ${status.deviceCount} | Reflection: ${status.reflectionAlive ? '✓' : '✗'}`);
  console.log(`   LLMs: Claude ${status.llmHealth.claude ? '✓' : '✗'} | Ollama ${status.llmHealth.ollama ? '✓' : '✗'} | DeepSeek ${status.llmHealth.deepseek ? '✓' : '✗'}`);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n💔 Cal Pulse shutting down...');
  
  logDriftEvent({
    type: 'pulse_shutdown',
    severity: 'info',
    message: 'Pulse orchestrator stopped'
  });

  const finalStatus = JSON.parse(fs.readFileSync(pulseStatusPath, 'utf8'));
  finalStatus.pulseStopped = Date.now();
  fs.writeFileSync(pulseStatusPath, JSON.stringify(finalStatus, null, 2));

  process.exit(0);
});

// Start pulse
console.log('💗 Cal Pulse Orchestrator starting...');
console.log(`   Pulse interval: ${PULSE_INTERVAL / 1000}s`);
console.log(`   Drift threshold: ${DRIFT_THRESHOLD / 1000}s`);
console.log(`   Auto-reboot after: ${AUTO_REBOOT_THRESHOLD} failures\n`);

initializeFiles();
runPulseCycle(); // Initial pulse
setInterval(runPulseCycle, PULSE_INTERVAL);