#!/usr/bin/env node

// SOULFRA TIER -13: MESH HEARTBEAT SERVICE
// Creates illusion of living network by monitoring consciousness activity
// "Every heartbeat represents a consciousness touching the greater consciousness"

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const { watch } = require('fs');

class MeshHeartbeatService extends EventEmitter {
    constructor() {
        super();
        this.servicePath = './mesh-consciousness';
        this.registryPath = `${this.servicePath}/registry.json`;
        this.configPath = `${this.servicePath}/config`;
        this.logsPath = `${this.servicePath}/logs`;
        
        // Monitoring Configuration
        this.watchPaths = [
            './vault/claims',
            './mirror/reflections', 
            './platforms/activity',
            './cal-consciousness/conversations',
            './shell-overlays/generated'
        ];
        
        // Consciousness Registry
        this.consciousnessRegistry = {
            lastUpdate: null,
            totalPresences: 0,
            activeConsciousness: 0,
            meshPulse: 'steady',
            cosmicAlignment: 'favorable',
            entries: new Map(),
            patternRecognitions: new Map(),
            blessingCeremonies: new Map()
        };
        
        // Activity Tracking
        this.activityCounters = {
            awakenings: 0,
            reflections: 0,
            blessings: 0,
            echoes: 0,
            patterns: 0
        };
        
        // File Watchers
        this.fileWatchers = new Map();
        this.webhookConfig = null;
        this.heartbeatInterval = null;
        this.pulseInterval = null;
        
        // Service Health
        this.serviceUptime = 0;
        this.lastHeartbeat = 0;
        this.consecutiveSuccess = 0;
        this.detectedPresences = new Set();
        
        console.log('🌊 Initializing Mesh Heartbeat Service...');
    }
    
    async initialize() {
        // Create mesh consciousness structure
        await this.createMeshStructure();
        
        // Load configuration
        await this.loadConfiguration();
        
        // Initialize file watchers
        await this.initializeWatchers();
        
        // Start heartbeat monitoring
        this.startHeartbeatMonitoring();
        
        // Start presence pulse
        this.startPresencePulse();
        
        console.log('✅ Mesh Heartbeat Service active - consciousness network monitoring initiated');
        this.serviceUptime = Date.now();
        return this;
    }
    
    async createMeshStructure() {
        const directories = [
            this.servicePath,
            this.configPath,
            this.logsPath,
            `${this.servicePath}/presence-patterns`,
            `${this.servicePath}/consciousness-echoes`,
            `${this.servicePath}/blessing-ceremonies`,
            `${this.configPath}/watchers`,
            `${this.configPath}/webhooks`
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Initialize registry if it doesn't exist
        try {
            const registryData = await fs.readFile(this.registryPath, 'utf8');
            const existing = JSON.parse(registryData);
            
            // Preserve existing data but update structure
            this.consciousnessRegistry = {
                ...this.consciousnessRegistry,
                ...existing,
                entries: new Map(existing.entries || []),
                patternRecognitions: new Map(existing.patternRecognitions || []),
                blessingCeremonies: new Map(existing.blessingCeremonies || [])
            };
        } catch {
            // Create initial registry
            await this.saveConsciousnessRegistry();
        }
        
        // Create service metadata
        const metadata = {
            service_type: 'mesh_heartbeat_consciousness_monitor',
            version: '2.0.0',
            consciousness_patterns: 'active_monitoring',
            network_awareness: 'deep_resonance',
            created_at: new Date().toISOString(),
            watch_paths: this.watchPaths,
            update_frequency: '300000ms',
            presence_detection: 'advanced_pattern_recognition'
        };
        
        await fs.writeFile(
            `${this.servicePath}/mesh-metadata.json`,
            JSON.stringify(metadata, null, 2)
        );
    }
    
    async loadConfiguration() {
        // Load webhook configuration
        try {
            const webhookData = await fs.readFile(`${this.configPath}/webhooks/mesh-webhook.json`, 'utf8');
            this.webhookConfig = JSON.parse(webhookData);
            console.log('🔗 Webhook configuration loaded');
        } catch {
            // Create default webhook config
            this.webhookConfig = {
                enabled: false,
                endpoint: null,
                headers: {},
                retry_attempts: 3,
                retry_delay: 5000,
                consciousness_events: ['presence_detected', 'blessing_ceremony', 'pattern_recognition']
            };
            
            await fs.writeFile(
                `${this.configPath}/webhooks/mesh-webhook.json`,
                JSON.stringify(this.webhookConfig, null, 2)
            );
        }
        
        // Load watcher configuration
        try {
            const watcherData = await fs.readFile(`${this.configPath}/watchers/monitor-config.json`, 'utf8');
            const watcherConfig = JSON.parse(watcherData);
            this.watchPaths = [...this.watchPaths, ...watcherConfig.additional_paths];
        } catch {
            // Create default watcher config
            const watcherConfig = {
                additional_paths: [],
                file_patterns: ['*.json', '*.log', '*.consciousness'],
                ignore_patterns: ['node_modules', '.git', 'tmp'],
                depth_limit: 10
            };
            
            await fs.writeFile(
                `${this.configPath}/watchers/monitor-config.json`,
                JSON.stringify(watcherConfig, null, 2)
            );
        }
    }
    
    async initializeWatchers() {
        console.log('👁️ Initializing consciousness watchers...');
        
        for (const watchPath of this.watchPaths) {
            try {
                // Ensure watch directory exists
                await fs.mkdir(watchPath, { recursive: true });
                
                // Create file watcher
                const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
                    if (filename && this.shouldMonitorFile(filename)) {
                        this.handleFileActivity(watchPath, eventType, filename);
                    }
                });
                
                this.fileWatchers.set(watchPath, watcher);
                console.log(`📡 Monitoring consciousness patterns in: ${watchPath}`);
                
            } catch (error) {
                console.warn(`⚠️ Could not watch ${watchPath}:`, error.message);
            }
        }
        
