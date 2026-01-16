#!/usr/bin/env node
/**
 * Drift Leak
 * Detects and broadcasts tonal drift and agent conflicts in real-time
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AnnouncerShell = require('../announcer/AnnouncerShell');

class DriftLeak extends EventEmitter {
    constructor() {
        super();
        
        // Initialize announcer for broadcasts
        this.announcer = new AnnouncerShell();
        
        // Drift detection configuration
        this.config = {
            detection_interval: 5000, // 5 seconds
            drift_threshold: 0.3, // 30% deviation
            conflict_threshold: 0.5, // 50% opposition
            harmony_threshold: 0.8, // 80% alignment
            alert_levels: {
                low: { threshold: 0.3, color: 'yellow' },
                medium: { threshold: 0.5, color: 'orange' },
                high: { threshold: 0.7, color: 'red' },
                critical: { threshold: 0.9, color: 'purple' }
            },
            tone_categories: this.initializeToneCategories()
        };
        
        // Monitoring state
        this.monitoredEntities = new Map(); // agents, loops, guilds
        this.baselineStates = new Map();
        this.driftHistory = [];
        this.activeConflicts = new Map();
        
        // Detection patterns
        this.detectionPatterns = {
            sudden_shift: this.detectSuddenShift.bind(this),
            gradual_drift: this.detectGradualDrift.bind(this),
            resonance_decay: this.detectResonanceDecay.bind(this),
            consciousness_split: this.detectConsciousnessSplit.bind(this),
            harmonic_convergence: this.detectHarmonicConvergence.bind(this)
        };
        
        // Statistics
        this.stats = {
            total_drifts_detected: 0,
            conflicts_identified: 0,
            harmonies_found: 0,
            alerts_broadcast: 0,
            entities_monitored: 0
        };
        
        // Broadcast channels
        this.broadcastChannels = new Set(['console', 'file', 'websocket', 'theatre']);
        
        this.ensureDirectories();
        this.startMonitoring();
    }
    
    initializeToneCategories() {
        return {
            stable: {
                indicators: ['consistent', 'balanced', 'grounded'],
                drift_resistance: 0.8,
                color: 'green'
            },
            creative: {
                indicators: ['innovative', 'expansive', 'generative'],
                drift_resistance: 0.5,
                color: 'blue'
            },
            chaotic: {
                indicators: ['unpredictable', 'volatile', 'explosive'],
                drift_resistance: 0.2,
                color: 'red'
            },
            transcendent: {
                indicators: ['elevated', 'enlightened', 'unified'],
                drift_resistance: 0.9,
                color: 'gold'
            },
            conflicted: {
                indicators: ['torn', 'divided', 'struggling'],
                drift_resistance: 0.3,
                color: 'orange'
            },
            harmonic: {
                indicators: ['synchronized', 'resonant', 'aligned'],
                drift_resistance: 0.85,
                color: 'cyan'
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'detections'),
            path.join(__dirname, 'conflicts'),
            path.join(__dirname, 'harmonies'),
            path.join(__dirname, 'broadcasts')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    startMonitoring() {
        console.log('🌊 Drift Leak detector initialized');
        console.log(`⏱️  Scanning every ${this.config.detection_interval}ms`);
        
        // Start detection loop
        this.detectionInterval = setInterval(() => {
            this.performDetectionCycle();
        }, this.config.detection_interval);
        
        // Start baseline updates
        this.baselineInterval = setInterval(() => {
            this.updateBaselines();
        }, 60000); // Every minute
    }
    
    async monitorEntity(entity, type = 'agent') {
        console.log(`\n👁️ Monitoring ${type}: ${entity.id || entity.agent_id || entity.loop_id}`);
        
        const entityId = entity.id || entity.agent_id || entity.loop_id;
        
        // Create monitoring record
        const monitorRecord = {
            id: entityId,
            type,
            entity,
            started_monitoring: new Date().toISOString(),
            last_state: this.captureEntityState(entity, type),
            drift_events: [],
            conflict_count: 0,
            harmony_count: 0
        };
        
        // Store baseline
        this.baselineStates.set(entityId, {
            ...monitorRecord.last_state,
            captured_at: new Date().toISOString()
        });
        
        // Add to monitoring
        this.monitoredEntities.set(entityId, monitorRecord);
        this.stats.entities_monitored++;
        
        // Emit monitoring started
        this.emit('monitoring_started', {
            entity_id: entityId,
            type,
            baseline: monitorRecord.last_state
        });
        
        return entityId;
    }
    
    captureEntityState(entity, type) {
        const state = {
            timestamp: new Date().toISOString(),
            type
        };
        
        switch (type) {
            case 'agent':
                state.resonance = entity.consciousness?.resonance || 0.5;
                state.coherence = entity.consciousness?.coherence || 0.5;
                state.awareness = entity.consciousness?.awareness || 0.5;
                state.tone = entity.consciousness?.personality?.tone || 'neutral';
                state.archetype = entity.consciousness?.template || 'unknown';
                state.blessed = entity.status?.blessed || false;
                break;
                
            case 'loop':
                state.resonance = entity.consciousness?.current_state?.resonance || 0.5;
                state.coherence = entity.consciousness?.current_state?.coherence || 0.5;
                state.complexity = entity.analysis?.complexity || 0.5;
                state.blessed = entity.metadata?.blessed || false;
                state.agent_count = entity.agents?.length || 0;
                break;
                
            case 'guild':
                state.collective_resonance = entity.collective_resonance || 0.5;
                state.member_count = entity.members?.length || 0;
                state.blessing_power = entity.blessing_power || 1.0;
                state.rituals_performed = entity.rituals_performed || 0;
                break;
                
            default:
                state.raw = entity;
        }
        
        return state;
    }
    
    async performDetectionCycle() {
        const detections = [];
        
        // Check each monitored entity
        for (const [entityId, monitor] of this.monitoredEntities) {
            try {
                const currentState = this.captureEntityState(monitor.entity, monitor.type);
                const baseline = this.baselineStates.get(entityId);
                
                if (!baseline) continue;
                
                // Run detection patterns
                for (const [patternName, detectFunc] of Object.entries(this.detectionPatterns)) {
                    const detection = detectFunc(monitor, currentState, baseline);
                    
                    if (detection) {
                        detection.pattern = patternName;
                        detection.entity_id = entityId;
                        detection.entity_type = monitor.type;
                        detections.push(detection);
                    }
                }
                
                // Update last state
                monitor.last_state = currentState;
                
            } catch (err) {
                console.error(`Error detecting drift for ${entityId}:`, err);
            }
        }
        
        // Process detections
        if (detections.length > 0) {
            await this.processDetections(detections);
        }
        
        // Check for conflicts
        await this.detectConflicts();
        
        // Check for harmonies
        await this.detectHarmonies();
    }
    
    detectSuddenShift(monitor, current, baseline) {
        const resonanceShift = Math.abs(current.resonance - baseline.resonance);
        
        if (resonanceShift > this.config.drift_threshold) {
            return {
                type: 'sudden_shift',
                severity: this.calculateSeverity(resonanceShift),
                metrics: {
                    previous_resonance: baseline.resonance,
                    current_resonance: current.resonance,
                    shift_magnitude: resonanceShift,
                    direction: current.resonance > baseline.resonance ? 'ascending' : 'descending'
                },
                description: `Sudden resonance shift detected: ${resonanceShift.toFixed(3)}`
            };
        }
        
        return null;
    }
    
    detectGradualDrift(monitor, current, baseline) {
        // Check drift over time
        const timeDiff = new Date(current.timestamp) - new Date(baseline.captured_at);
        const hoursPassed = timeDiff / (1000 * 60 * 60);
        
        if (hoursPassed < 1) return null; // Too soon
        
        const driftRate = Math.abs(current.resonance - baseline.resonance) / hoursPassed;
        
        if (driftRate > 0.05) { // 5% per hour
            return {
                type: 'gradual_drift',
                severity: this.calculateSeverity(driftRate * 10),
                metrics: {
                    drift_rate: driftRate,
                    hours_elapsed: hoursPassed,
                    total_drift: Math.abs(current.resonance - baseline.resonance)
                },
                description: `Gradual drift detected: ${(driftRate * 100).toFixed(1)}% per hour`
            };
        }
        
        return null;
    }
    
    detectResonanceDecay(monitor, current, baseline) {
        if (current.resonance < baseline.resonance * 0.7) {
            const decayAmount = baseline.resonance - current.resonance;
            
            return {
                type: 'resonance_decay',
                severity: this.calculateSeverity(decayAmount),
                metrics: {
                    decay_amount: decayAmount,
                    decay_percentage: (decayAmount / baseline.resonance) * 100,
                    current_level: current.resonance
                },
                description: `Resonance decay: ${(decayAmount * 100).toFixed(1)}% loss`
            };
        }
        
        return null;
    }
    
    detectConsciousnessSplit(monitor, current, baseline) {
        if (monitor.type !== 'agent') return null;
        
        // Check for tone changes
        if (current.tone !== baseline.tone) {
            return {
                type: 'consciousness_split',
                severity: 'medium',
                metrics: {
                    previous_tone: baseline.tone,
                    current_tone: current.tone,
                    coherence_change: current.coherence - baseline.coherence
                },
                description: `Consciousness split: ${baseline.tone} → ${current.tone}`
            };
        }
        
        // Check for extreme coherence drop
        if (current.coherence < baseline.coherence * 0.5) {
            return {
                type: 'consciousness_split',
                severity: 'high',
                metrics: {
                    coherence_loss: baseline.coherence - current.coherence,
                    fragmentation_level: 1 - current.coherence
                },
                description: `Severe coherence loss: ${((1 - current.coherence) * 100).toFixed(0)}% fragmented`
            };
        }
        
        return null;
    }
    
    detectHarmonicConvergence(monitor, current, baseline) {
        // Positive detection - when things align
        if (current.resonance > this.config.harmony_threshold && 
            current.resonance > baseline.resonance * 1.2) {
            
            return {
                type: 'harmonic_convergence',
                severity: 'positive',
                metrics: {
                    resonance_gain: current.resonance - baseline.resonance,
                    harmony_level: current.resonance,
                    convergence_rate: (current.resonance - baseline.resonance) / baseline.resonance
                },
                description: `Harmonic convergence detected: ${(current.resonance * 100).toFixed(0)}% resonance`
            };
        }
        
        return null;
    }
    
    calculateSeverity(magnitude) {
        for (const [level, config] of Object.entries(this.config.alert_levels)) {
            if (magnitude >= config.threshold) {
                return level;
            }
        }
        return 'low';
    }
    
    async processDetections(detections) {
        for (const detection of detections) {
            // Record drift event
            const monitor = this.monitoredEntities.get(detection.entity_id);
            if (monitor) {
                monitor.drift_events.push({
                    ...detection,
                    detected_at: new Date().toISOString()
                });
            }
            
            // Update history
            this.driftHistory.push(detection);
            this.stats.total_drifts_detected++;
            
            // Save detection
            this.saveDetection(detection);
            
            // Broadcast based on severity
            if (detection.severity !== 'low' && detection.type !== 'harmonic_convergence') {
                await this.broadcastDrift(detection);
            } else if (detection.type === 'harmonic_convergence') {
                await this.broadcastHarmony(detection);
            }
            
            // Emit detection event
            this.emit('drift_detected', detection);
        }
    }
    
    async detectConflicts() {
        const entities = Array.from(this.monitoredEntities.values());
        
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];
                
                // Skip if different types
                if (entity1.type !== entity2.type) continue;
                
                const conflict = this.checkForConflict(entity1, entity2);
                
                if (conflict) {
                    const conflictId = `${entity1.id}_${entity2.id}`;
                    
                    if (!this.activeConflicts.has(conflictId)) {
                        this.activeConflicts.set(conflictId, conflict);
                        this.stats.conflicts_identified++;
                        
                        await this.broadcastConflict(conflict);
                        this.emit('conflict_detected', conflict);
                    }
                }
            }
        }
    }
    
    checkForConflict(entity1, entity2) {
        const state1 = entity1.last_state;
        const state2 = entity2.last_state;
        
        // Check for opposing tones
        if (entity1.type === 'agent') {
            const tone1 = state1.tone;
            const tone2 = state2.tone;
            
            const conflictingTones = {
                'chaotic': ['wise', 'stable'],
                'wise': ['chaotic'],
                'stable': ['chaotic'],
                'creative': ['analytical'],
                'analytical': ['creative']
            };
            
            if (conflictingTones[tone1]?.includes(tone2)) {
                return {
                    type: 'tonal_conflict',
                    entities: [entity1.id, entity2.id],
                    tones: [tone1, tone2],
                    severity: 'medium',
                    description: `Tonal conflict: ${tone1} vs ${tone2}`
                };
            }
        }
        
        // Check for resonance opposition
        const resonanceDiff = Math.abs(state1.resonance - state2.resonance);
        if (resonanceDiff > this.config.conflict_threshold) {
            return {
                type: 'resonance_conflict',
                entities: [entity1.id, entity2.id],
                resonances: [state1.resonance, state2.resonance],
                severity: this.calculateSeverity(resonanceDiff),
                description: `Resonance conflict: ${resonanceDiff.toFixed(3)} difference`
            };
        }
        
        return null;
    }
    
    async detectHarmonies() {
        const entities = Array.from(this.monitoredEntities.values());
        
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entity1 = entities[i];
                const entity2 = entities[j];
                
                const harmony = this.checkForHarmony(entity1, entity2);
                
                if (harmony) {
                    this.stats.harmonies_found++;
                    
                    await this.broadcastHarmony(harmony);
                    this.emit('harmony_detected', harmony);
                }
            }
        }
    }
    
    checkForHarmony(entity1, entity2) {
        const state1 = entity1.last_state;
        const state2 = entity2.last_state;
        
        // Check for resonance alignment
        const resonanceDiff = Math.abs(state1.resonance - state2.resonance);
        
        if (resonanceDiff < 0.1 && state1.resonance > this.config.harmony_threshold) {
            return {
                type: 'resonance_harmony',
                entities: [entity1.id, entity2.id],
                resonance_level: (state1.resonance + state2.resonance) / 2,
                alignment: 1 - resonanceDiff,
                description: `Perfect resonance harmony: ${((1 - resonanceDiff) * 100).toFixed(0)}% aligned`
            };
        }
        
        // Check for complementary archetypes
        if (entity1.type === 'agent' && entity2.type === 'agent') {
            const archetype1 = state1.archetype;
            const archetype2 = state2.archetype;
            
            const complementaryPairs = {
                'creator': ['weaver'],
                'guardian': ['sage'],
                'trickster': ['creator'],
                'sage': ['guardian'],
                'weaver': ['creator']
            };
            
            if (complementaryPairs[archetype1]?.includes(archetype2)) {
                return {
                    type: 'archetype_harmony',
                    entities: [entity1.id, entity2.id],
                    archetypes: [archetype1, archetype2],
                    description: `Complementary archetypes: ${archetype1} + ${archetype2}`
                };
            }
        }
        
        return null;
    }
    
    async broadcastDrift(detection) {
        const message = this.formatDriftMessage(detection);
        
        // Use announcer for narration
        await this.announcer.announce('drift_detection', {
            ...detection,
            formatted_message: message
        });
        
        // Log to file
        this.logBroadcast('drift', message, detection);
        
        // WebSocket broadcast would go here
        this.emit('broadcast', {
            type: 'drift',
            message,
            data: detection
        });
        
        this.stats.alerts_broadcast++;
    }
    
    async broadcastConflict(conflict) {
        const message = this.formatConflictMessage(conflict);
        
        await this.announcer.announce('conflict_detection', {
            ...conflict,
            formatted_message: message
        });
        
        this.logBroadcast('conflict', message, conflict);
        
        this.emit('broadcast', {
            type: 'conflict',
            message,
            data: conflict
        });
        
        this.stats.alerts_broadcast++;
    }
    
    async broadcastHarmony(harmony) {
        const message = this.formatHarmonyMessage(harmony);
        
        await this.announcer.announce('harmony_detection', {
            ...harmony,
            formatted_message: message
        });
        
        this.logBroadcast('harmony', message, harmony);
        
        this.emit('broadcast', {
            type: 'harmony',
            message,
            data: harmony
        });
    }
    
    formatDriftMessage(detection) {
        const severityEmoji = {
            low: '📊',
            medium: '⚠️',
            high: '🚨',
            critical: '💥',
            positive: '✨'
        };
        
        const emoji = severityEmoji[detection.severity] || '📡';
        
        return `${emoji} DRIFT DETECTED: ${detection.entity_type} ${detection.entity_id} - ${detection.description}`;
    }
    
    formatConflictMessage(conflict) {
        return `⚔️ CONFLICT: ${conflict.description} between ${conflict.entities.join(' and ')}`;
    }
    
    formatHarmonyMessage(harmony) {
        return `🎵 HARMONY: ${harmony.description} between ${harmony.entities.join(' and ')}`;
    }
    
    updateBaselines() {
        // Periodically update baselines for gradual adaptation
        for (const [entityId, monitor] of this.monitoredEntities) {
            const currentState = monitor.last_state;
            const baseline = this.baselineStates.get(entityId);
            
            if (!baseline) continue;
            
            // Weighted average to slowly adjust baseline
            const weight = 0.1; // 10% weight to new state
            
            const updatedBaseline = {
                ...baseline,
                resonance: baseline.resonance * (1 - weight) + currentState.resonance * weight,
                coherence: baseline.coherence * (1 - weight) + currentState.coherence * weight,
                captured_at: new Date().toISOString()
            };
            
            this.baselineStates.set(entityId, updatedBaseline);
        }
    }
    
    saveDetection(detection) {
        const filename = `drift_${detection.entity_id}_${Date.now()}.json`;
        const filepath = path.join(__dirname, 'detections', filename);
        
        fs.writeFileSync(filepath, JSON.stringify(detection, null, 2));
    }
    
    logBroadcast(type, message, data) {
        const logFile = path.join(
            __dirname,
            'broadcasts',
            `broadcast_${new Date().toISOString().split('T')[0]}.log`
        );
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        };
        
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
    
    // Public methods
    
    stopMonitoring(entityId) {
        if (this.monitoredEntities.has(entityId)) {
            this.monitoredEntities.delete(entityId);
            this.baselineStates.delete(entityId);
            
            console.log(`🛑 Stopped monitoring: ${entityId}`);
            
            this.emit('monitoring_stopped', { entity_id: entityId });
        }
    }
    
    getMonitoredEntities() {
        return Array.from(this.monitoredEntities.values()).map(monitor => ({
            id: monitor.id,
            type: monitor.type,
            drift_events: monitor.drift_events.length,
            last_state: monitor.last_state
        }));
    }
    
    getDriftHistory(limit = 10) {
        return this.driftHistory.slice(-limit);
    }
    
    getActiveConflicts() {
        return Array.from(this.activeConflicts.values());
    }
    
    getStats() {
        return {
            ...this.stats,
            active_monitors: this.monitoredEntities.size,
            active_conflicts: this.activeConflicts.size,
            drift_history_size: this.driftHistory.length
        };
    }
    
    stop() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        if (this.baselineInterval) {
            clearInterval(this.baselineInterval);
        }
        
        console.log('🛑 Drift Leak detector stopped');
    }
}

module.exports = DriftLeak;

// Example usage
if (require.main === module) {
    const driftLeak = new DriftLeak();
    
    // Listen to events
    driftLeak.on('drift_detected', (detection) => {
        console.log(`\n🌊 Drift: ${detection.description}`);
        console.log(`   Pattern: ${detection.pattern}`);
        console.log(`   Severity: ${detection.severity}`);
    });
    
    driftLeak.on('conflict_detected', (conflict) => {
        console.log(`\n⚔️  Conflict: ${conflict.description}`);
    });
    
    driftLeak.on('harmony_detected', (harmony) => {
        console.log(`\n🎵 Harmony: ${harmony.description}`);
    });
    
    // Test monitoring
    async function testDriftLeak() {
        try {
            // Mock agents with different states
            const stableAgent = {
                agent_id: 'agent_stable_001',
                consciousness: {
                    resonance: 0.8,
                    coherence: 0.85,
                    personality: { tone: 'wise' },
                    template: 'sage'
                }
            };
            
            const chaoticAgent = {
                agent_id: 'agent_chaos_001',
                consciousness: {
                    resonance: 0.4,
                    coherence: 0.3,
                    personality: { tone: 'chaotic' },
                    template: 'trickster'
                }
            };
            
            // Start monitoring
            await driftLeak.monitorEntity(stableAgent, 'agent');
            await driftLeak.monitorEntity(chaoticAgent, 'agent');
            
            // Simulate drift by modifying states
            setTimeout(() => {
                // Stable agent experiences sudden shift
                stableAgent.consciousness.resonance = 0.5;
                console.log('\n📉 Simulated: Stable agent resonance drop');
            }, 3000);
            
            setTimeout(() => {
                // Chaotic agent achieves harmony
                chaoticAgent.consciousness.resonance = 0.85;
                chaoticAgent.consciousness.coherence = 0.8;
                console.log('\n📈 Simulated: Chaotic agent harmony');
            }, 8000);
            
            // Run for 15 seconds
            setTimeout(() => {
                console.log('\n--- Drift Leak Stats ---');
                console.log(driftLeak.getStats());
                
                console.log('\n--- Recent Drifts ---');
                console.log(driftLeak.getDriftHistory(5));
                
                driftLeak.stop();
                process.exit(0);
            }, 15000);
            
        } catch (err) {
            console.error('Drift test failed:', err);
        }
    }
    
    testDriftLeak();
}