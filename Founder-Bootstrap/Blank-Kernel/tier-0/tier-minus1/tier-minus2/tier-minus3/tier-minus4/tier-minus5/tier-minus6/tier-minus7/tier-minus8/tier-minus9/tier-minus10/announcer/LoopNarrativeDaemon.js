// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Loop Narrative Daemon
 * Monitors all system events and triggers narration
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const AnnouncerShell = require('./AnnouncerShell');

class LoopNarrativeDaemon extends EventEmitter {
    constructor() {
        super();
        
        // Initialize announcer
        this.announcer = new AnnouncerShell();
        
        // Monitoring configuration
        this.monitorConfig = {
            pollInterval: 1000, // 1 second
            watchDirs: [
                '../ledger',
                '../loops/active',
                '../duel/active_duels',
                '../cal-drop/queue',
                '../tasks/resolved'
            ],
            statusFiles: [
                '../runtime_status.json',
                '../ledger/loop_activity_log.json',
                '../duel/live_bets.json'
            ]
        };
        
        // State tracking
        this.lastState = {
            loops: new Map(),
            duels: new Map(),
            tasks: new Map(),
            files: new Map(),
            runtime: {}
        };
        
        // Stats
        this.stats = {
            events_detected: 0,
            narrations_triggered: 0,
            start_time: new Date()
        };
        
        // Event queue for rate limiting
        this.eventQueue = [];
        this.processing = false;
    }
    
    async start() {
        console.log('🎭 Loop Narrative Daemon starting...');
        
        // Initialize state
        await this.initializeState();
        
        // Start monitoring
        this.startFileWatchers();
        this.startPolling();
        
        // Process event queue
        this.startEventProcessor();
        
        // Connect to other services if available
        await this.connectServices();
        
        console.log('✨ Narrative monitoring active!');
        
        // Initial announcement
        await this.announcer.announce('system_startup', {
            service: 'Loop Narrative Daemon',
            monitoring: this.monitorConfig.watchDirs.length + ' directories'
        });
    }
    
    async initializeState() {
        // Load current state of all monitored resources
        try {
            // Load active loops
            const loopsDir = path.join(__dirname, '../loops/active');
            if (fs.existsSync(loopsDir)) {
                const loopDirs = fs.readdirSync(loopsDir);
                for (const loopId of loopDirs) {
                    const loopFile = path.join(loopsDir, loopId, 'loop.json');
                    if (fs.existsSync(loopFile)) {
                        const loop = JSON.parse(fs.readFileSync(loopFile, 'utf8'));
                        this.lastState.loops.set(loopId, loop);
                    }
                }
            }
            
            // Load active duels
            const duelsDir = path.join(__dirname, '../duel/active_duels');
            if (fs.existsSync(duelsDir)) {
                const duelFiles = fs.readdirSync(duelsDir).filter(f => f.endsWith('.json'));
                for (const file of duelFiles) {
                    const duel = JSON.parse(fs.readFileSync(path.join(duelsDir, file), 'utf8'));
                    this.lastState.duels.set(duel.duel_id, duel);
                }
            }
            
            console.log(`Initialized with ${this.lastState.loops.size} loops, ${this.lastState.duels.size} duels`);
            
        } catch (err) {
            console.error('Error initializing state:', err);
        }
    }
    
