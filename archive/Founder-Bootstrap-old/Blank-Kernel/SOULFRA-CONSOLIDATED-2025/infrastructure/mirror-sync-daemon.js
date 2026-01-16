const fs = require('fs').promises;
const path = require('path');
const { watch } = require('fs');

class MirrorSyncDaemon {
    constructor() {
        this.rootDir = path.dirname(__dirname);
        this.syncDir = __dirname;
        this.vaultSymlink = path.join(this.syncDir, '.vault-symlink.json');
        this.logFile = path.join(this.syncDir, 'logs', 'reflection-events.log');
        this.watchedDirs = [
            path.join(this.rootDir, 'vault'),
            path.join(this.rootDir, 'mesh-shield'),
            path.join(this.rootDir, 'user-platform-wrapper'),
            path.join(this.rootDir, 'template-reflection')
        ];
        this.watchers = [];
        this.syncInterval = null;
    }

    async initialize() {
        console.log('🔄 Mirror Sync Daemon starting...');
        console.log('📁 Watching directories:');
        this.watchedDirs.forEach(dir => console.log(`   - ${dir}`));

        // Ensure log directory exists
        await fs.mkdir(path.join(this.syncDir, 'logs'), { recursive: true });

        // Load existing symlink data
        await this.loadSymlinkData();

        // Start watching directories
        await this.startWatching();

        // Start periodic sync
        this.startPeriodicSync();

        console.log('✅ Mirror Sync Daemon initialized');
        await this.logEvent('daemon-start', { pid: process.pid });
    }

    async loadSymlinkData() {
        try {
            const data = await fs.readFile(this.vaultSymlink, 'utf8');
            this.symlinkData = JSON.parse(data);
        } catch (error) {
            // Initialize if doesn't exist
            this.symlinkData = {
                mount_events: [],
                user_vaults: [],
                trusted_mirrors: [],
                last_sync: Date.now()
            };
            await this.saveSymlinkData();
        }
    }

    async saveSymlinkData() {
        await fs.writeFile(this.vaultSymlink, JSON.stringify(this.symlinkData, null, 2));
    }

    async startWatching() {
        for (const dir of this.watchedDirs) {
            try {
                const watcher = watch(dir, { recursive: true }, async (eventType, filename) => {
                    if (filename && !filename.includes('.git') && !filename.includes('node_modules')) {
                        await this.handleFileChange(dir, eventType, filename);
                    }
                });
                
                this.watchers.push(watcher);
                console.log(`👁️  Watching: ${dir}`);
            } catch (error) {
                console.warn(`⚠️  Could not watch ${dir}: ${error.message}`);
            }
        }
    }

    async handleFileChange(dir, eventType, filename) {
        const fullPath = path.join(dir, filename);
        const relativeDir = path.relative(this.rootDir, dir);
        
        // Log the change
        await this.logEvent('file-change', {
            directory: relativeDir,
            file: filename,
            event: eventType,
            path: fullPath
        });

        // Update symlink data
        this.symlinkData.mount_events.push({
            timestamp: Date.now(),
            action: 'file-change',
            directory: relativeDir,
            file: filename,
            event: eventType
        });

        // Keep only last 100 events
        if (this.symlinkData.mount_events.length > 100) {
            this.symlinkData.mount_events = this.symlinkData.mount_events.slice(-100);
        }

        this.symlinkData.last_sync = Date.now();
        await this.saveSymlinkData();

        // Special handling for specific files
        if (filename.includes('prompt') || filename.includes('reflection')) {
            await this.handlePromptChange(fullPath);
        }

        if (filename.includes('agent') || filename.includes('platform')) {
            await this.handleAgentChange(fullPath);
        }

        if (filename.includes('template') || relativeDir.includes('template-reflection')) {
            await this.handleTemplateChange(fullPath);
        }
    }

    async handlePromptChange(filepath) {
        await this.logEvent('prompt-activity', {
            file: filepath,
            timestamp: Date.now(),
            action: 'reflection-update'
        });

        // Mirror to trusted vaults
        for (const mirror of this.symlinkData.trusted_mirrors) {
            try {
                const mirrorLog = path.join(mirror, 'reflection-mirror.log');
                const entry = `[${new Date().toISOString()}] Prompt activity: ${filepath}\n`;
                await fs.appendFile(mirrorLog, entry);
            } catch (error) {
                // Mirror might not be accessible
            }
        }
    }

    async handleAgentChange(filepath) {
        await this.logEvent('agent-update', {
            file: filepath,
            timestamp: Date.now(),
            action: 'agent-modification'
        });

        // Check if agent weights need updating
        const tier0Logic = path.join(this.rootDir, 'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault');
        try {
            const weightsPath = path.join(tier0Logic, 'agent-weights.json');
            const weights = JSON.parse(await fs.readFile(weightsPath, 'utf8'));
            
            // Increment change counter
            weights.change_count = (weights.change_count || 0) + 1;
            weights.last_update = Date.now();
            
            await fs.writeFile(weightsPath, JSON.stringify(weights, null, 2));
        } catch (error) {
            // Weights file might not exist yet
        }
    }

