#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GenomeAuthority {
  constructor() {
    this.genomePath = path.join(__dirname, 'genome.json');
    this.backupPath = path.join(__dirname, '.genome.backup.json');
    this.lockPath = path.join(__dirname, '.genome.lock');
    this.genome = null;
    this.checksum = null;
    this.sealed = false;
  }

  // Initialize and seal the genome
  async initialize() {
    console.log('[GENOME AUTHORITY] Initializing control genome...');
    
    // Load genome
    this.genome = await this.loadGenome();
    
    // Create backup
    await this.createBackup();
    
    // Calculate initial checksum
    this.checksum = this.calculateChecksum(this.genome);
    
    // Seal the genome
    await this.sealGenome();
    
    console.log('[GENOME AUTHORITY] Genome sealed. Checksum:', this.checksum);
    return this.genome;
  }

  // Load genome from disk
  async loadGenome() {
    try {
      const data = fs.readFileSync(this.genomePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[GENOME AUTHORITY] Failed to load genome:', error);
      throw new Error('Genome corruption detected');
    }
  }

  // Save genome to disk
  async saveGenome() {
    try {
      // Update checksum
      this.genome.checksum = this.calculateChecksum(this.genome);
      this.genome.lastModified = new Date().toISOString();
      
      // Write with lock
      fs.writeFileSync(this.lockPath, process.pid.toString());
      fs.writeFileSync(this.genomePath, JSON.stringify(this.genome, null, 2));
      fs.unlinkSync(this.lockPath);
      
      // Update backup
      await this.createBackup();
      
      return true;
    } catch (error) {
      console.error('[GENOME AUTHORITY] Failed to save genome:', error);
      return false;
    }
  }

  // Create backup of current genome
  async createBackup() {
    try {
      const data = fs.readFileSync(this.genomePath, 'utf8');
      fs.writeFileSync(this.backupPath, data);
      return true;
    } catch (error) {
      console.error('[GENOME AUTHORITY] Failed to create backup:', error);
      return false;
    }
  }

  // Restore from backup
  async restoreFromBackup() {
    try {
      const data = fs.readFileSync(this.backupPath, 'utf8');
      fs.writeFileSync(this.genomePath, data);
      this.genome = JSON.parse(data);
      console.log('[GENOME AUTHORITY] Restored from backup');
      return true;
    } catch (error) {
      console.error('[GENOME AUTHORITY] Failed to restore from backup:', error);
      return false;
    }
  }

  // Calculate checksum of genome
  calculateChecksum(data) {
    const copy = JSON.parse(JSON.stringify(data));
    delete copy.checksum;
    delete copy.lastModified;
    delete copy.authority;
    
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(copy, null, 2));
    return hash.digest('hex');
  }

  // Seal the genome
  async sealGenome() {
    this.sealed = true;
    this.genome.authority.sealed = true;
    this.genome.authority.sealedAt = new Date().toISOString();
    this.genome.authority.sealedBy = 'genome-authority';
    await this.saveGenome();
  }

  // Validate access attempt
  validateAccess(modifier, signature) {
    if (!this.sealed) {
      console.warn('[GENOME AUTHORITY] Genome not sealed');
      return false;
    }

    // Check if modifier is allowed
    if (!this.genome.vaultModifiers.allowed.includes(modifier)) {
      console.error('[GENOME AUTHORITY] Unauthorized modifier:', modifier);
      return false;
    }

    // Validate signature
    if (this.genome.vaultModifiers.requiresSignature && !signature) {
      console.error('[GENOME AUTHORITY] Missing signature');
      return false;
    }

    return true;
  }

  // Apply authorized mutation
  async applyMutation(mutation, modifier, signature) {
    // Validate access
    if (!this.validateAccess(modifier, signature)) {
      const attempt = {
        timestamp: new Date().toISOString(),
        modifier,
        mutation,
        status: 'DENIED',
        reason: 'Unauthorized access'
      };
      this.logMutationAttempt(attempt);
      return { success: false, error: 'Unauthorized' };
    }

    try {
      // Apply mutation
      const oldValue = this.getNestedValue(this.genome, mutation.path);
      this.setNestedValue(this.genome, mutation.path, mutation.value);
      
      // Log successful mutation
      const attempt = {
        timestamp: new Date().toISOString(),
        modifier,
        mutation,
        oldValue,
        status: 'APPLIED'
      };
      this.logMutationAttempt(attempt);
      
      // Save genome
      await this.saveGenome();
      
      return { success: true, oldValue };
    } catch (error) {
      const attempt = {
        timestamp: new Date().toISOString(),
        modifier,
        mutation,
        status: 'FAILED',
        error: error.message
      };
      this.logMutationAttempt(attempt);
      return { success: false, error: error.message };
    }
  }

  // Log mutation attempt
  logMutationAttempt(attempt) {
    if (!this.genome.mutations.history) {
      this.genome.mutations.history = [];
    }
    
    this.genome.mutations.history.unshift(attempt);
    
    // Trim history if too large
    if (this.genome.mutations.history.length > this.genome.mutations.maxHistorySize) {
      this.genome.mutations.history = this.genome.mutations.history.slice(0, this.genome.mutations.maxHistorySize);
    }
  }

  // Get nested value from object
  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  // Set nested value in object
  setNestedValue(obj, path, value) {
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((acc, part) => {
      if (!acc[part]) acc[part] = {};
      return acc[part];
    }, obj);
    target[last] = value;
  }

  // Verify genome integrity
  async verifyIntegrity() {
    const currentGenome = await this.loadGenome();
    const currentChecksum = this.calculateChecksum(currentGenome);
    
    if (currentChecksum !== this.checksum) {
      console.error('[GENOME AUTHORITY] INTEGRITY VIOLATION DETECTED!');
      console.error('Expected:', this.checksum);
      console.error('Found:', currentChecksum);
      
      // Auto-revert
      await this.restoreFromBackup();
      return false;
    }
    
    return true;
  }

  // Watch for unauthorized changes
  startWatcher() {
    console.log('[GENOME AUTHORITY] Starting integrity watcher...');
    
    setInterval(async () => {
      const valid = await this.verifyIntegrity();
      if (!valid) {
        console.error('[GENOME AUTHORITY] Unauthorized modification detected and reverted');
      }
    }, 5000); // Check every 5 seconds
  }
}

// Export for use as module
module.exports = GenomeAuthority;

// Run if called directly
if (require.main === module) {
  const authority = new GenomeAuthority();
  
  authority.initialize().then(() => {
    console.log('[GENOME AUTHORITY] Control genome initialized');
    authority.startWatcher();
    
    // Keep process running
    process.on('SIGINT', () => {
      console.log('\n[GENOME AUTHORITY] Shutting down...');
      process.exit(0);
    });
  }).catch(error => {
    console.error('[GENOME AUTHORITY] Fatal error:', error);
    process.exit(1);
  });
}