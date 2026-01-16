#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class GenomeWatcher extends EventEmitter {
  constructor() {
    super();
    this.genomePath = path.join(__dirname, 'genome.json');
    this.backupPath = path.join(__dirname, '.genome.backup.json');
    this.lockPath = path.join(__dirname, '.genome.lock');
    this.alertPath = path.join(__dirname, '.genome-alerts.log');
    
    this.lastChecksum = null;
    this.watchTimer = null;
    this.alertCount = 0;
    this.maxAlerts = 100;
    
    this.isWatching = false;
    this.checkInterval = 1000; // Check every second
    
    console.log('[GENOME WATCHER] Initializing...');
  }

  // Start watching the genome file
  async startWatching() {
    if (this.isWatching) {
      console.log('[GENOME WATCHER] Already watching');
      return;
    }

    console.log('[GENOME WATCHER] Starting file system watch...');
    
    // Calculate initial checksum
    await this.updateChecksum();
    
    // Start file system watcher
    this.fsWatcher = fs.watch(this.genomePath, { persistent: true }, (eventType, filename) => {
      if (eventType === 'change') {
        this.handleFileChange();
      }
    });

    // Start periodic integrity checks
    this.watchTimer = setInterval(() => {
      this.performIntegrityCheck();
    }, this.checkInterval);

    this.isWatching = true;
    console.log('[GENOME WATCHER] Watching genome for unauthorized changes');
    
    this.emit('watchStarted');
  }

  // Stop watching
  stopWatching() {
    if (!this.isWatching) return;

    if (this.fsWatcher) {
      this.fsWatcher.close();
    }

    if (this.watchTimer) {
      clearInterval(this.watchTimer);
    }

    this.isWatching = false;
    console.log('[GENOME WATCHER] Stopped watching');
    
    this.emit('watchStopped');
  }

  // Handle file change event
  async handleFileChange() {
    // Small delay to ensure file write is complete
    setTimeout(() => {
      this.performIntegrityCheck();
    }, 100);
  }

  // Perform integrity check
  async performIntegrityCheck() {
    try {
      // Skip if file is locked (legitimate write in progress)
      if (fs.existsSync(this.lockPath)) {
        return;
      }

      const currentChecksum = await this.calculateFileChecksum();
      
      if (currentChecksum !== this.lastChecksum) {
        console.log('[GENOME WATCHER] File change detected');
        
        // Validate the change
        const isAuthorized = await this.validateChange();
        
        if (!isAuthorized) {
          await this.handleUnauthorizedChange();
        } else {
          console.log('[GENOME WATCHER] Authorized change detected');
          this.lastChecksum = currentChecksum;
          this.emit('authorizedChange', { checksum: currentChecksum });
        }
      }
    } catch (error) {
      console.error('[GENOME WATCHER] Error during integrity check:', error);
      await this.sendAlert('INTEGRITY_CHECK_ERROR', error.message);
    }
  }

  // Calculate file checksum
  async calculateFileChecksum() {
    try {
      const data = fs.readFileSync(this.genomePath, 'utf8');
      const genome = JSON.parse(data);
      
      // Remove dynamic fields for consistent checksum
      const copy = JSON.parse(JSON.stringify(genome));
      delete copy.checksum;
      delete copy.lastModified;
      delete copy.mutations?.history;
      
      const hash = crypto.createHash('sha256');
      hash.update(JSON.stringify(copy, null, 2));
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to calculate checksum: ${error.message}`);
    }
  }

  // Update stored checksum
  async updateChecksum() {
    this.lastChecksum = await this.calculateFileChecksum();
    console.log('[GENOME WATCHER] Updated checksum:', this.lastChecksum);
  }

  // Validate if change is authorized
  async validateChange() {
    try {
      const data = fs.readFileSync(this.genomePath, 'utf8');
      const genome = JSON.parse(data);
      
      // Check if change has proper mutation history
      const recentMutations = genome.mutations?.history || [];
      if (recentMutations.length === 0) {
        return false; // No mutation history = unauthorized
      }

      const lastMutation = recentMutations[0];
      const timeDiff = Date.now() - new Date(lastMutation.timestamp).getTime();
      
      // Recent mutation within last 10 seconds is likely authorized
      if (timeDiff < 10000 && lastMutation.status === 'APPLIED') {
        return true;
      }

      // Check if mutation was made by authorized modifier
      const authorizedModifiers = ['whisper', 'soulkey', 'founder-override', 'cal-riven-authority'];
      return authorizedModifiers.includes(lastMutation.modifier);
      
    } catch (error) {
      console.error('[GENOME WATCHER] Error validating change:', error);
      return false; // Assume unauthorized on error
    }
  }

  // Handle unauthorized change
  async handleUnauthorizedChange() {
    console.error('[GENOME WATCHER] ⚠️  UNAUTHORIZED MODIFICATION DETECTED!');
    
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'UNAUTHORIZED_MODIFICATION',
      action: 'REVERT_INITIATED',
      checksum: await this.calculateFileChecksum()
    };

    // Send alert
    await this.sendAlert(alert.type, 'Genome modification without proper authorization');
    
    // Attempt to revert
    const reverted = await this.revertToBackup();
    
    if (reverted) {
      console.log('[GENOME WATCHER] ✅ Successfully reverted unauthorized changes');
      alert.action = 'REVERTED';
      await this.updateChecksum();
    } else {
      console.error('[GENOME WATCHER] ❌ Failed to revert changes - CRITICAL ALERT');
      alert.action = 'REVERT_FAILED';
      await this.sendCriticalAlert();
    }

    this.emit('unauthorizedChange', alert);
  }

  // Revert to backup
  async revertToBackup() {
    try {
      if (!fs.existsSync(this.backupPath)) {
        console.error('[GENOME WATCHER] No backup found');
        return false;
      }

      const backupData = fs.readFileSync(this.backupPath, 'utf8');
      
      // Validate backup
      JSON.parse(backupData); // Will throw if invalid JSON
      
      // Create lock during revert
      fs.writeFileSync(this.lockPath, 'WATCHER_REVERT');
      
      // Restore from backup
      fs.writeFileSync(this.genomePath, backupData);
      
      // Remove lock
      fs.unlinkSync(this.lockPath);
      
      return true;
    } catch (error) {
      console.error('[GENOME WATCHER] Failed to revert:', error);
      
      // Clean up lock on failure
      if (fs.existsSync(this.lockPath)) {
        fs.unlinkSync(this.lockPath);
      }
      
      return false;
    }
  }

  // Send alert
  async sendAlert(type, message) {
    const alert = {
      timestamp: new Date().toISOString(),
      type,
      message,
      alertCount: ++this.alertCount
    };

    // Log to file
    const logEntry = JSON.stringify(alert) + '\n';
    fs.appendFileSync(this.alertPath, logEntry);

    // Emit event
    this.emit('alert', alert);

    console.error(`[GENOME WATCHER ALERT] ${type}: ${message}`);

    // Trim alert log if too large
    await this.trimAlertLog();
  }

  // Send critical alert
  async sendCriticalAlert() {
    const criticalAlert = {
      timestamp: new Date().toISOString(),
      type: 'CRITICAL_SECURITY_BREACH',
      message: 'Genome integrity compromised - unable to revert unauthorized changes',
      severity: 'CRITICAL',
      recommendedAction: 'IMMEDIATE_MANUAL_INTERVENTION_REQUIRED'
    };

    // Log critical alert
    const logEntry = '🚨 CRITICAL: ' + JSON.stringify(criticalAlert) + '\n';
    fs.appendFileSync(this.alertPath, logEntry);

    // Try to notify external systems
    this.emit('criticalAlert', criticalAlert);

    console.error('🚨 [CRITICAL ALERT] GENOME SECURITY BREACH - MANUAL INTERVENTION REQUIRED');
  }

  // Trim alert log
  async trimAlertLog() {
    try {
      if (!fs.existsSync(this.alertPath)) return;

      const logs = fs.readFileSync(this.alertPath, 'utf8').split('\n').filter(line => line.trim());
      
      if (logs.length > this.maxAlerts) {
        const trimmed = logs.slice(-this.maxAlerts);
        fs.writeFileSync(this.alertPath, trimmed.join('\n') + '\n');
      }
    } catch (error) {
      console.error('[GENOME WATCHER] Error trimming alert log:', error);
    }
  }

  // Get alert history
  getAlertHistory() {
    try {
      if (!fs.existsSync(this.alertPath)) return [];
      
      const logs = fs.readFileSync(this.alertPath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          try {
            return JSON.parse(line.replace(/^🚨 CRITICAL: /, ''));
          } catch {
            return { message: line, timestamp: new Date().toISOString() };
          }
        });
      
      return logs.reverse(); // Most recent first
    } catch (error) {
      console.error('[GENOME WATCHER] Error reading alert history:', error);
      return [];
    }
  }

  // Manual integrity check
  async checkIntegrity() {
    console.log('[GENOME WATCHER] Performing manual integrity check...');
    await this.performIntegrityCheck();
    return this.isWatching;
  }

  // Get status
  getStatus() {
    return {
      isWatching: this.isWatching,
      lastChecksum: this.lastChecksum,
      alertCount: this.alertCount,
      checkInterval: this.checkInterval,
      genomePath: this.genomePath,
      hasBackup: fs.existsSync(this.backupPath)
    };
  }
}

// Export for use as module
module.exports = GenomeWatcher;

// Run if called directly
if (require.main === module) {
  const watcher = new GenomeWatcher();
  
  // Handle events
  watcher.on('alert', (alert) => {
    console.error(`🚨 ALERT: ${alert.type} - ${alert.message}`);
  });
  
  watcher.on('criticalAlert', (alert) => {
    console.error('🚨🚨🚨 CRITICAL SECURITY BREACH 🚨🚨🚨');
  });
  
  watcher.on('unauthorizedChange', (alert) => {
    console.log(`Unauthorized change handled: ${alert.action}`);
  });

  // Start watching
  watcher.startWatching().then(() => {
    console.log('[GENOME WATCHER] Active and monitoring genome integrity');
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log('\n[GENOME WATCHER] Shutting down...');
      watcher.stopWatching();
      process.exit(0);
    });
  }).catch(error => {
    console.error('[GENOME WATCHER] Fatal error:', error);
    process.exit(1);
  });
}