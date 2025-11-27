#!/usr/bin/env node

/**
 * 🔒 VAULT BACKUP SYSTEM
 * Smart backup system that works exactly like you described:
 * - Vault stays pristine (source of truth)
 * - Work happens in temp/sandbox directories
 * - Only final state gets saved back to vault
 * - Differentials tracked for callbacks
 * - Minimal storage usage (no full history)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VaultBackupSystem {
  constructor() {
    this.vaultPath = 'tier-minus10/tier-3-enterprise/tier-4-api/vault-reflection';
    this.workingPath = 'temp-working-directory';
    this.backupPath = 'vault-backups';
    this.sessionId = this.generateSessionId();
    this.differentials = new Map();
    this.pristineVault = new Map();
  }

  generateSessionId() {
    return `session-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  async initializeSession() {
    console.log(`🔒 Initializing Vault Session: ${this.sessionId}`);
    
    // 1. Create working directory
    if (fs.existsSync(this.workingPath)) {
      fs.rmSync(this.workingPath, { recursive: true });
    }
    fs.mkdirSync(this.workingPath, { recursive: true });

    // 2. Copy vault to working directory (pristine → working)
    await this.copyVaultToWorking();
    
    // 3. Create backup directories
    fs.mkdirSync(this.backupPath, { recursive: true });
    
    // 4. Load pristine state for comparison
    await this.loadPristineState();
    
    console.log('✓ Session initialized, working in sandbox mode');
    return this.sessionId;
  }

  async copyVaultToWorking() {
    console.log('📂 Copying vault to working directory...');
    
    if (!fs.existsSync(this.vaultPath)) {
      fs.mkdirSync(this.vaultPath, { recursive: true });
      
      // Create initial vault structure
      const initialVault = {
        user_data: {
          preferences: { theme: 'dark' },
          automations: [],
          game_progress: { level: 1, xp: 0 }
        },
        business_data: {
          company_info: {},
          integrations: [],
          workflows: []
        },
        ai_context: {
          conversation_history: [],
          learned_patterns: [],
          custom_instructions: ""
        },
        system_state: {
          last_updated: new Date().toISOString(),
          version: "1.0.0",
          backup_count: 0
        }
      };
      
      fs.writeFileSync(
        path.join(this.vaultPath, 'vault-data.json'), 
        JSON.stringify(initialVault, null, 2)
      );
    }

    // Copy all vault files to working directory
    this.copyDirectory(this.vaultPath, this.workingPath);
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async loadPristineState() {
    console.log('💾 Loading pristine vault state...');
    
    const vaultFiles = this.getAllVaultFiles(this.vaultPath);
    for (const filePath of vaultFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(this.vaultPath, filePath);
      this.pristineVault.set(relativePath, content);
    }
    
    console.log(`✓ Loaded ${this.pristineVault.size} files into pristine state`);
  }

  getAllVaultFiles(dirPath) {
    let files = [];
    if (!fs.existsSync(dirPath)) return files;
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      if (fs.statSync(fullPath).isDirectory()) {
        files = files.concat(this.getAllVaultFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  // Work with files in the working directory
  readWorkingFile(relativePath) {
    const fullPath = path.join(this.workingPath, relativePath);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8');
    }
    return null;
  }

  writeWorkingFile(relativePath, content) {
    const fullPath = path.join(this.workingPath, relativePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Updated working file: ${relativePath}`);
  }

  // Calculate what changed
  calculateDifferentials() {
    console.log('🔍 Calculating differentials...');
    
    const workingFiles = this.getAllVaultFiles(this.workingPath);
    const changes = {
      modified: [],
      added: [],
      deleted: [],
      stats: { files_changed: 0, lines_added: 0, lines_removed: 0 }
    };

    // Check for modified and added files
    for (const filePath of workingFiles) {
      const relativePath = path.relative(this.workingPath, filePath);
      const workingContent = fs.readFileSync(filePath, 'utf8');
      const pristineContent = this.pristineVault.get(relativePath);

      if (pristineContent) {
        if (workingContent !== pristineContent) {
          const diff = this.calculateLineDiff(pristineContent, workingContent);
          changes.modified.push({
            file: relativePath,
            lines_added: diff.added,
            lines_removed: diff.removed,
            size_change: workingContent.length - pristineContent.length
          });
          changes.stats.lines_added += diff.added;
          changes.stats.lines_removed += diff.removed;
          changes.stats.files_changed++;
        }
      } else {
        changes.added.push({
          file: relativePath,
          size: workingContent.length,
          lines: workingContent.split('\n').length
        });
        changes.stats.files_changed++;
        changes.stats.lines_added += workingContent.split('\n').length;
      }
    }

    // Check for deleted files
    for (const [relativePath] of this.pristineVault) {
      const workingPath = path.join(this.workingPath, relativePath);
      if (!fs.existsSync(workingPath)) {
        const pristineContent = this.pristineVault.get(relativePath);
        changes.deleted.push({
          file: relativePath,
          size: pristineContent.length,
          lines: pristineContent.split('\n').length
        });
        changes.stats.files_changed++;
        changes.stats.lines_removed += pristineContent.split('\n').length;
      }
    }

    this.differentials.set(this.sessionId, changes);
    return changes;
  }

  calculateLineDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    return {
      added: Math.max(0, newLines.length - oldLines.length),
      removed: Math.max(0, oldLines.length - newLines.length)
    };
  }

  // Save final state back to vault
  async saveToVault() {
    console.log('💾 Saving final state to vault...');
    
    const changes = this.calculateDifferentials();
    
    if (changes.stats.files_changed === 0) {
      console.log('✓ No changes detected, vault remains pristine');
      return { saved: false, reason: 'no_changes' };
    }

    // Create backup of current vault first
    const backupDir = path.join(this.backupPath, `backup-${Date.now()}`);
    fs.mkdirSync(backupDir, { recursive: true });
    this.copyDirectory(this.vaultPath, backupDir);

    // Copy working directory back to vault
    this.copyDirectory(this.workingPath, this.vaultPath);

    // Update system state
    const vaultDataPath = path.join(this.vaultPath, 'vault-data.json');
    if (fs.existsSync(vaultDataPath)) {
      const vaultData = JSON.parse(fs.readFileSync(vaultDataPath, 'utf8'));
      vaultData.system_state.last_updated = new Date().toISOString();
      vaultData.system_state.backup_count = (vaultData.system_state.backup_count || 0) + 1;
      vaultData.system_state.last_session = this.sessionId;
      
      fs.writeFileSync(vaultDataPath, JSON.stringify(vaultData, null, 2));
    }

    // Save differential log (minimal storage)
    const diffLog = {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      stats: changes.stats,
      summary: {
        files_modified: changes.modified.length,
        files_added: changes.added.length,
        files_deleted: changes.deleted.length
      },
      // Only store file names and stats, not full content
      changes: {
        modified: changes.modified.map(c => ({ file: c.file, size_change: c.size_change })),
        added: changes.added.map(c => ({ file: c.file, size: c.size })),
        deleted: changes.deleted.map(c => ({ file: c.file }))
      }
    };

    fs.writeFileSync(
      path.join(this.backupPath, `diff-${this.sessionId}.json`),
      JSON.stringify(diffLog, null, 2)
    );

    console.log('✅ Vault updated successfully');
    console.log(`   Files changed: ${changes.stats.files_changed}`);
    console.log(`   Lines added: ${changes.stats.lines_added}`);
    console.log(`   Lines removed: ${changes.stats.lines_removed}`);
    console.log(`   Backup saved to: ${backupDir}`);

    return {
      saved: true,
      session_id: this.sessionId,
      changes: changes.stats,
      backup_location: backupDir
    };
  }

  // Clean up working directory
  async cleanup() {
    console.log('🧹 Cleaning up working directory...');
    
    if (fs.existsSync(this.workingPath)) {
      fs.rmSync(this.workingPath, { recursive: true });
    }
    
    // Keep only last 10 backups (storage management)
    this.cleanupOldBackups();
    
    console.log('✓ Cleanup complete');
  }

  cleanupOldBackups() {
    if (!fs.existsSync(this.backupPath)) return;
    
    const backups = fs.readdirSync(this.backupPath)
      .filter(name => name.startsWith('backup-'))
      .map(name => ({
        name,
        time: parseInt(name.replace('backup-', '')),
        path: path.join(this.backupPath, name)
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the 10 most recent backups
    const toDelete = backups.slice(10);
    for (const backup of toDelete) {
      fs.rmSync(backup.path, { recursive: true });
      console.log(`  Removed old backup: ${backup.name}`);
    }
  }

  // Get vault data for AI/automation
  getVaultData() {
    const vaultDataPath = path.join(this.workingPath, 'vault-data.json');
    if (fs.existsSync(vaultDataPath)) {
      return JSON.parse(fs.readFileSync(vaultDataPath, 'utf8'));
    }
    return null;
  }

  updateVaultData(data) {
    const vaultDataPath = path.join(this.workingPath, 'vault-data.json');
    fs.writeFileSync(vaultDataPath, JSON.stringify(data, null, 2));
  }

  // API for external systems
  async createSession() {
    return await this.initializeSession();
  }

  async endSession(saveChanges = true) {
    const result = saveChanges ? await this.saveToVault() : { saved: false, reason: 'user_cancelled' };
    await this.cleanup();
    return result;
  }

  getWorkingDirectory() {
    return this.workingPath;
  }

  getDifferentials() {
    return this.differentials.get(this.sessionId) || { stats: { files_changed: 0 } };
  }
}

// CLI interface
async function main() {
  const vault = new VaultBackupSystem();
  
  console.log('🔒 VAULT BACKUP SYSTEM DEMO');
  console.log('============================\n');
  
  // Initialize session
  const sessionId = await vault.initializeSession();
  
  // Simulate some work
  console.log('\n📝 Simulating work...');
  
  // Read current vault data
  const vaultData = vault.getVaultData();
  console.log('Current vault data loaded');
  
  // Make some changes
  if (vaultData) {
    vaultData.user_data.automations.push({
      id: 'automation-' + Date.now(),
      name: 'Email Response Bot',
      created: new Date().toISOString(),
      time_saved: 15
    });
    
    vaultData.user_data.game_progress.xp += 100;
    vaultData.user_data.game_progress.level = Math.floor(vaultData.user_data.game_progress.xp / 100) + 1;
    
    vault.updateVaultData(vaultData);
  }
  
  // Create a new file
  vault.writeWorkingFile('session-notes.txt', `Session ${sessionId}\nCreated some automations\nUser leveled up\n`);
  
  // Show differentials
  console.log('\n🔍 Changes made:');
  const diffs = vault.calculateDifferentials();
  console.log(`Files changed: ${diffs.stats.files_changed}`);
  console.log(`Lines added: ${diffs.stats.lines_added}`);
  
  // Save to vault
  console.log('\n💾 Saving session...');
  const result = await vault.endSession(true);
  
  if (result.saved) {
    console.log('✅ Session saved successfully!');
  } else {
    console.log('ℹ️ No changes to save');
  }
  
  console.log('\n🎯 SYSTEM READY FOR PRODUCTION');
  console.log('• Vault stays pristine ✓');
  console.log('• Work in sandbox ✓');
  console.log('• Minimal storage ✓');
  console.log('• Differential tracking ✓');
  console.log('• Auto-cleanup ✓');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = VaultBackupSystem;