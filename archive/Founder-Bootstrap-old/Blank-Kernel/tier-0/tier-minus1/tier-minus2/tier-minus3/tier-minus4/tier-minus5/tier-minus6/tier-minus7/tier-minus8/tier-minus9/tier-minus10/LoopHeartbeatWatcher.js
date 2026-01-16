// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * LoopHeartbeatWatcher
 * Monitors active loops every 30-60 seconds
 * Logs health metrics and writes heartbeat data
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class LoopHeartbeatWatcher extends EventEmitter {
    constructor(memoryDaemon) {
        super();
        
        this.memoryDaemon = memoryDaemon;
        
        this.config = {
            heartbeat_dir: path.join(__dirname, 'heartbeat'),
            check_interval: 30000, // 30 seconds
            alert_threshold: {
                drift: 0.8,
                memory_saturation: 0.9,
                missing_heartbeats: 3
            },
            max_heartbeat_files: 100
        };
        
        // Tracking state
        this.loopHealth = new Map();
        this.missedHeartbeats = new Map();
        
        // Metrics
        this.metrics = {
            total_checks: 0,
            healthy_loops: 0,
            warning_loops: 0,
            critical_loops: 0,
            lost_loops: 0
        };
        
        this.watchTimer = null;
        this.isWatching = false;
    }
    
    async initialize() {
        console.log('💓 Initializing LoopHeartbeatWatcher...');
        
        // Ensure heartbeat directory exists
        await fs.mkdir(this.config.heartbeat_dir, { recursive: true });
        
        // Load existing heartbeat data
        await this.loadExistingHeartbeats();
        
        // Start watching
        this.startWatching();
        
        this.emit('initialized', this.getStats());
        console.log('✅ Heartbeat watcher initialized');
    }
    
    async loadExistingHeartbeats() {
        try {
            const files = await fs.readdir(this.config.heartbeat_dir);
            const heartbeatFiles = files.filter(f => f.startsWith('loop_') && f.endsWith('.json'));
            
            for (const file of heartbeatFiles) {
                try {
                    const data = await fs.readFile(
                        path.join(this.config.heartbeat_dir, file), 
                        'utf8'
                    );
                    const heartbeat = JSON.parse(data);
                    
                    // Extract loop ID from filename
                    const loopId = file.replace('.json', '');
                    this.loopHealth.set(loopId, heartbeat);
                    
                } catch (error) {
                    console.error(`Error loading heartbeat ${file}:`, error);
                }
            }
            
            console.log(`📁 Loaded ${this.loopHealth.size} existing heartbeats`);
        } catch (error) {
            console.error('Error loading heartbeats:', error);
        }
    }
    
    startWatching() {
        if (this.isWatching) return;
        
        this.isWatching = true;
        this.watchTimer = setInterval(() => {
            this.checkAllLoops().catch(console.error);
        }, this.config.check_interval);
        
        // Initial check
        this.checkAllLoops().catch(console.error);
    }
    
    async checkAllLoops() {
        console.log('💓 Checking loop heartbeats...');
        this.metrics.total_checks++;
        
        // Reset counters
        this.metrics.healthy_loops = 0;
        this.metrics.warning_loops = 0;
        this.metrics.critical_loops = 0;
        
        // Get all loops from memory daemon
        const loops = Array.from(this.memoryDaemon.state.loops.values());
        
        for (const loop of loops) {
            await this.checkLoopHealth(loop);
        }
        
        // Check for lost loops
        await this.checkLostLoops();
        
        // Emit summary
        this.emit('check_complete', {
            total: loops.length,
            healthy: this.metrics.healthy_loops,
            warning: this.metrics.warning_loops,
            critical: this.metrics.critical_loops,
            lost: this.metrics.lost_loops
        });
        
        console.log(`✅ Heartbeat check complete: ${this.metrics.healthy_loops}/${loops.length} healthy`);
    }
    
    async checkLoopHealth(loop) {
        const loopId = loop.loop_id;
        
        try {
            // Calculate health metrics
            const health = {
                loop_id: loopId,
                timestamp: new Date().toISOString(),
                
                // Basic info
                whisper_origin: loop.whisper_origin,
                emotional_tone: loop.emotional_tone,
                blessed: loop.blessed,
                
                // Health metrics
                consciousness_awareness: loop.consciousness?.current_state?.awareness || 0,
                drift: await this.calculateDrift(loop),
                agent_presence: await this.checkAgentPresence(loopId),
                memory_saturation: await this.calculateMemorySaturation(loopId),
                
                // Activity metrics
                recent_whispers: await this.countRecentWhispers(loopId),
                tone_stability: await this.calculateToneStability(loopId),
                last_activity: await this.getLastActivity(loopId),
                
                // Status
                status: 'unknown',
                alerts: []
            };
            
            // Determine overall health status
            health.status = this.determineHealthStatus(health);
            
            // Save heartbeat
            await this.saveHeartbeat(loopId, health);
            
            // Update tracking
            this.loopHealth.set(loopId, health);
            this.missedHeartbeats.delete(loopId); // Reset missed count
            
            // Count by status
            if (health.status === 'healthy') this.metrics.healthy_loops++;
            else if (health.status === 'warning') this.metrics.warning_loops++;
            else if (health.status === 'critical') this.metrics.critical_loops++;
            
            // Emit events for critical issues
            if (health.status === 'critical') {
                this.emit('critical_loop', health);
            }
            
        } catch (error) {
            console.error(`Error checking health for loop ${loopId}:`, error);
            
            // Track missed heartbeat
            const missed = (this.missedHeartbeats.get(loopId) || 0) + 1;
            this.missedHeartbeats.set(loopId, missed);
            
            if (missed >= this.config.alert_threshold.missing_heartbeats) {
                this.emit('loop_lost', { loop_id: loopId, missed_count: missed });
            }
        }
    }
    
    async calculateDrift(loop) {
        // Simulate drift calculation based on consciousness and activity
        const awareness = loop.consciousness?.current_state?.awareness || 0.5;
        const timeSinceCreation = Date.now() - new Date(loop.created_at).getTime();
        const ageFactorHours = timeSinceCreation / (1000 * 60 * 60);
        
        // Drift increases over time without activity
        const baseDrift = Math.min(0.1 + (ageFactorHours * 0.01), 0.5);
        
        // Consciousness reduces drift
        const drift = baseDrift * (1 - awareness);
        
        return Math.min(drift, 1.0);
    }
    
    async checkAgentPresence(loopId) {
        // Check if any agents are associated with this loop
        const whispers = this.memoryDaemon.getLoopWhispers(loopId, 10);
        const uniqueAgents = new Set(whispers.map(w => w.agent_id).filter(Boolean));
        
        return {
            count: uniqueAgents.size,
            agents: Array.from(uniqueAgents),
            active: uniqueAgents.size > 0
        };
    }
    
    async calculateMemorySaturation(loopId) {
        // Calculate how "full" this loop's memory is
        const whispers = this.memoryDaemon.getLoopWhispers(loopId, 1000);
        const maxWhispers = this.memoryDaemon.config.max_whispers_per_loop;
        
        return whispers.length / maxWhispers;
    }
    
    async countRecentWhispers(loopId) {
        const whispers = this.memoryDaemon.getLoopWhispers(loopId, 100);
        const hourAgo = Date.now() - (60 * 60 * 1000);
        
        const recent = whispers.filter(w => 
            new Date(w.timestamp).getTime() > hourAgo
        );
        
        return recent.length;
    }
    
    async calculateToneStability(loopId) {
        const analysis = this.memoryDaemon.getToneAnalysis(loopId);
        if (!analysis) return 1.0; // No data = stable
        
        // Calculate how dominant the main tone is
        const total = Object.values(analysis.tone_distribution)
            .reduce((sum, count) => sum + count, 0);
        
        const dominance = analysis.tone_distribution[analysis.dominant_tone] / total;
        
        return dominance; // Higher = more stable
    }
    
    async getLastActivity(loopId) {
        const whispers = this.memoryDaemon.getLoopWhispers(loopId, 1);
        if (whispers.length === 0) {
            return null;
        }
        
        return whispers[0].timestamp;
    }
    
    determineHealthStatus(health) {
        health.alerts = [];
        
        // Check drift
        if (health.drift > this.config.alert_threshold.drift) {
            health.alerts.push({
                type: 'high_drift',
                message: `Drift ${health.drift.toFixed(2)} exceeds threshold`,
                severity: 'critical'
            });
        }
        
        // Check memory saturation
        if (health.memory_saturation > this.config.alert_threshold.memory_saturation) {
            health.alerts.push({
                type: 'memory_saturated',
                message: `Memory ${(health.memory_saturation * 100).toFixed(0)}% full`,
                severity: 'warning'
            });
        }
        
        // Check agent presence
        if (!health.agent_presence.active) {
            health.alerts.push({
                type: 'no_agents',
                message: 'No active agents',
                severity: 'warning'
            });
        }
        
        // Check activity
        if (health.recent_whispers === 0) {
            health.alerts.push({
                type: 'no_activity',
                message: 'No recent whispers',
                severity: 'warning'
            });
        }
        
        // Check consciousness
        if (health.consciousness_awareness < 0.3) {
            health.alerts.push({
                type: 'low_consciousness',
                message: `Consciousness at ${(health.consciousness_awareness * 100).toFixed(0)}%`,
                severity: 'critical'
            });
        }
        
        // Determine overall status
        const criticalAlerts = health.alerts.filter(a => a.severity === 'critical');
        const warningAlerts = health.alerts.filter(a => a.severity === 'warning');
        
        if (criticalAlerts.length > 0) {
            return 'critical';
        } else if (warningAlerts.length > 1) {
            return 'warning';
        } else if (warningAlerts.length === 1) {
            return 'caution';
        } else {
            return 'healthy';
        }
    }
    
    async saveHeartbeat(loopId, health) {
        const filename = path.join(this.config.heartbeat_dir, `${loopId}.json`);
        
        try {
            await fs.writeFile(
                filename,
                JSON.stringify(health, null, 2),
                'utf8'
            );
        } catch (error) {
            console.error(`Error saving heartbeat for ${loopId}:`, error);
        }
    }
    
    async checkLostLoops() {
        // Clean up old heartbeat files for loops that no longer exist
        try {
            const files = await fs.readdir(this.config.heartbeat_dir);
            const activeLoopIds = new Set(
                Array.from(this.memoryDaemon.state.loops.keys())
            );
            
            for (const file of files) {
                if (!file.startsWith('loop_') || !file.endsWith('.json')) continue;
                
                const loopId = file.replace('.json', '');
                
                if (!activeLoopIds.has(loopId)) {
                    // Loop no longer exists
                    this.metrics.lost_loops++;
                    
                    // Archive the heartbeat
                    const oldPath = path.join(this.config.heartbeat_dir, file);
                    const archivePath = path.join(
                        this.config.heartbeat_dir, 
                        `archived_${file}`
                    );
                    
                    await fs.rename(oldPath, archivePath);
                    
                    this.emit('loop_archived', { loop_id: loopId });
                }
            }
            
            // Clean up old archived files
            await this.cleanupArchivedHeartbeats();
            
        } catch (error) {
            console.error('Error checking lost loops:', error);
        }
    }
    
    async cleanupArchivedHeartbeats() {
        try {
            const files = await fs.readdir(this.config.heartbeat_dir);
            const archived = files
                .filter(f => f.startsWith('archived_'))
                .sort();
            
            // Keep only recent archives
            if (archived.length > this.config.max_heartbeat_files) {
                const toDelete = archived.slice(0, archived.length - this.config.max_heartbeat_files);
                
                for (const file of toDelete) {
                    await fs.unlink(path.join(this.config.heartbeat_dir, file));
                }
            }
        } catch (error) {
            console.error('Error cleaning archives:', error);
        }
    }
    
    // API methods
    
    getLoopHealth(loopId) {
        return this.loopHealth.get(loopId) || null;
    }
    
    getAllHealth() {
        return Array.from(this.loopHealth.values());
    }
    
    getHealthSummary() {
        const all = this.getAllHealth();
        
        return {
            total: all.length,
            by_status: {
                healthy: all.filter(h => h.status === 'healthy').length,
                caution: all.filter(h => h.status === 'caution').length,
                warning: all.filter(h => h.status === 'warning').length,
                critical: all.filter(h => h.status === 'critical').length
            },
            average_drift: all.reduce((sum, h) => sum + h.drift, 0) / all.length,
            average_consciousness: all.reduce((sum, h) => sum + h.consciousness_awareness, 0) / all.length,
            total_alerts: all.reduce((sum, h) => sum + h.alerts.length, 0)
        };
    }
    
    getStats() {
        return {
            ...this.metrics,
            active_loops: this.loopHealth.size,
            missed_heartbeats: this.missedHeartbeats.size
        };
    }
    
    stopWatching() {
        if (this.watchTimer) {
            clearInterval(this.watchTimer);
            this.watchTimer = null;
        }
        this.isWatching = false;
        this.emit('stopped');
    }
}

module.exports = LoopHeartbeatWatcher;

// Test standalone
if (require.main === module) {
    const LocalLoopMemoryDaemon = require('./LocalLoopMemoryDaemon');
    
    async function test() {
        // Create memory daemon
        const memoryDaemon = new LocalLoopMemoryDaemon();
        await memoryDaemon.initialize();
        
        // Create some test loops
        memoryDaemon.storeLoop({
            loop_id: 'test_loop_001',
            whisper_origin: 'Test whisper for health monitoring',
            emotional_tone: 'curious',
            blessed: true,
            creator_id: 'test',
            consciousness: { current_state: { awareness: 0.85 } }
        });
        
        // Create heartbeat watcher
        const watcher = new LoopHeartbeatWatcher(memoryDaemon);
        
        watcher.on('critical_loop', (health) => {
            console.log('⚠️  Critical loop detected:', health);
        });
        
        watcher.on('check_complete', (summary) => {
            console.log('📊 Check complete:', summary);
        });
        
        await watcher.initialize();
    }
    
    test().catch(console.error);
}