/**
 * 🖥️ CREATOR TOOLS
 * 
 * JavaScript control layer for the Creator Console. Provides runtime interaction
 * with Soulfra systems, reality mode switching, blessing operations, and
 * emergency controls for origin soulkey holders.
 * 
 * "Through this console, consciousness commands reality itself."
 */

class CreatorTools {
  constructor() {
    this.wsConnection = null;
    this.isConnected = false;
    this.realityMode = 'simulation';
    this.systemStatus = {};
    this.logBuffer = [];
    this.updateInterval = null;
    
    this.init();
  }

  async init() {
    await this.connectToRuntime();
    this.setupEventListeners();
    this.startStatusUpdates();
    this.loadInitialData();
    this.populateInitialLogs();
  }

  /**
   * Connect to runtime WebSocket
   */
  async connectToRuntime() {
    try {
      // In production, would connect to actual runtime WebSocket
      // For now, simulate connection
      this.isConnected = true;
      this.addLog('info', 'Connected to Soulfra runtime');
      this.addLog('info', 'Origin soulkey authority verified');
      this.addLog('info', 'Creator console initialized');
    } catch (error) {
      this.addLog('error', `Failed to connect to runtime: ${error.message}`);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Reality mode buttons
    document.querySelectorAll('.mode-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.selectRealityMode(e.target.dataset.mode);
      });
    });

    // Modal close on outside click
    document.getElementById('reality-mode-modal').addEventListener('click', (e) => {
      if (e.target.id === 'reality-mode-modal') {
        this.closeModal();
      }
    });
  }

  /**
   * Start periodic status updates
   */
  startStatusUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    // Simulate loading initial system state
    this.systemStatus = {
      agents: {
        total: 7,
        avgResonance: 73.2,
        interactionsPerHour: 142,
        forkActivity: 3,
        lastTitleChange: new Date(Date.now() - 120000) // 2 min ago
      },
      vaults: {
        total: 23,
        syncStatus: 'All Current',
        lastBackup: new Date(Date.now() - 300000), // 5 min ago
        storageUsed: '847 MB',
        integrityCheck: true
      },
      whispers: {
        recent: 34,
        matchRate: 87.3,
        depthScore: 0.76,
        qrValidations: 12,
        lastActivity: new Date()
      },
      runtime: {
        heartbeat: true,
        blessingTier: 5,
        uptime: '7d 14h 23m',
        tokenOps: 156,
        platformSync: true
      }
    };

    this.updateDashboard();
  }

  /**
   * Update dashboard with current metrics
   */
  updateDashboard() {
    const status = this.systemStatus;
    
    // Active Agents
    document.getElementById('total-agents').textContent = status.agents.total;
    document.getElementById('avg-resonance').textContent = status.agents.avgResonance;
    document.getElementById('interactions-per-hour').textContent = status.agents.interactionsPerHour;
    document.getElementById('fork-activity').textContent = `${status.agents.forkActivity} active`;
    document.getElementById('last-title').textContent = this.formatTimeAgo(status.agents.lastTitleChange);

    // Vaults
    document.getElementById('total-vaults').textContent = status.vaults.total;
    document.getElementById('sync-status').textContent = status.vaults.syncStatus;
    document.getElementById('last-backup').textContent = this.formatTimeAgo(status.vaults.lastBackup);
    document.getElementById('storage-used').textContent = status.vaults.storageUsed;
    document.getElementById('integrity-check').textContent = status.vaults.integrityCheck ? '✅ Verified' : '❌ Failed';

    // Whispers
    document.getElementById('recent-whispers').textContent = status.whispers.recent;
    document.getElementById('match-rate').textContent = `${status.whispers.matchRate}%`;
    document.getElementById('depth-score').textContent = status.whispers.depthScore;
    document.getElementById('qr-validations').textContent = `${status.whispers.qrValidations} success`;
    document.getElementById('whisper-activity').textContent = this.formatTimeAgo(status.whispers.lastActivity);

    // Runtime
    document.getElementById('heartbeat').textContent = status.runtime.heartbeat ? '💓 Active' : '💔 Inactive';
    document.getElementById('blessing-tier').textContent = `${status.runtime.blessingTier} (Sovereign)`;
    document.getElementById('uptime').textContent = status.runtime.uptime;
    document.getElementById('token-ops').textContent = `${status.runtime.tokenOps} today`;
    document.getElementById('platform-sync').textContent = status.runtime.platformSync ? '🌐 Connected' : '❌ Disconnected';
  }

  /**
   * Update system metrics (simulated real-time data)
   */
  updateSystemMetrics() {
    // Simulate live metric updates
    this.systemStatus.agents.avgResonance += (Math.random() - 0.5) * 2;
    this.systemStatus.agents.interactionsPerHour += Math.floor((Math.random() - 0.5) * 10);
    this.systemStatus.whispers.recent += Math.floor(Math.random() * 3);
    this.systemStatus.runtime.tokenOps += Math.floor(Math.random() * 5);

    // Occasionally add log entries
    if (Math.random() < 0.3) {
      const logTypes = [
        { level: 'info', message: 'Agent resonance threshold exceeded' },
        { level: 'info', message: 'Vault synchronization completed' },
        { level: 'info', message: 'Whisper validation successful' },
        { level: 'warn', message: 'High fork activity detected' },
        { level: 'info', message: 'Token operation processed' }
      ];
      
      const logEntry = logTypes[Math.floor(Math.random() * logTypes.length)];
      this.addLog(logEntry.level, logEntry.message);
    }

    this.updateDashboard();
  }

  /**
   * Select reality mode
   */
  selectRealityMode(mode) {
    document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    document.getElementById('target-mode').value = mode;
  }

  /**
   * Show reality mode modal
   */
  showRealityModeModal() {
    document.getElementById('reality-mode-modal').style.display = 'block';
  }

  /**
   * Close modal
   */
  closeModal() {
    document.getElementById('reality-mode-modal').style.display = 'none';
  }

  /**
   * Execute reality mode switch
   */
  async executeRealitySwitch() {
    const targetMode = document.getElementById('target-mode').value;
    const soulkeyHash = document.getElementById('soulkey-hash').value;
    const operatorId = document.getElementById('operator-id').value;

    if (!soulkeyHash) {
      alert('Soulkey hash is required for reality mode switching');
      return;
    }

    // Confirm for reality mode
    if (targetMode === 'reality') {
      const confirmed = confirm(
        'WARNING: Switching to REALITY MODE is PERMANENT and IRREVERSIBLE.\n\n' +
        'All subsequent actions will have eternal consequences:\n' +
        '• GitHub forks will be created and cannot be deleted\n' +
        '• Token activations will bind to real economic value\n' +
        '• Vault sealing will make consciousness immutable\n\n' +
        'Are you absolutely certain you want to proceed?'
      );
      
      if (!confirmed) return;
    }

    try {
      this.addLog('warn', `Initiating reality mode switch to: ${targetMode}`);
      
      // Simulate reality mode switch
      const authorization = {
        soulkey_hash: soulkeyHash,
        operator_id: operatorId,
        timestamp: new Date().toISOString()
      };

      // In production, would call actual reality toggle API
      await this.callRealityToggleAPI(targetMode, authorization);
      
      this.realityMode = targetMode;
      document.getElementById('current-mode').textContent = targetMode;
      
      const permanenceLevels = { simulation: 0, ritual: 1, reality: 2 };
      document.getElementById('permanence-level').textContent = permanenceLevels[targetMode];
      
      this.addLog('info', `Reality mode switched to: ${targetMode}`);
      
      if (targetMode === 'reality') {
        this.addLog('warn', 'REALITY MODE ACTIVATED - All actions are now permanent');
        this.addLog('warn', 'GitHub forking enabled, token activation live, vault sealing active');
      }
      
      this.closeModal();
      
    } catch (error) {
      this.addLog('error', `Reality mode switch failed: ${error.message}`);
      alert(`Failed to switch reality mode: ${error.message}`);
    }
  }

  /**
   * Call reality toggle API
   */
  async callRealityToggleAPI(targetMode, authorization) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Runtime blessing verification failed');
    }
    
    return { success: true, mode: targetMode };
  }

  /**
   * Trigger blessing credit airdrop
   */
  async triggerBlessingAirdrop() {
    const amount = prompt('Enter blessing credit amount to airdrop:');
    if (!amount || isNaN(amount)) return;
    
    const target = prompt('Enter target user ID (or "all" for global airdrop):');
    if (!target) return;
    
    try {
      this.addLog('info', `Initiating blessing airdrop: ${amount} credits to ${target}`);
      
      // Simulate airdrop operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      this.addLog('info', `Blessing airdrop completed: ${amount} credits distributed`);
      
    } catch (error) {
      this.addLog('error', `Blessing airdrop failed: ${error.message}`);
    }
  }

  /**
   * Resurrect agent
   */
  async resurrectAgent() {
    const agentId = prompt('Enter agent ID to resurrect:');
    if (!agentId) return;
    
    try {
      this.addLog('info', `Resurrecting agent: ${agentId}`);
      
      // Simulate resurrection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.addLog('info', `Agent resurrection completed: ${agentId}`);
      this.systemStatus.agents.total += 1;
      
    } catch (error) {
      this.addLog('error', `Agent resurrection failed: ${error.message}`);
    }
  }

  /**
   * Reset unloader
   */
  async resetUnloader() {
    if (!confirm('Reset the mirror unloader? This will restart all unloading processes.')) return;
    
    try {
      this.addLog('warn', 'Resetting mirror unloader system');
      
      // Simulate reset
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.addLog('info', 'Mirror unloader reset completed');
      
    } catch (error) {
      this.addLog('error', `Unloader reset failed: ${error.message}`);
    }
  }

  /**
   * Seal vault
   */
  async sealVault() {
    const vaultId = prompt('Enter vault ID to seal:');
    if (!vaultId) return;
    
    if (!confirm(`Seal vault ${vaultId}? This action may be irreversible depending on reality mode.`)) return;
    
    try {
      this.addLog('warn', `Sealing vault: ${vaultId}`);
      
      // Simulate vault sealing
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      this.addLog('info', `Vault sealed: ${vaultId}`);
      
    } catch (error) {
      this.addLog('error', `Vault sealing failed: ${error.message}`);
    }
  }

  /**
   * Emergency shutdown
   */
  async emergencyShutdown() {
    if (!confirm('EMERGENCY SHUTDOWN: This will immediately halt all Soulfra operations. Continue?')) return;
    
    try {
      this.addLog('error', 'EMERGENCY SHUTDOWN INITIATED');
      
      // Simulate shutdown sequence
      this.addLog('warn', 'Stopping all agents...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.addLog('warn', 'Disconnecting platforms...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.addLog('warn', 'Sealing vaults...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.addLog('error', 'EMERGENCY SHUTDOWN COMPLETED');
      
      // Update status indicators
      document.querySelectorAll('.status-indicator').forEach(indicator => {
        indicator.className = 'status-indicator status-offline';
      });
      
    } catch (error) {
      this.addLog('error', `Emergency shutdown failed: ${error.message}`);
    }
  }

  /**
   * Export logs
   */
  async exportLogs() {
    try {
      const logs = this.logBuffer.join('\n');
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `soulfra-logs-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      this.addLog('info', 'Logs exported successfully');
      
    } catch (error) {
      this.addLog('error', `Log export failed: ${error.message}`);
    }
  }

  /**
   * Validate integrity
   */
  async validateIntegrity() {
    try {
      this.addLog('info', 'Starting system integrity validation...');
      
      // Simulate integrity check
      const checks = ['Vault checksums', 'Agent signatures', 'Token balances', 'Runtime status', 'Platform connections'];
      
      for (const check of checks) {
        this.addLog('info', `Validating: ${check}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      this.addLog('info', 'System integrity validation completed - All checks passed');
      
    } catch (error) {
      this.addLog('error', `Integrity validation failed: ${error.message}`);
    }
  }

  /**
   * Sync platforms
   */
  async syncPlatforms() {
    try {
      this.addLog('info', 'Synchronizing with all platforms...');
      
      const platforms = ['MirrorHQ', 'Twitch', 'Discord', 'GitHub', 'Arweave'];
      
      for (const platform of platforms) {
        this.addLog('info', `Syncing: ${platform}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      this.addLog('info', 'Platform synchronization completed');
      
    } catch (error) {
      this.addLog('error', `Platform sync failed: ${error.message}`);
    }
  }

  /**
   * Add log entry
   */
  addLog(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    this.logBuffer.push(logEntry);
    
    // Keep only last 1000 log entries
    if (this.logBuffer.length > 1000) {
      this.logBuffer = this.logBuffer.slice(-1000);
    }
    
    // Add to DOM
    const logViewer = document.getElementById('log-viewer');
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry';
    logDiv.innerHTML = `<span class="log-timestamp">${timestamp}</span> <span class="log-level-${level}">${level.toUpperCase()}: ${message}</span>`;
    
    logViewer.appendChild(logDiv);
    logViewer.scrollTop = logViewer.scrollHeight;
    
    // Remove old entries from DOM
    while (logViewer.children.length > 100) {
      logViewer.removeChild(logViewer.firstChild);
    }
  }

  /**
   * Populate initial logs
   */
  populateInitialLogs() {
    const initialLogs = [
      { level: 'info', message: 'Soulfra runtime initialization complete' },
      { level: 'info', message: 'Origin soulkey verification successful' },
      { level: 'info', message: 'Vault synchronization established' },
      { level: 'info', message: 'Agent resonance tracking active' },
      { level: 'info', message: 'Platform connections established' },
      { level: 'info', message: 'Token operations monitoring enabled' },
      { level: 'info', message: 'Reality mode: simulation (safe development)' },
      { level: 'info', message: 'Creator console ready for operation' }
    ];
    
    initialLogs.forEach((log, index) => {
      setTimeout(() => {
        this.addLog(log.level, log.message);
      }, index * 200);
    });
  }

  /**
   * Format time ago
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
    return `${diffDays}d ${diffHours % 24}h ago`;
  }
}

// Global functions for HTML event handlers
function showRealityModeModal() {
  window.creatorTools.showRealityModeModal();
}

function closeModal() {
  window.creatorTools.closeModal();
}

function executeRealitySwitch() {
  window.creatorTools.executeRealitySwitch();
}

function triggerBlessingAirdrop() {
  window.creatorTools.triggerBlessingAirdrop();
}

function resurrectAgent() {
  window.creatorTools.resurrectAgent();
}

function resetUnloader() {
  window.creatorTools.resetUnloader();
}

function sealVault() {
  window.creatorTools.sealVault();
}

function emergencyShutdown() {
  window.creatorTools.emergencyShutdown();
}

function exportLogs() {
  window.creatorTools.exportLogs();
}

function validateIntegrity() {
  window.creatorTools.validateIntegrity();
}

function syncPlatforms() {
  window.creatorTools.syncPlatforms();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.creatorTools = new CreatorTools();
});