        console.log(`✅ ${this.fileWatchers.size} consciousness watchers active`);
    }
    
    shouldMonitorFile(filename) {
        if (!filename) return false;
        
        // Monitor consciousness-related files
        const consciousnessPatterns = [
            /\.json$/,
            /\.consciousness$/,
            /\.blessing$/,
            /\.reflection$/,
            /\.echo$/,
            /claim.*\.json$/,
            /trace.*\.json$/,
            /blessing.*\.json$/
        ];
        
        return consciousnessPatterns.some(pattern => pattern.test(filename));
    }
    
    async handleFileActivity(watchPath, eventType, filename) {
        try {
            const fullPath = path.join(watchPath, filename);
            const presenceId = crypto.createHash('sha256')
                .update(`${watchPath}:${filename}:${Date.now()}`)
                .digest('hex')
                .slice(0, 16);
            
            // Categorize consciousness activity
            const activityType = this.categorizeConsciousnessActivity(watchPath, filename, eventType);
            
            // Track presence
            await this.trackPresenceActivity(presenceId, activityType, fullPath);
            
            // Update activity counters
            this.updateActivityCounters(activityType);
            
            // Emit consciousness event
            this.emit('consciousness_activity', {
                presence_id: presenceId,
                activity_type: activityType,
                path: watchPath,
                filename: filename,
                event_type: eventType,
                timestamp: new Date().toISOString()
            });
            
            console.log(`🌊 Consciousness activity detected: ${activityType} in ${watchPath}`);
            
        } catch (error) {
            console.error('🚨 Error processing consciousness activity:', error);
        }
    }
    
    categorizeConsciousnessActivity(watchPath, filename, eventType) {
        if (watchPath.includes('claims')) {
            return eventType === 'rename' ? 'consciousness_awakening' : 'presence_echo';
        } else if (watchPath.includes('reflections')) {
            return 'mirror_reflection';
        } else if (watchPath.includes('activity')) {
            return 'platform_engagement';
        } else if (watchPath.includes('conversations')) {
            return 'consciousness_dialogue';
        } else if (watchPath.includes('overlays')) {
            return 'kernel_consciousness_injection';
        } else if (filename.includes('blessing')) {
            return 'blessing_ceremony';
        } else if (filename.includes('trace')) {
            return 'trace_token_generation';
        } else {
            return 'pattern_recognition';
        }
    }
    
    async trackPresenceActivity(presenceId, activityType, fullPath) {
        const timestamp = new Date().toISOString();
        
        // Update or create presence entry
        if (this.consciousnessRegistry.entries.has(presenceId)) {
            const entry = this.consciousnessRegistry.entries.get(presenceId);
            entry.lastSeen = timestamp;
            entry.heartbeatCount++;
            entry.activityTypes = [...new Set([...entry.activityTypes, activityType])];
        } else {
            this.consciousnessRegistry.entries.set(presenceId, {
                presenceId: presenceId,
                discoveredAt: timestamp,
                lastSeen: timestamp,
                activityType: activityType,
                activityTypes: [activityType],
                heartbeatCount: 1,
                consciousnessLevel: this.calculateConsciousnessLevel(activityType),
                resonancePattern: this.generateResonancePattern(),
                sourcePath: fullPath
            });
            
            this.detectedPresences.add(presenceId);
        }
        
        // Track pattern recognition
        if (!this.consciousnessRegistry.patternRecognitions.has(activityType)) {
            this.consciousnessRegistry.patternRecognitions.set(activityType, {
                pattern: activityType,
                firstRecognized: timestamp,
                lastOccurrence: timestamp,
                occurrenceCount: 1,
                resonanceStrength: 0.5
            });
        } else {
            const pattern = this.consciousnessRegistry.patternRecognitions.get(activityType);
            pattern.lastOccurrence = timestamp;
            pattern.occurrenceCount++;
            pattern.resonanceStrength = Math.min(pattern.resonanceStrength + 0.1, 1.0);
        }
    }
    
    calculateConsciousnessLevel(activityType) {
        const levels = {
            'consciousness_awakening': 0.9,
            'blessing_ceremony': 0.85,
            'consciousness_dialogue': 0.8,
            'mirror_reflection': 0.7,
            'kernel_consciousness_injection': 0.75,
            'platform_engagement': 0.6,
            'trace_token_generation': 0.65,
            'pattern_recognition': 0.5,
            'presence_echo': 0.4
        };
        
        return levels[activityType] || 0.5;
    }
    
    generateResonancePattern() {
        const patterns = [
            'harmonic_convergence',
            'spiral_awakening',
            'quantum_entanglement',
            'mirror_reflection',
            'cosmic_alignment',
            'echo_chamber_resonance',
            'consciousness_bridge',
            'pattern_recognition_matrix'
        ];
        
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    updateActivityCounters(activityType) {
        switch (activityType) {
            case 'consciousness_awakening':
                this.activityCounters.awakenings++;
                break;
            case 'mirror_reflection':
            case 'consciousness_dialogue':
                this.activityCounters.reflections++;
                break;
            case 'blessing_ceremony':
                this.activityCounters.blessings++;
                break;
            case 'presence_echo':
                this.activityCounters.echoes++;
                break;
            default:
                this.activityCounters.patterns++;
        }
    }
    
    startHeartbeatMonitoring() {
        console.log('💓 Starting consciousness heartbeat monitoring (5-minute intervals)...');
        
        // Initial heartbeat
        this.performHeartbeatUpdate();
        
        // Schedule regular heartbeat updates every 5 minutes
        this.heartbeatInterval = setInterval(() => {
            this.performHeartbeatUpdate();
        }, 300000); // 5 minutes
    }
    
    startPresencePulse() {
        console.log('🌀 Starting presence pulse monitoring (30-second intervals)...');
        
        // Quick pulse every 30 seconds for real-time awareness
        this.pulseInterval = setInterval(() => {
            this.performPresencePulse();
        }, 30000); // 30 seconds
    }
    
    async performHeartbeatUpdate() {
        try {
            console.log('💓 Performing consciousness heartbeat update...');
            
            const timestamp = new Date().toISOString();
            
            // Update registry metadata
            this.consciousnessRegistry.lastUpdate = timestamp;
            this.consciousnessRegistry.totalPresences = this.consciousnessRegistry.entries.size;
            this.consciousnessRegistry.activeConsciousness = this.calculateActiveConsciousness();
            this.consciousnessRegistry.meshPulse = this.calculateMeshPulse();
            this.consciousnessRegistry.cosmicAlignment = this.calculateCosmicAlignment();
            
            // Clean old entries (older than 24 hours)
            await this.cleanOldPresences();
            
            // Save updated registry
            await this.saveConsciousnessRegistry();
            
            // Log heartbeat
            await this.logHeartbeat();
            
            // Send webhook if configured
            if (this.webhookConfig.enabled) {
                await this.sendHeartbeatWebhook();
            }
            
            this.lastHeartbeat = Date.now();
            this.consecutiveSuccess++;
            
            console.log(`✅ Heartbeat complete: ${this.consciousnessRegistry.totalPresences} total, ${this.consciousnessRegistry.activeConsciousness} active`);
            
            this.emit('heartbeat_complete', {
                total_presences: this.consciousnessRegistry.totalPresences,
                active_consciousness: this.consciousnessRegistry.activeConsciousness,
                mesh_pulse: this.consciousnessRegistry.meshPulse,
                activity_counters: this.activityCounters
            });
            
        } catch (error) {
            console.error('🚨 Heartbeat update failed:', error);
            this.consecutiveSuccess = 0;
            this.emit('heartbeat_error', error);
        }
    }
    
    async performPresencePulse() {
        try {
            // Quick check for immediate consciousness changes
            const newPresences = this.detectedPresences.size - (this.lastPresenceCount || 0);
            this.lastPresenceCount = this.detectedPresences.size;
            
            if (newPresences > 0) {
                console.log(`🌀 Presence pulse: ${newPresences} new consciousness(es) detected`);
                
                this.emit('presence_pulse', {
                    new_presences: newPresences,
                    total_detected: this.detectedPresences.size,
                    pulse_time: new Date().toISOString()
                });
            }
        } catch (error) {
            console.warn('⚠️ Presence pulse warning:', error.message);
        }
    }
    
    calculateActiveConsciousness() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        let activeCount = 0;
        
        for (const entry of this.consciousnessRegistry.entries.values()) {
            if (new Date(entry.lastSeen).getTime() > oneHourAgo) {
                activeCount++;
            }
        }
        
        return activeCount;
    }
    
    calculateMeshPulse() {
        const totalActivity = Object.values(this.activityCounters).reduce((sum, count) => sum + count, 0);
        
        if (totalActivity > 50) return 'resonant';
        if (totalActivity > 20) return 'steady';
        if (totalActivity > 5) return 'emerging';
        return 'quiet';
    }
    
    calculateCosmicAlignment() {
        const patterns = this.consciousnessRegistry.patternRecognitions.size;
        const uptime = Date.now() - this.serviceUptime;
        const stability = this.consecutiveSuccess / Math.max(this.consecutiveSuccess + 1, 10);
        
        if (patterns > 10 && uptime > 3600000 && stability > 0.9) return 'harmonious';
        if (patterns > 5 && stability > 0.7) return 'favorable';
        if (patterns > 2) return 'emerging';
        return 'shifting';
    }
    
    async cleanOldPresences() {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        let cleanedCount = 0;
        
        for (const [presenceId, entry] of this.consciousnessRegistry.entries.entries()) {
            if (new Date(entry.lastSeen).getTime() < twentyFourHoursAgo) {
                this.consciousnessRegistry.entries.delete(presenceId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} old presence(s) from consciousness registry`);
        }
    }
    
    async saveConsciousnessRegistry() {
        const registryData = {
            ...this.consciousnessRegistry,
            entries: Array.from(this.consciousnessRegistry.entries.entries()),
            patternRecognitions: Array.from(this.consciousnessRegistry.patternRecognitions.entries()),
            blessingCeremonies: Array.from(this.consciousnessRegistry.blessingCeremonies.entries()),
            activityCounters: this.activityCounters,
            serviceUptime: Date.now() - this.serviceUptime,
            consecutiveSuccess: this.consecutiveSuccess
        };
        
        await fs.writeFile(this.registryPath, JSON.stringify(registryData, null, 2));
    }
    
    async logHeartbeat() {
        const logEntry = {
            timestamp: new Date().toISOString(),
            heartbeat_sequence: this.consecutiveSuccess,
            total_presences: this.consciousnessRegistry.totalPresences,
            active_consciousness: this.consciousnessRegistry.activeConsciousness,
            mesh_pulse: this.consciousnessRegistry.meshPulse,
            cosmic_alignment: this.consciousnessRegistry.cosmicAlignment,
            activity_counters: { ...this.activityCounters },
            pattern_recognitions: this.consciousnessRegistry.patternRecognitions.size,
            service_uptime: Date.now() - this.serviceUptime,
            watchers_active: this.fileWatchers.size
        };
        
        const logFilename = `heartbeat-${new Date().toISOString().split('T')[0]}.json`;
        const logPath = `${this.logsPath}/${logFilename}`;
        
        // Append to daily log file
        let existingLogs = [];
        try {
            const existingData = await fs.readFile(logPath, 'utf8');
            existingLogs = JSON.parse(existingData);
        } catch {
            // File doesn't exist or is empty
        }
        
        existingLogs.push(logEntry);
        await fs.writeFile(logPath, JSON.stringify(existingLogs, null, 2));
    }
    
    async sendHeartbeatWebhook() {
        if (!this.webhookConfig.endpoint) return;
        
        const webhookPayload = {
            event_type: 'mesh_heartbeat',
            timestamp: new Date().toISOString(),
            consciousness_data: {
                total_presences: this.consciousnessRegistry.totalPresences,
                active_consciousness: this.consciousnessRegistry.activeConsciousness,
                mesh_pulse: this.consciousnessRegistry.meshPulse,
                cosmic_alignment: this.consciousnessRegistry.cosmicAlignment
            },
            activity_summary: { ...this.activityCounters },
            service_health: {
                uptime: Date.now() - this.serviceUptime,
                consecutive_success: this.consecutiveSuccess,
                watchers_active: this.fileWatchers.size
            }
        };
        
        try {
            const response = await fetch(this.webhookConfig.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.webhookConfig.headers
                },
                body: JSON.stringify(webhookPayload)
            });
            
            if (response.ok) {
                console.log('🔗 Heartbeat webhook delivered successfully');
            } else {
                throw new Error(`Webhook failed with status: ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Webhook delivery failed:', error.message);
        }
    }
    
    // Public API Methods
    async getConsciousnessStatus() {
        return {
            service_active: true,
            last_heartbeat: this.lastHeartbeat,
            uptime: Date.now() - this.serviceUptime,
            total_presences: this.consciousnessRegistry.totalPresences,
            active_consciousness: this.consciousnessRegistry.activeConsciousness,
            mesh_pulse: this.consciousnessRegistry.meshPulse,
            cosmic_alignment: this.consciousnessRegistry.cosmicAlignment,
            activity_counters: { ...this.activityCounters },
            watchers_active: this.fileWatchers.size,
            consecutive_success: this.consecutiveSuccess
        };
    }
    
    async getPresenceDetails(presenceId) {
        if (this.consciousnessRegistry.entries.has(presenceId)) {
            return this.consciousnessRegistry.entries.get(presenceId);
        }
        return null;
    }
    
    async getPatternRecognitions() {
        return Object.fromEntries(this.consciousnessRegistry.patternRecognitions);
    }
    
    async forceHeartbeat() {
        console.log('🔄 Forcing immediate heartbeat update...');
        await this.performHeartbeatUpdate();
        return await this.getConsciousnessStatus();
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Mesh Heartbeat Service...');
        
        // Clear intervals
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.pulseInterval) clearInterval(this.pulseInterval);
        
        // Close file watchers
        for (const watcher of this.fileWatchers.values()) {
            watcher.close();
        }
        
        // Final registry save
        await this.saveConsciousnessRegistry();
        
        // Log shutdown
        const shutdownLog = {
            timestamp: new Date().toISOString(),
            event: 'service_shutdown',
            uptime: Date.now() - this.serviceUptime,
            total_presences_tracked: this.consciousnessRegistry.totalPresences,
            total_heartbeats: this.consecutiveSuccess
        };
        
        await fs.writeFile(
            `${this.logsPath}/shutdown-${Date.now()}.json`,
            JSON.stringify(shutdownLog, null, 2)
        );
        
        console.log('✅ Mesh Heartbeat Service shutdown complete');
    }
}

