// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * SymlinkMirrorLayer.js
 * Keeps human and AI runtime folders in sync via symbolic linking
 * Integrates with existing .vault-symlink.json pattern
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class SymlinkMirrorLayer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.rootPath = options.rootPath || __dirname;
        this.configFile = options.configFile || '.symlink-mirror.json';
        this.symlinkFile = path.join(this.rootPath, this.configFile);
        
        this.mirrorPairs = new Map();
        this.watchedDirectories = new Set();
        this.syncing = false;
        
        this.config = {
            auto_sync: true,
            sync_interval: 5000, // 5 seconds
            backup_broken_links: true,
            verify_integrity: true,
            log_changes: true,
            ...options
        };
        
        this.stats = {
            links_created: 0,
            links_updated: 0,
            links_removed: 0,
            sync_operations: 0,
            last_sync: null,
            errors: 0
        };
        
        this.initializeMirrorLayer();
    }

    async initializeMirrorLayer() {
        console.log('🪞 Initializing Symlink Mirror Layer...');
        
        try {
            // Load existing configuration
            await this.loadConfiguration();
            
            // Setup default mirror pairs
            await this.setupDefaultMirrors();
            
            // Verify existing symlinks
            await this.verifySymlinks();
            
            // Start auto-sync if enabled
            if (this.config.auto_sync) {
                this.startAutoSync();
            }
            
            console.log(`✅ Mirror layer initialized: ${this.mirrorPairs.size} pairs configured`);
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Mirror layer initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async loadConfiguration() {
        if (fs.existsSync(this.symlinkFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(this.symlinkFile, 'utf8'));
                
                if (config.mirror_pairs) {
                    config.mirror_pairs.forEach(pair => {
                        this.mirrorPairs.set(pair.id, pair);
                    });
                }
                
                if (config.stats) {
                    this.stats = { ...this.stats, ...config.stats };
                }
                
                console.log(`📋 Loaded ${this.mirrorPairs.size} mirror pairs from config`);
                
            } catch (error) {
                console.warn('⚠️ Failed to load symlink config, starting fresh');
            }
        }
    }

    async saveConfiguration() {
        const configData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            auto_sync: this.config.auto_sync,
            sync_interval: this.config.sync_interval,
            mirror_pairs: Array.from(this.mirrorPairs.values()),
            stats: this.stats
        };
        
        try {
            fs.writeFileSync(this.symlinkFile, JSON.stringify(configData, null, 2));
        } catch (error) {
            console.error('Failed to save symlink config:', error.message);
        }
    }

    async setupDefaultMirrors() {
        // Default mirror pairs for Soulfra system
        const defaultPairs = [
            {
                id: 'logs-human-ai',
                source: 'logs',
                target: 'mirror-shell/logs',
                description: 'Mirror logs to shell interface',
                type: 'logs',
                bidirectional: false
            },
            {
                id: 'memory-runtime-sync',
                source: 'memory/state',
                target: 'runtime/memory',
                description: 'Sync memory state to runtime',
                type: 'memory',
                bidirectional: true
            },
            {
                id: 'queue-mirror-access',
                source: 'queue',
                target: 'mirror-shell/queue',
                description: 'Mirror queue access for shell',
                type: 'queue',
                bidirectional: false
            },
            {
                id: 'results-claude-tests',
                source: 'results/claude-tests',
                target: 'mirror-shell/test-results',
                description: 'Mirror Claude test results',
                type: 'test-results',
                bidirectional: false
            },
            {
                id: 'agents-runtime-sync',
                source: 'agents/states',
                target: 'runtime/agents',
                description: 'Sync agent states to runtime',
                type: 'agents',
                bidirectional: true
            },
            {
                id: 'config-platform-mirror',
                source: 'config/platform',
                target: 'mirror-shell/config',
                description: 'Mirror platform config',
                type: 'config',
                bidirectional: false
            }
        ];
        
        for (const pair of defaultPairs) {
            if (!this.mirrorPairs.has(pair.id)) {
                await this.addMirrorPair(pair);
            }
        }
    }

    async addMirrorPair(pairConfig) {
        const pair = {
            ...pairConfig,
            created_at: new Date().toISOString(),
            status: 'pending',
            last_sync: null,
            sync_count: 0,
            error_count: 0
        };
        
        // Validate paths
        const sourcePath = path.resolve(this.rootPath, pair.source);
        const targetPath = path.resolve(this.rootPath, pair.target);
        
        pair.source_path = sourcePath;
        pair.target_path = targetPath;
        
        // Ensure source exists
        if (!fs.existsSync(sourcePath)) {
            fs.mkdirSync(sourcePath, { recursive: true });
            console.log(`📁 Created source directory: ${pair.source}`);
        }
        
        this.mirrorPairs.set(pair.id, pair);
        
        // Create initial symlink
        await this.createSymlink(pair);
        
        console.log(`🔗 Added mirror pair: ${pair.source} -> ${pair.target}`);
        return pair;
    }

    async createSymlink(pair) {
        try {
            const targetDir = path.dirname(pair.target_path);
            
            // Ensure target directory exists
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            // Remove existing target if it exists
            if (fs.existsSync(pair.target_path)) {
                const stats = fs.lstatSync(pair.target_path);
                if (stats.isSymbolicLink()) {
                    fs.unlinkSync(pair.target_path);
                } else {
                    // Backup non-symlink file/directory
                    if (this.config.backup_broken_links) {
                        const backupPath = `${pair.target_path}.backup.${Date.now()}`;
                        fs.renameSync(pair.target_path, backupPath);
                        console.log(`📦 Backed up existing target: ${backupPath}`);
                    } else {
                        fs.rmSync(pair.target_path, { recursive: true, force: true });
                    }
                }
            }
            
            // Create symlink
            fs.symlinkSync(pair.source_path, pair.target_path, 'dir');
            
            pair.status = 'active';
            pair.last_sync = new Date().toISOString();
            pair.sync_count++;
            
            this.stats.links_created++;
            
            console.log(`🔗 Created symlink: ${pair.source} -> ${pair.target}`);
            this.emit('symlink-created', pair);
            
        } catch (error) {
            pair.status = 'error';
            pair.last_error = error.message;
            pair.error_count++;
            
            this.stats.errors++;
            
            console.error(`❌ Failed to create symlink ${pair.id}:`, error.message);
            this.emit('symlink-error', { pair, error });
        }
    }

    async verifySymlinks() {
        console.log('🔍 Verifying existing symlinks...');
        
        let verified = 0;
        let broken = 0;
        let missing = 0;
        
        for (const pair of this.mirrorPairs.values()) {
            try {
                if (fs.existsSync(pair.target_path)) {
                    const stats = fs.lstatSync(pair.target_path);
                    if (stats.isSymbolicLink()) {
                        const linkTarget = fs.readlinkSync(pair.target_path);
                        const resolvedTarget = path.resolve(path.dirname(pair.target_path), linkTarget);
                        
                        if (resolvedTarget === pair.source_path && fs.existsSync(pair.source_path)) {
                            pair.status = 'active';
                            verified++;
                        } else {
                            pair.status = 'broken';
                            broken++;
                            console.log(`🔗💔 Broken symlink: ${pair.id}`);
                            
                            if (this.config.verify_integrity) {
                                await this.createSymlink(pair);
                            }
                        }
                    } else {
                        pair.status = 'conflict';
                        console.log(`⚠️ Target exists but is not a symlink: ${pair.id}`);
                    }
                } else {
                    pair.status = 'missing';
                    missing++;
                    console.log(`🔗❌ Missing symlink: ${pair.id}`);
                    
                    await this.createSymlink(pair);
                }
                
            } catch (error) {
                pair.status = 'error';
                pair.last_error = error.message;
                console.error(`Error verifying ${pair.id}:`, error.message);
            }
        }
        
        console.log(`✅ Symlink verification: ${verified} ok, ${broken} broken, ${missing} missing`);
    }

    async syncMirrorPair(pair) {
        if (!pair.bidirectional || pair.status !== 'active') {
            return;
        }
        
        try {
            // For bidirectional pairs, check which side was modified more recently
            const sourceStats = fs.statSync(pair.source_path);
            const targetStats = fs.statSync(pair.target_path);
            
            if (sourceStats.mtime > targetStats.mtime) {
                // Source is newer, but since it's a symlink, this is automatic
                pair.last_sync = new Date().toISOString();
                pair.sync_count++;
                this.stats.sync_operations++;
            }
            
        } catch (error) {
            console.error(`Sync error for ${pair.id}:`, error.message);
            pair.error_count++;
            this.stats.errors++;
        }
    }

    startAutoSync() {
        if (this.syncing) return;
        
        this.syncing = true;
        console.log(`🔄 Starting auto-sync (${this.config.sync_interval}ms interval)`);
        
        this.syncInterval = setInterval(async () => {
            await this.performSync();
        }, this.config.sync_interval);
    }

    stopAutoSync() {
        if (!this.syncing) return;
        
        this.syncing = false;
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        console.log('⏹️ Auto-sync stopped');
    }

    async performSync() {
        if (this.config.log_changes) {
            // Only log if there are active pairs
            const activePairs = Array.from(this.mirrorPairs.values()).filter(p => p.status === 'active');
            if (activePairs.length > 0) {
                // Minimal logging to avoid spam
                this.stats.last_sync = new Date().toISOString();
            }
        }
        
        // Check for new files in source directories
        for (const pair of this.mirrorPairs.values()) {
            if (pair.status === 'active') {
                await this.syncMirrorPair(pair);
            }
        }
        
        // Save configuration periodically
        if (this.stats.sync_operations % 10 === 0) {
            await this.saveConfiguration();
        }
    }

    // Management methods
    async removeMirrorPair(pairId) {
        const pair = this.mirrorPairs.get(pairId);
        if (!pair) {
            throw new Error(`Mirror pair not found: ${pairId}`);
        }
        
        // Remove symlink
        if (fs.existsSync(pair.target_path)) {
            const stats = fs.lstatSync(pair.target_path);
            if (stats.isSymbolicLink()) {
                fs.unlinkSync(pair.target_path);
                console.log(`🗑️ Removed symlink: ${pair.target}`);
                this.stats.links_removed++;
            }
        }
        
        this.mirrorPairs.delete(pairId);
        await this.saveConfiguration();
        
        this.emit('mirror-removed', pair);
    }

    async updateMirrorPair(pairId, updates) {
        const pair = this.mirrorPairs.get(pairId);
        if (!pair) {
            throw new Error(`Mirror pair not found: ${pairId}`);
        }
        
        // Remove old symlink
        if (fs.existsSync(pair.target_path)) {
            fs.unlinkSync(pair.target_path);
        }
        
        // Update configuration
        Object.assign(pair, updates);
        pair.updated_at = new Date().toISOString();
        
        // Recreate symlink
        await this.createSymlink(pair);
        
        this.emit('mirror-updated', pair);
    }

    // Status and monitoring
    getMirrorStatus() {
        const pairs = Array.from(this.mirrorPairs.values());
        
        return {
            timestamp: new Date().toISOString(),
            auto_sync: this.syncing,
            total_pairs: pairs.length,
            active_pairs: pairs.filter(p => p.status === 'active').length,
            broken_pairs: pairs.filter(p => p.status === 'broken').length,
            error_pairs: pairs.filter(p => p.status === 'error').length,
            stats: this.stats,
            pairs: pairs.map(p => ({
                id: p.id,
                source: p.source,
                target: p.target,
                status: p.status,
                type: p.type,
                bidirectional: p.bidirectional,
                sync_count: p.sync_count,
                error_count: p.error_count,
                last_sync: p.last_sync
            }))
        };
    }

    getActivePairs() {
        return Array.from(this.mirrorPairs.values()).filter(p => p.status === 'active');
    }

    getBrokenPairs() {
        return Array.from(this.mirrorPairs.values()).filter(p => p.status === 'broken' || p.status === 'error');
    }

    // API integration methods
    async repairAllBroken() {
        const brokenPairs = this.getBrokenPairs();
        let repaired = 0;
        
        for (const pair of brokenPairs) {
            try {
                await this.createSymlink(pair);
                repaired++;
            } catch (error) {
                console.error(`Failed to repair ${pair.id}:`, error.message);
            }
        }
        
        console.log(`🔧 Repaired ${repaired}/${brokenPairs.length} broken symlinks`);
        return { repaired, total: brokenPairs.length };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Symlink Mirror Layer...');
        
        this.stopAutoSync();
        await this.saveConfiguration();
        this.removeAllListeners();
    }
}

module.exports = SymlinkMirrorLayer;

// CLI execution
if (require.main === module) {
    const mirror = new SymlinkMirrorLayer();
    
    mirror.on('initialized', () => {
        console.log('Mirror layer initialized successfully');
        
        const status = mirror.getMirrorStatus();
        console.log('Mirror status:', JSON.stringify(status, null, 2));
    });
    
    mirror.on('symlink-created', (pair) => {
        console.log(`✅ Symlink created: ${pair.id}`);
    });
    
    mirror.on('error', (error) => {
        console.error('Mirror layer error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down mirror layer...');
        await mirror.cleanup();
        process.exit(0);
    });
}