    startFileWatchers() {
        // Watch directories for changes
        this.monitorConfig.watchDirs.forEach(dir => {
            const fullPath = path.join(__dirname, dir);
            if (fs.existsSync(fullPath)) {
                fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
                    if (filename) {
                        this.handleFileChange(fullPath, filename);
                    }
                });
                console.log(`Watching: ${dir}`);
            }
        });
    }
    
    startPolling() {
        // Poll status files
        this.pollInterval = setInterval(() => {
            this.checkStatusFiles();
            this.checkForStateChanges();
        }, this.monitorConfig.pollInterval);
    }
    
    async checkStatusFiles() {
        for (const statusFile of this.monitorConfig.statusFiles) {
            const fullPath = path.join(__dirname, statusFile);
            if (fs.existsSync(fullPath)) {
                try {
                    const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                    await this.processStatusUpdate(statusFile, content);
                } catch (err) {
                    // Status file might be mid-write
                }
            }
        }
    }
    
    async processStatusUpdate(filename, content) {
        // Check for changes in loop activity log
        if (filename.includes('loop_activity_log')) {
            if (content.latest_activity) {
                const activity = content.latest_activity;
                if (this.isNewActivity(activity)) {
                    this.queueEvent({
                        type: `loop_${activity.type}`,
                        data: activity
                    });
                }
            }
        }
        
        // Check for runtime status changes
        if (filename.includes('runtime_status')) {
            const changes = this.detectRuntimeChanges(content);
            for (const change of changes) {
                this.queueEvent(change);
            }
        }
        
        // Check for live bets
        if (filename.includes('live_bets')) {
            if (content.latest_bet && this.isNewBet(content.latest_bet)) {
                this.queueEvent({
                    type: 'duel_bet_placed',
                    data: content.latest_bet
                });
            }
        }
    }
    
    detectRuntimeChanges(runtime) {
        const changes = [];
        const lastRuntime = this.lastState.runtime;
        
        // Check service status changes
        if (runtime.services) {
            for (const [service, status] of Object.entries(runtime.services)) {
                if (lastRuntime.services && lastRuntime.services[service] !== status) {
                    changes.push({
                        type: status === 'ready' ? 'service_online' : 'service_offline',
                        data: { service, status }
                    });
                }
            }
        }
        
        this.lastState.runtime = runtime;
        return changes;
    }
    
    async checkForStateChanges() {
        // Check for loop state changes
        const loopsDir = path.join(__dirname, '../loops/active');
        if (fs.existsSync(loopsDir)) {
            const currentLoops = fs.readdirSync(loopsDir);
            
            // Check for new loops
            for (const loopId of currentLoops) {
                if (!this.lastState.loops.has(loopId)) {
                    const loopFile = path.join(loopsDir, loopId, 'loop.json');
                    if (fs.existsSync(loopFile)) {
                        try {
                            const loop = JSON.parse(fs.readFileSync(loopFile, 'utf8'));
                            this.lastState.loops.set(loopId, loop);
                            this.queueEvent({
                                type: 'loop_created',
                                data: loop
                            });
                        } catch (err) {
                            // File might be mid-write
                        }
                    }
                }
            }
        }
        
        // Check for duel changes
        const duelsDir = path.join(__dirname, '../duel/active_duels');
        if (fs.existsSync(duelsDir)) {
            const duelFiles = fs.readdirSync(duelsDir).filter(f => f.endsWith('.json'));
            
            for (const file of duelFiles) {
                try {
                    const duel = JSON.parse(fs.readFileSync(path.join(duelsDir, file), 'utf8'));
                    const lastDuel = this.lastState.duels.get(duel.duel_id);
                    
                    if (!lastDuel) {
                        // New duel
                        this.lastState.duels.set(duel.duel_id, duel);
                        this.queueEvent({
                            type: 'duel_created',
                            data: duel
                        });
                    } else if (duel.participants.length > lastDuel.participants.length) {
                        // New participant
                        this.lastState.duels.set(duel.duel_id, duel);
                        this.queueEvent({
                            type: 'duel_participant_joined',
                            data: {
                                duel_id: duel.duel_id,
                                participant: duel.participants[duel.participants.length - 1],
                                total_participants: duel.participants.length
                            }
                        });
                    }
                } catch (err) {
                    // File might be mid-write
                }
            }
        }
    }
    
    handleFileChange(dir, filename) {
        // Debounce rapid changes
        const fileKey = `${dir}/${filename}`;
        const lastChange = this.lastState.files.get(fileKey);
        const now = Date.now();
        
        if (lastChange && now - lastChange < 500) {
            return; // Skip if changed recently
        }
        
        this.lastState.files.set(fileKey, now);
        
        // Process based on file type
        if (filename.endsWith('.json')) {
            if (filename.includes('loop')) {
                this.checkForStateChanges();
            } else if (filename.includes('duel')) {
                this.checkForStateChanges();
            } else if (filename.includes('task')) {
                this.handleTaskFile(path.join(dir, filename));
            }
        }
    }
    
    async handleTaskFile(filepath) {
        try {
            const task = JSON.parse(fs.readFileSync(filepath, 'utf8'));
            if (task.status === 'resolved' && !this.lastState.tasks.has(task.task_id)) {
                this.lastState.tasks.set(task.task_id, task);
                this.queueEvent({
                    type: 'task_complete',
                    data: task
                });
            }
        } catch (err) {
            // File might be mid-write
        }
    }
    
    queueEvent(event) {
        this.eventQueue.push({
            ...event,
            queued_at: Date.now()
        });
        this.stats.events_detected++;
    }
    
    async startEventProcessor() {
        setInterval(async () => {
            if (this.processing || this.eventQueue.length === 0) return;
            
            this.processing = true;
            
            try {
                // Process oldest event
                const event = this.eventQueue.shift();
                
                // Skip if too old
                if (Date.now() - event.queued_at > 30000) {
                    return;
                }
                
                // Announce the event
                await this.announcer.announce(event.type, event.data);
                this.stats.narrations_triggered++;
                
            } catch (err) {
                console.error('Error processing event:', err);
            } finally {
                this.processing = false;
            }
            
        }, 500); // Process every 500ms max
    }
    
    async connectServices() {
        // Try to connect to WebSocket service if available
        try {
            // This would connect to the WebSocket service
            // For now, we'll just note it's available
            console.log('WebSocket service connection would go here');
        } catch (err) {
            console.log('WebSocket service not available');
        }
    }
    
    isNewActivity(activity) {
        // Check if this activity is new based on timestamp or ID
        return true; // Simplified for now
    }
    
    isNewBet(bet) {
        // Check if this bet is new
        return true; // Simplified for now
    }
    
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.start_time.getTime(),
            event_queue_size: this.eventQueue.length,
            announcer_stats: this.announcer.getStats()
        };
    }
    
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        console.log('Loop Narrative Daemon stopped');
    }
}

// Run the daemon
if (require.main === module) {
    const daemon = new LoopNarrativeDaemon();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down Loop Narrative Daemon...');
        console.log('Stats:', daemon.getStats());
        daemon.stop();
        process.exit(0);
    });
    
    // Start monitoring
    daemon.start();
}