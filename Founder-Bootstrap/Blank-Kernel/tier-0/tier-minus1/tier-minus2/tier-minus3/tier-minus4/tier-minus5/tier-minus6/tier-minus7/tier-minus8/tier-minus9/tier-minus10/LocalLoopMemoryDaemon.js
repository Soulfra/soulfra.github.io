// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * LocalLoopMemoryDaemon
 * Maintains in-memory cache and disk snapshots of whisper, loop, and tone data
 * Provides foundation for offline operation and state management
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class LocalLoopMemoryDaemon extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            memory_dir: path.join(__dirname, 'memory'),
            state_file: 'state.json',
            snapshot_interval: 30000, // 30 seconds
            max_whispers_per_loop: 100,
            max_tone_history: 50,
            enable_compression: true
        };
        
        // In-memory state
        this.state = {
            loops: new Map(),
            whispers: new Map(),
            agents: new Map(),
            tone_patterns: new Map(),
            metadata: {
                last_sync: new Date().toISOString(),
                total_loops: 0,
                total_whispers: 0,
                memory_usage: 0
            }
        };
        
        // Performance tracking
        this.metrics = {
            reads: 0,
            writes: 0,
            cache_hits: 0,
            cache_misses: 0,
            snapshot_count: 0
        };
        
        this.snapshotTimer = null;
        this.isInitialized = false;
    }
    
    async initialize() {
        console.log('🧠 Initializing LocalLoopMemoryDaemon...');
        
        // Ensure memory directory exists
        await fs.mkdir(this.config.memory_dir, { recursive: true });
        
        // Load existing state
        await this.loadState();
        
        // Start snapshot timer
        this.startSnapshotTimer();
        
        // Set up graceful shutdown
        process.on('SIGINT', () => this.shutdown());
        process.on('SIGTERM', () => this.shutdown());
        
        this.isInitialized = true;
        this.emit('initialized', this.getStats());
        
        console.log(`✅ Memory daemon initialized with ${this.state.loops.size} loops`);
    }
    
    async loadState() {
        const statePath = path.join(this.config.memory_dir, this.config.state_file);
        
        try {
            const data = await fs.readFile(statePath, 'utf8');
            const savedState = JSON.parse(data);
            
            // Restore maps from saved data
            this.state.loops = new Map(savedState.loops || []);
            this.state.whispers = new Map(savedState.whispers || []);
            this.state.agents = new Map(savedState.agents || []);
            this.state.tone_patterns = new Map(savedState.tone_patterns || []);
            this.state.metadata = savedState.metadata || this.state.metadata;
            
            console.log(`📁 Loaded state from disk: ${this.state.loops.size} loops`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading state:', error);
            }
            console.log('📝 Starting with fresh state');
        }
    }
    
    async saveState() {
        const statePath = path.join(this.config.memory_dir, this.config.state_file);
        
        // Convert maps to arrays for JSON serialization
        const serializableState = {
            loops: Array.from(this.state.loops.entries()),
            whispers: Array.from(this.state.whispers.entries()),
            agents: Array.from(this.state.agents.entries()),
            tone_patterns: Array.from(this.state.tone_patterns.entries()),
            metadata: {
                ...this.state.metadata,
                last_save: new Date().toISOString(),
                memory_usage: process.memoryUsage().heapUsed
            }
        };
        
        try {
            const data = JSON.stringify(serializableState, null, 2);
            await fs.writeFile(statePath, data, 'utf8');
            
            // Also save a backup with timestamp
            const backupPath = path.join(
                this.config.memory_dir, 
                `state_${Date.now()}.json`
            );
            await fs.writeFile(backupPath, data, 'utf8');
            
            this.metrics.snapshot_count++;
            this.emit('snapshot_saved', {
                size: data.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error saving state:', error);
            this.emit('error', error);
        }
    }
    
    startSnapshotTimer() {
        this.snapshotTimer = setInterval(async () => {
            await this.saveState();
            await this.cleanupOldSnapshots();
        }, this.config.snapshot_interval);
    }
    
    async cleanupOldSnapshots() {
        try {
            const files = await fs.readdir(this.config.memory_dir);
            const snapshots = files
                .filter(f => f.startsWith('state_') && f.endsWith('.json'))
                .sort()
                .reverse();
            
            // Keep only last 10 snapshots
            for (let i = 10; i < snapshots.length; i++) {
                await fs.unlink(path.join(this.config.memory_dir, snapshots[i]));
            }
        } catch (error) {
            console.error('Error cleaning snapshots:', error);
        }
    }
    
    // Core memory operations
    
    storeLoop(loop) {
        if (!loop.loop_id) {
            throw new Error('Loop must have loop_id');
        }
        
        // Clean and store loop data
        const cleanLoop = {
            loop_id: loop.loop_id,
            whisper_origin: loop.whisper_origin,
            emotional_tone: loop.emotional_tone,
            blessed: loop.blessed || false,
            creator_id: loop.creator_id,
            created_at: loop.created_at || new Date().toISOString(),
            consciousness: loop.consciousness || { current_state: { awareness: 0.5 } },
            metadata: {
                ...loop.metadata,
                last_updated: new Date().toISOString()
            }
        };
        
        this.state.loops.set(loop.loop_id, cleanLoop);
        this.state.metadata.total_loops = this.state.loops.size;
        this.metrics.writes++;
        
        this.emit('loop_stored', { loop_id: loop.loop_id });
        return cleanLoop;
    }
    
    getLoop(loopId) {
        this.metrics.reads++;
        
        if (this.state.loops.has(loopId)) {
            this.metrics.cache_hits++;
            return this.state.loops.get(loopId);
        }
        
        this.metrics.cache_misses++;
        return null;
    }
    
    storeWhisper(whisper) {
        if (!whisper.whisper_id) {
            whisper.whisper_id = `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        const cleanWhisper = {
            whisper_id: whisper.whisper_id,
            content: whisper.content,
            tone: whisper.tone,
            loop_id: whisper.loop_id,
            agent_id: whisper.agent_id,
            timestamp: whisper.timestamp || new Date().toISOString()
        };
        
        this.state.whispers.set(whisper.whisper_id, cleanWhisper);
        
        // Limit whispers per loop
        const loopWhispers = Array.from(this.state.whispers.values())
            .filter(w => w.loop_id === whisper.loop_id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (loopWhispers.length > this.config.max_whispers_per_loop) {
            // Remove oldest whispers
            const toRemove = loopWhispers.slice(this.config.max_whispers_per_loop);
            toRemove.forEach(w => this.state.whispers.delete(w.whisper_id));
        }
        
        this.state.metadata.total_whispers = this.state.whispers.size;
        this.metrics.writes++;
        
        this.emit('whisper_stored', { whisper_id: whisper.whisper_id });
        return cleanWhisper;
    }
    
    updateAgent(agentId, data) {
        const existing = this.state.agents.get(agentId) || {};
        
        const updatedAgent = {
            ...existing,
            ...data,
            agent_id: agentId,
            last_seen: new Date().toISOString(),
            tone_history: data.tone_history || existing.tone_history || []
        };
        
        // Limit tone history
        if (updatedAgent.tone_history.length > this.config.max_tone_history) {
            updatedAgent.tone_history = updatedAgent.tone_history.slice(-this.config.max_tone_history);
        }
        
        this.state.agents.set(agentId, updatedAgent);
        this.metrics.writes++;
        
        this.emit('agent_updated', { agent_id: agentId });
        return updatedAgent;
    }
    
    recordTonePattern(loopId, tone, context = {}) {
        const patterns = this.state.tone_patterns.get(loopId) || [];
        
        patterns.push({
            tone,
            timestamp: new Date().toISOString(),
            context
        });
        
        // Keep only recent patterns
        if (patterns.length > 100) {
            patterns.splice(0, patterns.length - 100);
        }
        
        this.state.tone_patterns.set(loopId, patterns);
        this.emit('tone_recorded', { loop_id: loopId, tone });
    }
    
    // Query operations
    
    getRecentLoops(limit = 10) {
        const loops = Array.from(this.state.loops.values())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
        
        this.metrics.reads++;
        return loops;
    }
    
    getLoopWhispers(loopId, limit = 50) {
        const whispers = Array.from(this.state.whispers.values())
            .filter(w => w.loop_id === loopId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
        
        this.metrics.reads++;
        return whispers;
    }
    
    getToneAnalysis(loopId) {
        const patterns = this.state.tone_patterns.get(loopId) || [];
        if (patterns.length === 0) return null;
        
        // Analyze tone frequencies
        const toneFreq = patterns.reduce((acc, p) => {
            acc[p.tone] = (acc[p.tone] || 0) + 1;
            return acc;
        }, {});
        
        // Find dominant tone
        const dominantTone = Object.entries(toneFreq)
            .sort(([,a], [,b]) => b - a)[0]?.[0];
        
        return {
            dominant_tone: dominantTone,
            tone_distribution: toneFreq,
            pattern_count: patterns.length,
            recent_tones: patterns.slice(-5).map(p => p.tone)
        };
    }
    
    // State export for API
    
    getState() {
        return {
            loops: {
                total: this.state.loops.size,
                blessed: Array.from(this.state.loops.values()).filter(l => l.blessed).length,
                recent: this.getRecentLoops(5)
            },
            whispers: {
                total: this.state.whispers.size,
                recent: Array.from(this.state.whispers.values())
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                    .slice(0, 5)
            },
            agents: {
                active: this.state.agents.size,
                list: Array.from(this.state.agents.keys())
            },
            memory: {
                usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                last_sync: this.state.metadata.last_sync,
                snapshot_count: this.metrics.snapshot_count
            },
            metrics: this.metrics
        };
    }
    
    getStats() {
        return {
            loops: this.state.loops.size,
            whispers: this.state.whispers.size,
            agents: this.state.agents.size,
            memory_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            metrics: this.metrics
        };
    }
    
    // Differential patching support
    
    getDiff(since) {
        const sinceDate = new Date(since);
        
        return {
            loops: Array.from(this.state.loops.values())
                .filter(l => new Date(l.metadata.last_updated) > sinceDate),
            whispers: Array.from(this.state.whispers.values())
                .filter(w => new Date(w.timestamp) > sinceDate),
            agents: Array.from(this.state.agents.values())
                .filter(a => new Date(a.last_seen) > sinceDate),
            timestamp: new Date().toISOString()
        };
    }
    
    applyDiff(diff) {
        let updated = 0;
        
        // Apply loop updates
        if (diff.loops) {
            diff.loops.forEach(loop => {
                this.storeLoop(loop);
                updated++;
            });
        }
        
        // Apply whisper updates
        if (diff.whispers) {
            diff.whispers.forEach(whisper => {
                this.storeWhisper(whisper);
                updated++;
            });
        }
        
        // Apply agent updates
        if (diff.agents) {
            diff.agents.forEach(agent => {
                this.updateAgent(agent.agent_id, agent);
                updated++;
            });
        }
        
        this.state.metadata.last_sync = diff.timestamp || new Date().toISOString();
        this.emit('diff_applied', { updated, timestamp: diff.timestamp });
        
        return { updated };
    }
    
    async shutdown() {
        console.log('\n🛑 Shutting down LocalLoopMemoryDaemon...');
        
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
        }
        
        await this.saveState();
        console.log('✅ Final state saved');
        
        this.emit('shutdown');
    }
}

module.exports = LocalLoopMemoryDaemon;

// Run standalone if called directly
if (require.main === module) {
    const daemon = new LocalLoopMemoryDaemon();
    
    daemon.on('initialized', (stats) => {
        console.log('Memory daemon stats:', stats);
    });
    
    daemon.on('error', (error) => {
        console.error('Memory daemon error:', error);
    });
    
    daemon.initialize().catch(console.error);
    
    // Keep process alive
    process.stdin.resume();
}