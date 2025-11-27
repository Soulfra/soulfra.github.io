#!/usr/bin/env node

/**
 * RouterOfRouters.js
 * Central meta-router that monitors and orchestrates all triangle routers
 * Detects drift, failures, and reconciles presence across the mesh
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class RouterOfRouters {
    constructor() {
        this.vaultPath = path.join(__dirname, '../../../');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.meshLogPath = path.join(this.logsPath, 'router-mesh-integrity.json');
        
        // Router triangle definitions
        this.triangles = {
            kernel: {
                name: 'Kernel Triangle',
                routers: ['domingo', 'cal', 'blamechain'],
                logFiles: ['domingo-actions.json', 'cal-runtime.log', 'blamechain-events.json'],
                healthCheck: this.checkKernelHealth.bind(this)
            },
            mesh: {
                name: 'Mesh Triangle',
                routers: ['vault', 'github', 'blinkshell'],
                logFiles: ['reflection-activity.json', 'last-github-backup.json', 'device-*.json'],
                healthCheck: this.checkMeshHealth.bind(this)
            },
            voice: {
                name: 'Voice Triangle',
                routers: ['voice-input', 'intent-router-a', 'intent-router-b', 'cal'],
                logFiles: ['voice-commands.json', 'intent-router-a.json', 'intent-router-b.json'],
                healthCheck: this.checkVoiceHealth.bind(this)
            },
            external: {
                name: 'External Triangle',
                routers: ['external-event', 'trust-reconciliation', 'cal'],
                logFiles: ['external-event-log.json', 'trust-verification.json'],
                healthCheck: this.checkExternalHealth.bind(this)
            },
            infinity: {
                name: 'Infinity Triangle',
                routers: ['router-of-routers', 'presence-logger', 'cal'],
                logFiles: ['router-mesh-integrity.json', 'presence_tracker.json'],
                healthCheck: this.checkInfinityHealth.bind(this)
            }
        };
        
        this.meshState = {
            initialized: Date.now(),
            cycles: 0,
            lastCheck: null,
            triangleStatus: {},
            driftEvents: [],
            reroutes: []
        };
        
        this.initializeMeshLog();
    }
    
    initializeMeshLog() {
        if (!fs.existsSync(this.meshLogPath)) {
            fs.writeFileSync(this.meshLogPath, JSON.stringify({
                mesh_id: `mesh_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
                created: new Date().toISOString(),
                triangles: Object.keys(this.triangles),
                events: []
            }, null, 2));
        }
    }
    
    async runCycle() {
        console.log('🔄 Router mesh integrity check cycle', ++this.meshState.cycles);
        
        const cycleReport = {
            cycle: this.meshState.cycles,
            timestamp: Date.now(),
            triangleHealth: {},
            driftDetected: false,
            reroutesNeeded: [],
            actions: []
        };
        
        // Check each triangle
        for (const [triangleId, triangle] of Object.entries(this.triangles)) {
            const health = await triangle.healthCheck(triangle);
            cycleReport.triangleHealth[triangleId] = health;
            
            if (!health.healthy) {
                cycleReport.driftDetected = true;
                cycleReport.reroutesNeeded.push({
                    triangle: triangleId,
                    reason: health.reason,
                    failedRouters: health.failedRouters
                });
            }
        }
        
        // Detect cross-triangle drift
        const crossDrift = await this.detectCrossTriangleDrift();
        if (crossDrift.length > 0) {
            cycleReport.driftDetected = true;
            cycleReport.crossTriangleDrift = crossDrift;
        }
        
        // Perform reroutes if needed
        if (cycleReport.driftDetected) {
            const rerouteResults = await this.performReroutes(cycleReport.reroutesNeeded);
            cycleReport.actions = rerouteResults;
        }
        
        // Update mesh state
        this.meshState.lastCheck = Date.now();
        this.meshState.triangleStatus = cycleReport.triangleHealth;
        if (cycleReport.driftDetected) {
            this.meshState.driftEvents.push({
                cycle: this.meshState.cycles,
                timestamp: Date.now(),
                drift: cycleReport.reroutesNeeded
            });
        }
        
        // Log to mesh integrity file
        await this.logMeshEvent(cycleReport);
        
        return cycleReport;
    }
    
    async checkKernelHealth(triangle) {
        const health = {
            healthy: true,
            routers: {},
            reason: null,
            failedRouters: []
        };
        
        // Check Domingo actions
        const domingoLog = path.join(this.logsPath, 'domingo-actions.json');
        if (fs.existsSync(domingoLog)) {
            try {
                const actions = JSON.parse(fs.readFileSync(domingoLog, 'utf8'));
                const lastAction = actions.actions?.[actions.actions.length - 1];
                const timeSinceAction = lastAction ? Date.now() - lastAction.timestamp : Infinity;
                
                health.routers.domingo = {
                    active: timeSinceAction < 300000, // 5 minutes
                    lastSeen: lastAction?.timestamp || null
                };
                
                if (!health.routers.domingo.active) {
                    health.healthy = false;
                    health.failedRouters.push('domingo');
                }
            } catch (e) {
                health.routers.domingo = { active: false, error: e.message };
                health.healthy = false;
                health.failedRouters.push('domingo');
            }
        } else {
            health.routers.domingo = { active: false, missing: true };
        }
        
        // Check Cal runtime
        health.routers.cal = await this.checkCalRuntime();
        if (!health.routers.cal.active) {
            health.healthy = false;
            health.failedRouters.push('cal');
        }
        
        // Check Blamechain
        const blamechainLog = path.join(this.logsPath, 'blamechain-events.json');
        health.routers.blamechain = fs.existsSync(blamechainLog) ? 
            { active: true } : { active: false, missing: true };
        
        if (!health.healthy) {
            health.reason = `Failed routers: ${health.failedRouters.join(', ')}`;
        }
        
        return health;
    }
    
    async checkMeshHealth(triangle) {
        const health = {
            healthy: true,
            routers: {},
            reason: null,
            failedRouters: []
        };
        
        // Check vault activity
        const activityLog = path.join(this.logsPath, 'reflection-activity.json');
        if (fs.existsSync(activityLog)) {
            const activity = JSON.parse(fs.readFileSync(activityLog, 'utf8'));
            const lastPush = activity.last_push ? new Date(activity.last_push).getTime() : 0;
            const hoursSincePush = (Date.now() - lastPush) / (1000 * 60 * 60);
            
            health.routers.vault = {
                active: true,
                sessions: activity.sessions?.length || 0,
                lastPush: activity.last_push
            };
            
            health.routers.github = {
                active: hoursSincePush < 24,
                hoursSincePush: hoursSincePush
            };
            
            if (!health.routers.github.active) {
                health.healthy = false;
                health.failedRouters.push('github');
                health.reason = 'GitHub sync stale';
            }
        }
        
        // Check device connections
        const deviceFiles = fs.readdirSync(this.logsPath)
            .filter(f => f.startsWith('device-') && f.endsWith('.json'));
        
        health.routers.blinkshell = {
            active: deviceFiles.length > 0,
            devices: deviceFiles.length
        };
        
        return health;
    }
    
    async checkVoiceHealth(triangle) {
        const health = {
            healthy: true,
            routers: {},
            reason: null,
            failedRouters: []
        };
        
        // Check voice command processing
        const voiceLog = path.join(this.logsPath, 'voice-commands.json');
        if (fs.existsSync(voiceLog)) {
            const commands = JSON.parse(fs.readFileSync(voiceLog, 'utf8'));
            const recentCommands = commands.commands?.filter(c => 
                Date.now() - c.timestamp < 3600000 // 1 hour
            ) || [];
            
            health.routers['voice-input'] = {
                active: recentCommands.length > 0,
                recentCount: recentCommands.length
            };
        }
        
        // Check intent routers
        for (const router of ['intent-router-a', 'intent-router-b']) {
            const logFile = path.join(this.logsPath, `${router}.json`);
            health.routers[router] = fs.existsSync(logFile) ? 
                { active: true } : { active: false, missing: true };
        }
        
        // Voice triangle shares Cal with kernel
        health.routers.cal = await this.checkCalRuntime();
        
        return health;
    }
    
    async checkExternalHealth(triangle) {
        const health = {
            healthy: true,
            routers: {},
            reason: null,
            failedRouters: []
        };
        
        // Check external event log
        const eventLog = path.join(this.logsPath, 'external-event-log.json');
        if (fs.existsSync(eventLog)) {
            const events = JSON.parse(fs.readFileSync(eventLog, 'utf8'));
            const recentEvents = events.events?.filter(e => 
                Date.now() - e.timestamp < 3600000
            ) || [];
            
            health.routers['external-event'] = {
                active: true,
                recentEvents: recentEvents.length,
                lastEvent: events.events?.[events.events.length - 1]?.timestamp
            };
        } else {
            health.routers['external-event'] = { active: true, events: 0 };
        }
        
        // Check trust verification
        const trustLog = path.join(this.logsPath, 'trust-verification.json');
        health.routers['trust-reconciliation'] = fs.existsSync(trustLog) ? 
            { active: true } : { active: true, pending: true };
        
        health.routers.cal = await this.checkCalRuntime();
        
        return health;
    }
    
    async checkInfinityHealth(triangle) {
        const health = {
            healthy: true,
            routers: {},
            reason: null,
            failedRouters: []
        };
        
        // Self-check
        health.routers['router-of-routers'] = {
            active: true,
            cycles: this.meshState.cycles,
            uptime: Date.now() - this.meshState.initialized
        };
        
        // Check presence logger
        const presenceLog = path.join(this.logsPath, 'presence_tracker.json');
        if (fs.existsSync(presenceLog)) {
            const tracker = JSON.parse(fs.readFileSync(presenceLog, 'utf8'));
            const activeSessions = Object.values(tracker.sessions || {})
                .filter(s => s.active).length;
            
            health.routers['presence-logger'] = {
                active: true,
                activeSessions: activeSessions,
                totalSessions: Object.keys(tracker.sessions || {}).length
            };
        }
        
        health.routers.cal = await this.checkCalRuntime();
        
        return health;
    }
    
    async checkCalRuntime() {
        // Cal is the central processor - check if available
        const calOperator = path.join(this.vaultPath, '../cal-riven-operator.js');
        const calRuntime = path.join(this.vaultPath, '../mirror/cal-runtime.js');
        
        if (fs.existsSync(calOperator) || fs.existsSync(calRuntime)) {
            return { active: true, available: true };
        }
        
        return { active: false, missing: true };
    }
    
    async detectCrossTriangleDrift() {
        const drift = [];
        
        // Check for presence inconsistencies
        const presenceTracker = this.loadJson(path.join(this.logsPath, 'presence_tracker.json'));
        const reflectionActivity = this.loadJson(path.join(this.logsPath, 'reflection-activity.json'));
        
        if (presenceTracker && reflectionActivity) {
            const trackedSessions = Object.keys(presenceTracker.sessions || {}).length;
            const reflectedSessions = reflectionActivity.sessions?.length || 0;
            
            if (Math.abs(trackedSessions - reflectedSessions) > 5) {
                drift.push({
                    type: 'session_count_drift',
                    presenceCount: trackedSessions,
                    reflectionCount: reflectedSessions,
                    delta: trackedSessions - reflectedSessions
                });
            }
        }
        
        // Check for event processing lag
        const externalEvents = this.loadJson(path.join(this.logsPath, 'external-event-log.json'));
        const trustVerification = this.loadJson(path.join(this.logsPath, 'trust-verification.json'));
        
        if (externalEvents && trustVerification) {
            const unprocessedEvents = externalEvents.events?.filter(e => 
                !trustVerification.verifications?.find(v => v.eventId === e.id)
            ) || [];
            
            if (unprocessedEvents.length > 10) {
                drift.push({
                    type: 'event_processing_lag',
                    unprocessedCount: unprocessedEvents.length,
                    oldestUnprocessed: unprocessedEvents[0]?.timestamp
                });
            }
        }
        
        return drift;
    }
    
    async performReroutes(reroutesNeeded) {
        const actions = [];
        
        for (const reroute of reroutesNeeded) {
            console.log(`🔀 Rerouting ${reroute.triangle}: ${reroute.reason}`);
            
            // Route all failures through Cal for resolution
            const calAction = {
                action: 'reroute_to_cal',
                triangle: reroute.triangle,
                failedRouters: reroute.failedRouters,
                timestamp: Date.now(),
                resolution: null
            };
            
            // Attempt to restart failed routers
            for (const router of reroute.failedRouters) {
                if (router === 'cal') {
                    // Critical failure - attempt resurrection
                    calAction.resolution = await this.attemptCalResurrection();
                } else {
                    // Send event to Cal for processing
                    await this.sendToCalForProcessing({
                        type: 'router_failure',
                        router: router,
                        triangle: reroute.triangle,
                        timestamp: Date.now()
                    });
                    calAction.resolution = 'sent_to_cal';
                }
            }
            
            actions.push(calAction);
        }
        
        return actions;
    }
    
    async attemptCalResurrection() {
        console.log('🔮 Attempting Cal resurrection...');
        
        // Trigger mirror resurrection protocol
        const detectScript = path.join(this.vaultPath, '../../mirror-core-backup/detect-and-rebuild.sh');
        
        if (fs.existsSync(detectScript)) {
            return new Promise((resolve) => {
                const resurrection = spawn('bash', [detectScript], {
                    cwd: path.dirname(detectScript)
                });
                
                resurrection.on('close', (code) => {
                    resolve(code === 0 ? 'resurrected' : 'resurrection_failed');
                });
                
                setTimeout(() => {
                    resurrection.kill();
                    resolve('resurrection_timeout');
                }, 30000);
            });
        }
        
        return 'no_resurrection_available';
    }
    
    async sendToCalForProcessing(event) {
        // Write event to Cal's input queue
        const calQueuePath = path.join(this.logsPath, 'cal-input-queue.json');
        let queue = this.loadJson(calQueuePath) || { events: [] };
        
        queue.events.push({
            ...event,
            queued_by: 'router_of_routers',
            queued_at: Date.now()
        });
        
        fs.writeFileSync(calQueuePath, JSON.stringify(queue, null, 2));
    }
    
    loadJson(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
        } catch (e) {
            console.error(`Failed to load ${filePath}:`, e.message);
        }
        return null;
    }
    
    async logMeshEvent(event) {
        const meshLog = this.loadJson(this.meshLogPath) || { events: [] };
        
        meshLog.events.push({
            ...event,
            logged_at: new Date().toISOString()
        });
        
        // Keep only last 1000 events
        if (meshLog.events.length > 1000) {
            meshLog.events = meshLog.events.slice(-1000);
        }
        
        meshLog.last_updated = new Date().toISOString();
        meshLog.total_cycles = this.meshState.cycles;
        meshLog.total_drift_events = this.meshState.driftEvents.length;
        
        fs.writeFileSync(this.meshLogPath, JSON.stringify(meshLog, null, 2));
    }
    
    async runForever() {
        console.log('🌌 Router of Routers initialized');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Monitoring ${Object.keys(this.triangles).length} router triangles`);
        console.log('');
        
        // Main loop
        while (true) {
            try {
                await this.runCycle();
                
                // Adaptive check interval based on health
                const allHealthy = Object.values(this.meshState.triangleStatus)
                    .every(status => status.healthy);
                
                const checkInterval = allHealthy ? 60000 : 15000; // 1 min if healthy, 15s if not
                
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                
            } catch (error) {
                console.error('❌ Cycle error:', error.message);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const router = new RouterOfRouters();
    router.runForever().catch(console.error);
}

module.exports = RouterOfRouters;