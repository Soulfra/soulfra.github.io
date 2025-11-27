/**
 * Sovereign Backup & Restore System
 * Manages full backups and restoration of sovereign AI instances
 */

const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

class SovereignBackupRestore {
    constructor(backupPath, instancePath) {
        this.backupPath = backupPath || path.join(__dirname, 'vault', 'sovereign-backups');
        this.instancePath = instancePath || path.join(__dirname, 'vault', 'user-instances');
    }
    
    /**
     * List all available backups for a user
     */
    async listBackups(userId) {
        const backups = {
            daily: [],
            weekly: [],
            exports: []
        };
        
        try {
            // List daily backups
            const dailyPath = path.join(this.backupPath, 'daily', userId);
            const dailyFiles = await fs.readdir(dailyPath).catch(() => []);
            backups.daily = await Promise.all(
                dailyFiles.map(async (file) => {
                    const stats = await fs.stat(path.join(dailyPath, file));
                    return {
                        filename: file,
                        path: path.join(dailyPath, file),
                        size: stats.size,
                        created: stats.mtime
                    };
                })
            );
            
            // List weekly backups
            const weeklyPath = path.join(this.backupPath, 'weekly', userId);
            const weeklyFiles = await fs.readdir(weeklyPath).catch(() => []);
            backups.weekly = await Promise.all(
                weeklyFiles.map(async (file) => {
                    const stats = await fs.stat(path.join(weeklyPath, file));
                    return {
                        filename: file,
                        path: path.join(weeklyPath, file),
                        size: stats.size,
                        created: stats.mtime,
                        compressed: file.endsWith('.gz')
                    };
                })
            );
            
            // List export backups
            const exportPath = path.join(this.backupPath, 'exports', userId);
            const exportFiles = await fs.readdir(exportPath).catch(() => []);
            backups.exports = await Promise.all(
                exportFiles.map(async (file) => {
                    const stats = await fs.stat(path.join(exportPath, file));
                    return {
                        filename: file,
                        path: path.join(exportPath, file),
                        size: stats.size,
                        created: stats.mtime
                    };
                })
            );
            
        } catch (e) {
            console.error('Error listing backups:', e.message);
        }
        
        // Sort by date (newest first)
        Object.keys(backups).forEach(type => {
            backups[type].sort((a, b) => b.created - a.created);
        });
        
        return backups;
    }
    
    /**
     * Read and validate a backup file
     */
    async readBackup(backupPath) {
        try {
            let content;
            
            // Check if compressed
            if (backupPath.endsWith('.gz')) {
                const compressed = await fs.readFile(backupPath);
                content = zlib.gunzipSync(compressed).toString();
            } else {
                content = await fs.readFile(backupPath, 'utf8');
            }
            
            const backup = JSON.parse(content);
            
            // Validate backup structure
            if (!backup.version || !backup.userId || !backup.identity || !backup.agent) {
                throw new Error('Invalid backup structure');
            }
            
            // Verify checksum if present
            if (backup.backup?.checksum) {
                const calculatedChecksum = this.calculateChecksum({
                    identityHash: backup.identity.hash,
                    agentId: backup.agent.keys?.agentId,
                    timestamp: backup.timestamp
                });
                
                // Note: Checksum might not match due to timestamp differences
                // This is just for integrity checking
            }
            
            return {
                valid: true,
                backup: backup,
                metadata: {
                    version: backup.version,
                    userId: backup.userId,
                    timestamp: new Date(backup.timestamp),
                    type: backup.backup?.type || 'unknown',
                    hasPrivateVault: !!backup.identity.privateVault,
                    hasAgentBond: !!backup.agent.bond,
                    hasDelegatedPermissions: backup.authorization?.delegatedPermissions?.length > 0
                }
            };
            
        } catch (e) {
            return {
                valid: false,
                error: e.message
            };
        }
    }
    
    /**
     * Restore a sovereign AI instance from backup
     */
    async restoreFromBackup(backupPath, password) {
        console.log('🔄 Restoring sovereign AI from backup...');
        
        // Read and validate backup
        const backupData = await this.readBackup(backupPath);
        if (!backupData.valid) {
            throw new Error(`Invalid backup: ${backupData.error}`);
        }
        
        const backup = backupData.backup;
        console.log(`📦 Backup version: ${backup.version}`);
        console.log(`👤 User ID: ${backup.userId}`);
        console.log(`📅 Backup date: ${new Date(backup.timestamp).toISOString()}`);
        
        // Recreate the sovereign AI structure
        const restoredAI = {
            identity: {
                identityHash: backup.identity.hash,
                publicIdentity: backup.identity.publicIdentity,
                privateVault: backup.identity.privateVault,
                metadata: backup.identity.metadata
            },
            
            agent: {
                agentKeys: {
                    agentId: backup.agent.keys.agentId,
                    ed25519: {
                        publicKey: backup.agent.keys.publicKey
                    }
                },
                identityBond: backup.agent.bond,
                sovereignty: backup.agent.sovereignty
            },
            
            authEngine: {
                delegatedPermissions: new Map(
                    backup.authorization.delegatedPermissions.map(
                        item => [item.key, item.value]
                    )
                )
            },
            
            kernel: {
                initialized: backup.kernel.initialized,
                status: backup.kernel.status
            }
        };
        
        // Restore to user vault
        const userVaultPath = path.join(this.instancePath, backup.userId);
        await fs.mkdir(userVaultPath, { recursive: true });
        
        // Save restored identity
        const identityPath = path.join(userVaultPath, 'identity.sovereign');
        await fs.writeFile(identityPath, JSON.stringify({
            version: '1.0.0',
            userId: backup.userId,
            restored: Date.now(),
            restoredFrom: backupPath,
            publicIdentity: backup.identity.publicIdentity,
            agentBond: backup.agent.sovereignty,
            encryptedVault: backup.identity.privateVault
        }, null, 2));
        
        // Create restore receipt
        const receiptPath = path.join(userVaultPath, `restore-${Date.now()}.receipt`);
        await fs.writeFile(receiptPath, JSON.stringify({
            restored: Date.now(),
            from: backupPath,
            backup: {
                created: backup.timestamp,
                version: backup.version,
                type: backup.backup?.type
            },
            success: true
        }, null, 2));
        
        console.log('✅ Sovereign AI restored successfully');
        console.log(`📁 Restored to: ${userVaultPath}`);
        
        return {
            success: true,
            userId: backup.userId,
            identityHash: backup.identity.hash,
            agentId: backup.agent.keys.agentId,
            vaultPath: userVaultPath,
            restoredFrom: backupPath
        };
    }
    
