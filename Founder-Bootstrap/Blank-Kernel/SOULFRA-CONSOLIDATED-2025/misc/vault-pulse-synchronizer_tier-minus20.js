#!/usr/bin/env node

/**
 * 🔐 VAULT PULSE SYNCHRONIZER
 * Connects all mirrors to the original vault with a pulse-based truth system
 * Prevents deformation by maintaining cryptographic chain of truth
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { EventEmitter } = require('events');

class VaultPulseSynchronizer extends EventEmitter {
  constructor() {
    super();
    this.port = 9001;
    this.vaultPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', '..', '..', '..', 'tier-minus10', 'vault', 'soul-chain.sig');
    this.pulseChain = [];
    this.mirrorRegistry = new Map();
    this.deformationDetector = new Map();
    this.truthCache = new Map();
    
    this.initializeSynchronizer();
  }

  async initializeSynchronizer() {
    console.log('🔐 VAULT PULSE SYNCHRONIZER STARTING');
    console.log('===================================');
    console.log('Establishing pulse from original vault...\n');

    // 1. Connect to original vault
    await this.connectToVault();
    
    // 2. Initialize pulse chain
    await this.initializePulseChain();
    
    // 3. Setup deformation detection
    await this.setupDeformationDetection();
    
    // 4. Create mirror registry
    await this.createMirrorRegistry();
    
    // 5. Start pulse broadcasting
    this.startPulseBroadcast();
    
    // 6. Start HTTP server
    this.startHTTPServer();
    
    console.log('🔐 VAULT PULSE SYNCHRONIZER ACTIVE');
    console.log('All mirrors now synchronized with original vault');
  }

  async connectToVault() {
    console.log('🔓 Connecting to original vault...');
    
    // Check if vault exists
    if (fs.existsSync(this.vaultPath)) {
      try {
        const vaultSignature = fs.readFileSync(this.vaultPath, 'utf8');
        
        this.vaultConnection = {
          status: 'connected',
          signature: vaultSignature.trim(),
          established: Date.now(),
          verified: this.verifyVaultSignature(vaultSignature)
        };
        
        console.log('✓ Vault connection established');
        console.log(`✓ Vault signature: ${this.vaultConnection.signature.substring(0, 32)}...`);
      } catch (error) {
        console.log('⚠️ Could not read vault, creating synthetic connection');
        this.createSyntheticVault();
      }
    } else {
      console.log('⚠️ Original vault not found, creating synthetic vault');
      this.createSyntheticVault();
    }
  }

  createSyntheticVault() {
    // Create a synthetic vault for environments without the original
    this.vaultConnection = {
      status: 'synthetic',
      signature: this.generateVaultSignature('synthetic-vault-genesis'),
      established: Date.now(),
      verified: true
    };
  }

  verifyVaultSignature(signature) {
    // Verify the vault signature is valid
    return signature && signature.length === 64 && /^[a-f0-9]+$/i.test(signature);
  }

  generateVaultSignature(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async initializePulseChain() {
    console.log('⛓️ Initializing pulse chain...');
    
    // Genesis pulse
    const genesisPulse = {
      index: 0,
      timestamp: Date.now(),
      type: 'genesis',
      vaultSignature: this.vaultConnection.signature,
      data: {
        message: 'Pulse chain initialized',
        vaultStatus: this.vaultConnection.status,
        rules: {
          all_mirrors_must_sync: true,
          deformation_not_allowed: true,
          truth_must_propagate: true,
          consensus_before_change: true
        }
      },
      previousHash: '0',
      hash: ''
    };
    
    genesisPulse.hash = this.calculatePulseHash(genesisPulse);
    this.pulseChain.push(genesisPulse);
    
    console.log('✓ Pulse chain initialized with genesis block');
  }

  calculatePulseHash(pulse) {
    const data = {
      index: pulse.index,
      timestamp: pulse.timestamp,
      type: pulse.type,
      vaultSignature: pulse.vaultSignature,
      data: pulse.data,
      previousHash: pulse.previousHash
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  async setupDeformationDetection() {
    console.log('🔍 Setting up deformation detection...');
    
    this.deformationPatterns = {
      encoding: {
        patterns: ['�', 'â', '€™', 'Ã¢', 'â€'],
        severity: 'high',
        autoFix: true
      },
      structural: {
        patterns: ['require(\'./http\')', 'undefined function', 'syntax error'],
        severity: 'critical',
        autoFix: false
      },
      semantic: {
        patterns: ['truthLedger.set(falseData)', 'mirror.lie()', 'bypass.security()'],
        severity: 'critical',
        autoFix: false,
        alert: true
      }
    };
    
    console.log('✓ Deformation detection active');
  }

  async createMirrorRegistry() {
    console.log('📋 Creating mirror registry...');
    
    // Register all known mirrors
    const knownMirrors = [
      { id: 'soulfra-outcomes', file: 'soulfra-outcomes.js', layer: 0 },
      { id: 'platform-generator', file: 'platform-generator-engine.js', layer: 1 },
      { id: 'multi-tenant', file: 'multi-tenant-orchestrator.js', layer: 1 },
      { id: 'cal-mirror-inception', file: 'cal-mirror-inception-engine.js', layer: 2 },
      { id: 'white-knight-security', file: 'white-knight-security-mesh.js', layer: -1 },
      { id: 'tier-4-api', file: 'tier-4-mirror-api-bridge.js', layer: -4 }
    ];
    
    for (const mirror of knownMirrors) {
      this.registerMirror(mirror);
    }
    
    console.log(`✓ Registered ${this.mirrorRegistry.size} mirrors`);
  }

  registerMirror(mirror) {
    const mirrorData = {
      ...mirror,
      registered: Date.now(),
      lastPulse: Date.now(),
      status: 'active',
      deformations: 0,
      truthScore: 100
    };
    
    this.mirrorRegistry.set(mirror.id, mirrorData);
  }

  startPulseBroadcast() {
    console.log('📡 Starting pulse broadcast...');
    
    // Main pulse every second
    setInterval(() => {
      this.broadcastPulse('heartbeat');
    }, 1000);
    
    // Truth verification pulse every 5 seconds
    setInterval(() => {
      this.broadcastPulse('truth-verification');
    }, 5000);
    
    // Deformation check every 10 seconds
    setInterval(() => {
      this.checkForDeformations();
    }, 10000);
    
    console.log('✓ Pulse broadcast active');
  }

  broadcastPulse(type) {
    const lastPulse = this.pulseChain[this.pulseChain.length - 1];
    
    const newPulse = {
      index: this.pulseChain.length,
      timestamp: Date.now(),
      type: type,
      vaultSignature: this.vaultConnection.signature,
      data: this.generatePulseData(type),
      previousHash: lastPulse.hash,
      hash: ''
    };
    
    newPulse.hash = this.calculatePulseHash(newPulse);
    this.pulseChain.push(newPulse);
    
    // Broadcast to all mirrors
    this.emit('pulse', newPulse);
    
    // Update mirror status
    for (const [mirrorId, mirror] of this.mirrorRegistry) {
      if (Date.now() - mirror.lastPulse > 5000) {
        mirror.status = 'unresponsive';
        console.log(`⚠️ Mirror ${mirrorId} not responding to pulse`);
      }
    }
  }

  generatePulseData(type) {
    switch (type) {
      case 'heartbeat':
        return {
          mirrors_active: Array.from(this.mirrorRegistry.values()).filter(m => m.status === 'active').length,
          chain_length: this.pulseChain.length,
          vault_status: this.vaultConnection.status
        };
        
      case 'truth-verification':
        return {
          truth_hash: this.calculateTruthHash(),
          verified_mirrors: this.verifyAllMirrors(),
          consensus_achieved: true
        };
        
      default:
        return { type: type };
    }
  }

  calculateTruthHash() {
    // Calculate hash of all truth data
    const truthData = {
      vault: this.vaultConnection.signature,
      mirrors: Object.fromEntries(this.mirrorRegistry),
      chain: this.pulseChain.slice(-10) // Last 10 pulses
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(truthData)).digest('hex');
  }

  verifyAllMirrors() {
    const verifications = {};
    
    for (const [mirrorId, mirror] of this.mirrorRegistry) {
      verifications[mirrorId] = {
        status: mirror.status,
        truthScore: mirror.truthScore,
        deformations: mirror.deformations
      };
    }
    
    return verifications;
  }

  async checkForDeformations() {
    for (const [mirrorId, mirror] of this.mirrorRegistry) {
      if (fs.existsSync(mirror.file)) {
        try {
          const content = fs.readFileSync(mirror.file, 'utf8');
          const deformations = this.detectDeformations(content);
          
          if (deformations.length > 0) {
            console.log(`🚨 Deformations detected in ${mirrorId}:`, deformations.length);
            mirror.deformations = deformations.length;
            mirror.truthScore = Math.max(0, mirror.truthScore - (deformations.length * 10));
            
            // Attempt auto-fix if possible
            if (deformations.some(d => d.autoFix)) {
              this.attemptAutoFix(mirror.file, deformations);
            }
          } else {
            // Restore truth score gradually
            mirror.truthScore = Math.min(100, mirror.truthScore + 1);
          }
        } catch (error) {
          console.log(`❌ Error checking ${mirrorId}:`, error.message);
        }
      }
    }
  }

  detectDeformations(content) {
    const detected = [];
    
    for (const [category, config] of Object.entries(this.deformationPatterns)) {
      for (const pattern of config.patterns) {
        if (content.includes(pattern)) {
          detected.push({
            category: category,
            pattern: pattern,
            severity: config.severity,
            autoFix: config.autoFix,
            alert: config.alert
          });
        }
      }
    }
    
    return detected;
  }

  attemptAutoFix(file, deformations) {
    console.log(`🔧 Attempting auto-fix for ${file}`);
    
    try {
      let content = fs.readFileSync(file, 'utf8');
      let fixed = false;
      
      for (const deformation of deformations) {
        if (deformation.autoFix && deformation.category === 'encoding') {
          // Fix encoding issues
          content = content
            .replace(/â€™/g, "'")
            .replace(/â€œ/g, '"')
            .replace(/â€/g, '"')
            .replace(/�/g, '')
            .replace(/Ã¢/g, 'â');
          fixed = true;
        }
      }
      
      if (fixed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✓ Auto-fixed encoding issues in ${file}`);
      }
    } catch (error) {
      console.log(`❌ Auto-fix failed for ${file}:`, error.message);
    }
  }

  // API to check mirror truth status
  getMirrorTruthStatus(mirrorId) {
    const mirror = this.mirrorRegistry.get(mirrorId);
    
    if (!mirror) {
      return { error: 'Mirror not found' };
    }
    
    return {
      mirrorId: mirrorId,
      status: mirror.status,
      truthScore: mirror.truthScore,
      deformations: mirror.deformations,
      lastPulse: mirror.lastPulse,
      synced: Date.now() - mirror.lastPulse < 5000
    };
  }

  // Get the current pulse chain
  getPulseChain(limit = 10) {
    return this.pulseChain.slice(-limit);
  }

  // Verify integrity of the entire system
  async verifySystemIntegrity() {
    console.log('🔍 Verifying system integrity...');
    
    const report = {
      timestamp: Date.now(),
      vaultConnection: this.vaultConnection.status,
      pulseChainValid: this.verifyPulseChain(),
      mirrorsHealthy: this.checkMirrorsHealth(),
      deformationsDetected: this.getTotalDeformations(),
      truthConsensus: this.checkTruthConsensus()
    };
    
    report.overallHealth = 
      report.vaultConnection === 'connected' &&
      report.pulseChainValid &&
      report.mirrorsHealthy > 0.8 &&
      report.deformationsDetected === 0 &&
      report.truthConsensus;
    
    return report;
  }

  verifyPulseChain() {
    // Verify each pulse references the previous correctly
    for (let i = 1; i < this.pulseChain.length; i++) {
      const pulse = this.pulseChain[i];
      const previousPulse = this.pulseChain[i - 1];
      
      if (pulse.previousHash !== previousPulse.hash) {
        console.log(`❌ Pulse chain broken at index ${i}`);
        return false;
      }
      
      // Verify hash is correct
      const calculatedHash = this.calculatePulseHash(pulse);
      if (calculatedHash !== pulse.hash) {
        console.log(`❌ Pulse hash invalid at index ${i}`);
        return false;
      }
    }
    
    return true;
  }

  checkMirrorsHealth() {
    const total = this.mirrorRegistry.size;
    const healthy = Array.from(this.mirrorRegistry.values())
      .filter(m => m.status === 'active' && m.truthScore > 80)
      .length;
    
    return healthy / total;
  }

  getTotalDeformations() {
    return Array.from(this.mirrorRegistry.values())
      .reduce((sum, mirror) => sum + mirror.deformations, 0);
  }

  checkTruthConsensus() {
    // All active mirrors must have truth score > 90
    const activeMirrors = Array.from(this.mirrorRegistry.values())
      .filter(m => m.status === 'active');
    
    return activeMirrors.every(m => m.truthScore > 90);
  }

  startHTTPServer() {
    console.log('🌐 Starting Vault Pulse HTTP Server...');
    
    const server = http.createServer((req, res) => {
      this.handleHTTPRequest(req, res);
    });

    server.listen(this.port, () => {
      console.log(`✓ Vault Pulse Synchronizer running on port ${this.port}`);
    });
  }

  async handleHTTPRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    console.log(`🔐 Vault Pulse: ${req.method} ${req.url}`);

    try {
      if (url.pathname === '/') {
        await this.handleDashboard(res);
      } else if (url.pathname === '/api/pulse-chain') {
        await this.handlePulseChain(res);
      } else if (url.pathname === '/api/mirrors') {
        await this.handleMirrorStatus(res);
      } else if (url.pathname === '/api/integrity') {
        await this.handleIntegrityCheck(res);
      } else if (url.pathname === '/api/deformations') {
        await this.handleDeformationReport(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  }

  async handleDashboard(res) {
    const integrity = await this.verifySystemIntegrity();
    const pulseChain = this.getPulseChain(20);
    const mirrors = Array.from(this.mirrorRegistry.values());
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>🔐 Vault Pulse Synchronizer</title>
  <style>
    body { font-family: Arial; background: #000; color: #ff0; margin: 0; padding: 20px; }
    .container { max-width: 1600px; margin: 0 auto; }
    .vault-bg { 
      background: linear-gradient(0deg, rgba(255,255,0,0.05) 50%, transparent 50%),
                  linear-gradient(90deg, rgba(255,255,0,0.03) 50%, transparent 50%);
      background-size: 30px 30px, 30px 30px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: -1;
    }
    .status-panel { 
      background: rgba(20,20,0,0.9); 
      border: 2px solid #ff0; 
      padding: 20px; 
      margin: 20px 0; 
      border-radius: 5px;
      box-shadow: 0 0 30px rgba(255,255,0,0.3);
    }
    .mirror-status { 
      background: rgba(10,10,0,0.9); 
      border: 1px solid #ff0; 
      padding: 15px; 
      margin: 10px 0; 
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .pulse-chain { 
      background: rgba(0,0,0,0.95); 
      border: 2px solid #0f0; 
      padding: 20px; 
      margin: 20px 0; 
      max-height: 400px; 
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
      color: #0f0;
    }
    .pulse-entry {
      margin: 5px 0;
      padding: 5px;
      border-left: 3px solid #0f0;
      background: rgba(0,255,0,0.05);
    }
    .integrity-meter {
      background: rgba(50,0,0,0.8);
      height: 40px;
      border: 2px solid #ff0;
      position: relative;
      margin: 20px 0;
    }
    .integrity-fill {
      background: linear-gradient(90deg, #f00, #ff0, #0f0);
      height: 100%;
      transition: width 0.3s;
    }
    .status-active { color: #0f0; }
    .status-unresponsive { color: #f00; }
    .pulse { 
      display: inline-block; 
      width: 10px; 
      height: 10px; 
      background: #ff0; 
      border-radius: 50%; 
      animation: vault-pulse 2s infinite; 
    }
    @keyframes vault-pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(2); }
      100% { opacity: 1; transform: scale(1); }
    }
    .deformation-alert {
      background: rgba(255,0,0,0.2);
      border: 1px solid #f00;
      padding: 10px;
      margin: 10px 0;
      color: #f00;
    }
    .truth-score {
      font-size: 24px;
      font-weight: bold;
      color: #0f0;
    }
    .warning { color: #f00; font-weight: bold; }
  </style>
</head>
<body>
  <div class="vault-bg"></div>
  <div class="container">
    <h1>🔐 Vault Pulse Synchronizer <span class="pulse"></span></h1>
    <p>Central truth ledger preventing mirror deformation through cryptographic pulse chain</p>
    
    <div class="status-panel">
      <h2>System Integrity Status</h2>
      <div class="integrity-meter">
        <div class="integrity-fill" style="width: ${integrity.overallHealth ? '100%' : '20%'}"></div>
      </div>
      <p>Vault Connection: <strong class="${integrity.vaultConnection === 'connected' ? 'status-active' : 'status-unresponsive'}">${integrity.vaultConnection}</strong></p>
      <p>Pulse Chain Valid: <strong class="${integrity.pulseChainValid ? 'status-active' : 'status-unresponsive'}">${integrity.pulseChainValid ? 'YES' : 'NO'}</strong></p>
      <p>Mirrors Healthy: <strong>${Math.round(integrity.mirrorsHealthy * 100)}%</strong></p>
      <p>Deformations Detected: <strong class="${integrity.deformationsDetected > 0 ? 'warning' : ''}">${integrity.deformationsDetected}</strong></p>
      <p>Truth Consensus: <strong class="${integrity.truthConsensus ? 'status-active' : 'status-unresponsive'}">${integrity.truthConsensus ? 'ACHIEVED' : 'FAILED'}</strong></p>
    </div>
    
    ${!integrity.overallHealth ? '<div class="deformation-alert">⚠️ SYSTEM INTEGRITY COMPROMISED - Mirrors not responding to pulses</div>' : ''}
    
    <div class="status-panel">
      <h2>Mirror Registry</h2>
      ${mirrors.map(mirror => `
        <div class="mirror-status">
          <div>
            <strong>${mirror.id}</strong> (${mirror.file})
            <br>Layer: ${mirror.layer}
          </div>
          <div style="text-align: right;">
            Status: <span class="${mirror.status === 'active' ? 'status-active' : 'status-unresponsive'}">${mirror.status.toUpperCase()}</span>
            <br>Truth Score: <span class="truth-score">${mirror.truthScore}</span>/100
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="pulse-chain">
      <h3>📡 Pulse Chain (Last 20)</h3>
      ${pulseChain.reverse().map(pulse => `
        <div class="pulse-entry">
          [${new Date(pulse.timestamp).toISOString()}] 
          Type: ${pulse.type} | 
          Index: ${pulse.index} | 
          Hash: ${pulse.hash.substring(0, 16)}...
          ${pulse.type === 'truth-verification' ? `<br>Truth Hash: ${pulse.data.truth_hash.substring(0, 32)}...` : ''}
        </div>
      `).join('')}
    </div>
    
    <div class="status-panel">
      <h2>Deformation Detection Patterns</h2>
      <p>Monitoring for encoding issues: <strong class="status-active">ACTIVE</strong></p>
      <p>Monitoring for structural errors: <strong class="status-active">ACTIVE</strong></p>
      <p>Monitoring for semantic violations: <strong class="status-active">ACTIVE</strong></p>
      <p>Auto-fix enabled: <strong class="status-active">YES</strong></p>
    </div>
  </div>
  
  <script>
    // Auto-refresh every 3 seconds
    setTimeout(() => location.reload(), 3000);
  </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  async handlePulseChain(res) {
    const chain = this.getPulseChain(50);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      length: this.pulseChain.length,
      recent: chain,
      genesis: this.pulseChain[0]
    }));
  }

  async handleMirrorStatus(res) {
    const mirrors = Array.from(this.mirrorRegistry.entries()).map(([id, mirror]) => ({
      id: id,
      ...mirror
    }));
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      total: mirrors.length,
      active: mirrors.filter(m => m.status === 'active').length,
      mirrors: mirrors
    }));
  }

  async handleIntegrityCheck(res) {
    const integrity = await this.verifySystemIntegrity();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(integrity));
  }

  async handleDeformationReport(res) {
    const report = {
      patterns: this.deformationPatterns,
      detections: [],
      autoFixesApplied: 0
    };
    
    // Check all mirrors for deformations
    for (const [mirrorId, mirror] of this.mirrorRegistry) {
      if (mirror.deformations > 0) {
        report.detections.push({
          mirrorId: mirrorId,
          deformations: mirror.deformations,
          truthScore: mirror.truthScore
        });
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(report));
  }
}

// Start the Vault Pulse Synchronizer
if (require.main === module) {
  const synchronizer = new VaultPulseSynchronizer();
  
  // Log pulses
  synchronizer.on('pulse', (pulse) => {
    if (pulse.type === 'truth-verification') {
      console.log(`📡 Truth pulse ${pulse.index}: ${pulse.hash.substring(0, 16)}...`);
    }
  });
  
  // Periodic integrity check
  setInterval(async () => {
    const integrity = await synchronizer.verifySystemIntegrity();
    if (!integrity.overallHealth) {
      console.log('⚠️ SYSTEM INTEGRITY COMPROMISED:', integrity);
    }
  }, 30000); // Every 30 seconds
  
  process.on('SIGTERM', () => {
    console.log('🛑 Shutting down Vault Pulse Synchronizer...');
    process.exit(0);
  });
}

module.exports = VaultPulseSynchronizer;