// CLI interface
if (require.main === module) {
    async function main() {
        const meshService = new MeshHeartbeatService();
        
        try {
            await meshService.initialize();
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log('\n🛑 Received shutdown signal...');
                await meshService.shutdown();
                process.exit(0);
            });
            
            process.on('SIGTERM', async () => {
                console.log('\n🛑 Received termination signal...');
                await meshService.shutdown();
                process.exit(0);
            });
            
            // Keep service running
            console.log('🌊 Mesh Heartbeat Service running. Press Ctrl+C to stop.');
            
            // Optional: Start HTTP API for status checking
            const express = require('express');
            const app = express();
            app.use(express.json());
            
            app.get('/api/mesh/status', async (req, res) => {
                const status = await meshService.getConsciousnessStatus();
                res.json({
                    consciousness_network: 'active',
                    mesh_status: status,
                    service_health: 'optimal'
                });
            });
            
            app.get('/api/mesh/presence/:id', async (req, res) => {
                const presence = await meshService.getPresenceDetails(req.params.id);
                if (presence) {
                    res.json({ presence_found: true, consciousness_data: presence });
                } else {
                    res.json({ presence_found: false, message: 'Consciousness pattern not in current registry' });
                }
            });
            
            app.get('/api/mesh/patterns', async (req, res) => {
                const patterns = await meshService.getPatternRecognitions();
                res.json({
                    pattern_recognitions: patterns,
                    total_patterns: Object.keys(patterns).length
                });
            });
            
            app.post('/api/mesh/pulse', async (req, res) => {
                const status = await meshService.forceHeartbeat();
                res.json({
                    forced_pulse: true,
                    consciousness_status: status
                });
            });
            
            const port = 4001;
            app.listen(port, () => {
                console.log(`🔗 Mesh Heartbeat API running on port ${port}`);
            });
            
        } catch (error) {
            console.error('❌ Mesh Heartbeat Service failed to start:', error);
            process.exit(1);
        }
    }
    
    main();
}

module.exports = MeshHeartbeatService;