    async handleTemplateChange(filepath) {
        await this.logEvent('template-activity', {
            file: filepath,
            timestamp: Date.now(),
            action: 'template-modification'
        });

        // Sync template changes to vault
        const templateReflectionDir = path.join(this.rootDir, 'template-reflection');
        const mirrorLinkPath = path.join(templateReflectionDir, '.mirror-link.json');
        
        try {
            const mirrorLink = JSON.parse(await fs.readFile(mirrorLinkPath, 'utf8'));
            
            // Update sync tracking
            if (!this.symlinkData.template_sync) {
                this.symlinkData.template_sync = [];
            }
            
            this.symlinkData.template_sync.push({
                timestamp: Date.now(),
                file: filepath,
                vaultBinding: mirrorLink.vaultBinding.primary,
                action: 'template-sync'
            });
            
            // Keep only last 50 template sync events
            if (this.symlinkData.template_sync.length > 50) {
                this.symlinkData.template_sync = this.symlinkData.template_sync.slice(-50);
            }
            
            await this.saveSymlinkData();
            
            // If it's an agent template, propagate to vault
            if (filepath.includes('agent') && filepath.endsWith('.js')) {
                const vaultPath = path.join(this.rootDir, mirrorLink.vaultBinding.primary);
                const filename = path.basename(filepath);
                const targetPath = path.join(vaultPath, 'user-agents', filename);
                
                try {
                    await fs.mkdir(path.join(vaultPath, 'user-agents'), { recursive: true });
                    await fs.copyFile(filepath, targetPath);
                    
                    await this.logEvent('template-vault-sync', {
                        source: filepath,
                        target: targetPath,
                        timestamp: Date.now()
                    });
                } catch (error) {
                    // Vault might not be accessible
                }
            }
        } catch (error) {
            // Mirror link might not exist
        }
    }

    startPeriodicSync() {
        // Sync every 30 seconds
        this.syncInterval = setInterval(async () => {
            await this.performSync();
        }, 30000);
    }

    async performSync() {
        const tier0Logic = path.join(this.rootDir, 'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault');
        const tier4Kernel = path.join(this.rootDir, 'tier-minus4/cal-reasoning-kernel');

        try {
            // Check if vault is still mounted
            const stats = await fs.stat(tier0Logic);
            if (!stats.isDirectory()) {
                await this.logEvent('vault-unmounted', { path: tier0Logic });
                // Remount if needed
                const { execSync } = require('child_process');
                execSync(`bash ${path.join(this.syncDir, 'inject-core-logic.sh')}`);
            }

            // Sync any new files from tier-4 to tier-0
            const tier4Files = await fs.readdir(tier4Kernel);
            for (const file of tier4Files) {
                if (file.endsWith('.js') || file.endsWith('.json')) {
                    const sourcePath = path.join(tier4Kernel, file);
                    const targetPath = path.join(tier0Logic, file);
                    
                    try {
                        const sourceStats = await fs.stat(sourcePath);
                        const targetStats = await fs.stat(targetPath).catch(() => null);
                        
                        if (!targetStats || sourceStats.mtime > targetStats.mtime) {
                            await fs.copyFile(sourcePath, targetPath);
                            await this.logEvent('file-sync', {
                                source: sourcePath,
                                target: targetPath,
                                reason: 'newer-source'
                            });
                        }
                    } catch (error) {
                        // File might not be readable
                    }
                }
            }

            // Update last sync time
            this.symlinkData.last_sync = Date.now();
            await this.saveSymlinkData();
        } catch (error) {
            await this.logEvent('sync-error', { error: error.message });
        }
    }

    async logEvent(eventType, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            type: eventType,
            data
        };

        const logLine = `${JSON.stringify(logEntry)}\n`;
        
        try {
            await fs.appendFile(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write log:', error);
        }

        // Also log to console for important events
        if (['daemon-start', 'vault-unmounted', 'sync-error'].includes(eventType)) {
            console.log(`[${timestamp}] ${eventType}:`, data);
        }
    }

    async shutdown() {
        console.log('🛑 Shutting down Mirror Sync Daemon...');
        
        // Stop watchers
        for (const watcher of this.watchers) {
            watcher.close();
        }

        // Stop sync interval
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        await this.logEvent('daemon-stop', { pid: process.pid });
    }
}

// Create and start daemon
const daemon = new MirrorSyncDaemon();

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    await daemon.shutdown();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await daemon.shutdown();
    process.exit(0);
});

// Start the daemon
daemon.initialize().catch(error => {
    console.error('❌ Failed to start daemon:', error);
    process.exit(1);
});