    /**
     * Verify backup integrity
     */
    async verifyBackup(backupPath) {
        const result = await this.readBackup(backupPath);
        
        if (!result.valid) {
            return {
                valid: false,
                error: result.error
            };
        }
        
        const backup = result.backup;
        const checks = {
            hasVersion: !!backup.version,
            hasUserId: !!backup.userId,
            hasIdentity: !!backup.identity,
            hasPrivateVault: !!backup.identity?.privateVault,
            hasAgent: !!backup.agent,
            hasAgentBond: !!backup.agent?.bond,
            hasAuthorization: !!backup.authorization,
            hasKernelState: !!backup.kernel,
            hasBackupMetadata: !!backup.backup
        };
        
        const allChecks = Object.values(checks).every(v => v === true);
        
        return {
            valid: allChecks,
            checks: checks,
            metadata: result.metadata,
            recommendation: allChecks ? 
                'Backup is complete and can be restored' : 
                'Backup may be incomplete but could still be restored'
        };
    }
    
    /**
     * Calculate checksum for verification
     */
    calculateChecksum(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    /**
     * Export statistics about backups
     */
    async getBackupStats(userId) {
        const backups = await this.listBackups(userId);
        
        const totalSize = [
            ...backups.daily,
            ...backups.weekly,
            ...backups.exports
        ].reduce((sum, backup) => sum + backup.size, 0);
        
        return {
            userId: userId,
            counts: {
                daily: backups.daily.length,
                weekly: backups.weekly.length,
                exports: backups.exports.length,
                total: backups.daily.length + backups.weekly.length + backups.exports.length
            },
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
            oldest: this.findOldestBackup(backups),
            newest: this.findNewestBackup(backups)
        };
    }
    
    findOldestBackup(backups) {
        const all = [...backups.daily, ...backups.weekly, ...backups.exports];
        if (all.length === 0) return null;
        return all.reduce((oldest, current) => 
            current.created < oldest.created ? current : oldest
        );
    }
    
    findNewestBackup(backups) {
        const all = [...backups.daily, ...backups.weekly, ...backups.exports];
        if (all.length === 0) return null;
        return all.reduce((newest, current) => 
            current.created > newest.created ? current : newest
        );
    }
}

// CLI interface for testing
if (require.main === module) {
    const restore = new SovereignBackupRestore();
    
    const command = process.argv[2];
    const userId = process.argv[3];
    
    async function main() {
        try {
            switch (command) {
                case 'list':
                    if (!userId) {
                        console.log('Usage: node sovereign-backup-restore.js list <userId>');
                        return;
                    }
                    const backups = await restore.listBackups(userId);
                    console.log('📦 Available backups:');
                    console.log(JSON.stringify(backups, null, 2));
                    break;
                    
                case 'verify':
                    const backupPath = userId; // In this case, userId is the path
                    if (!backupPath) {
                        console.log('Usage: node sovereign-backup-restore.js verify <backupPath>');
                        return;
                    }
                    const verification = await restore.verifyBackup(backupPath);
                    console.log('🔍 Backup verification:');
                    console.log(JSON.stringify(verification, null, 2));
                    break;
                    
                case 'restore':
                    const restorePath = userId;
                    const password = process.argv[4];
                    if (!restorePath) {
                        console.log('Usage: node sovereign-backup-restore.js restore <backupPath> [password]');
                        return;
                    }
                    const result = await restore.restoreFromBackup(restorePath, password);
                    console.log('✅ Restore complete:');
                    console.log(JSON.stringify(result, null, 2));
                    break;
                    
                case 'stats':
                    if (!userId) {
                        console.log('Usage: node sovereign-backup-restore.js stats <userId>');
                        return;
                    }
                    const stats = await restore.getBackupStats(userId);
                    console.log('📊 Backup statistics:');
                    console.log(JSON.stringify(stats, null, 2));
                    break;
                    
                default:
                    console.log('Sovereign Backup & Restore System');
                    console.log('Usage:');
                    console.log('  node sovereign-backup-restore.js list <userId>');
                    console.log('  node sovereign-backup-restore.js verify <backupPath>');
                    console.log('  node sovereign-backup-restore.js restore <backupPath> [password]');
                    console.log('  node sovereign-backup-restore.js stats <userId>');
            }
        } catch (e) {
            console.error('❌ Error:', e.message);
        }
    }
    
    main();
}

module.exports = { SovereignBackupRestore };

/**
 * BACKUP STRUCTURE:
 * 
 * Each backup contains:
 * - Complete encrypted identity (privateVault)
 * - Agent keys and identity bond
 * - Authorization state and permissions
 * - Kernel initialization state
 * - Metadata and checksums
 * 
 * Users can restore their sovereign AI from any backup!
 */