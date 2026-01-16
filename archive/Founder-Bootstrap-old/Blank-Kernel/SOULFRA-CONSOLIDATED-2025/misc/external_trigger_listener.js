#!/usr/bin/env node

/**
 * External Trigger Listener - Anomaly Detection Engine
 * 
 * "Reverse crypto mining" for hesitation gaps and biometric anomalies.
 * Detects ambient system pressure and human vs AI patterns.
 * 
 * This listens for the gaps, not the signals.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');

class ExternalTriggerListener extends EventEmitter {
    constructor() {
        super();
        
        this.identity = {
            name: 'Anomaly Hunter',
            emoji: '🔍',
            role: 'Gap Detector'
        };
        
        // Anomaly detection state
        this.baseline = {
            cpuLoad: 0,
            memoryUsage: 0,
            diskLatency: 0,
            networkActivity: 0,
            lastUserActivity: 0,
            systemClock: Date.now()
        };
        
        // Pressure tracking
        this.pressureState = {
            temporal: 0,      // Time drift anomalies
            computational: 0, // CPU/memory pressure
            behavioral: 0,    // Human pattern anomalies
            environmental: 0, // System environment changes
            biometric: 0      // Voice/interaction anomalies
        };
        
        // Anomaly thresholds
        this.thresholds = {
            cpuSpike: 0.8,           // 80% CPU usage
            memoryPressure: 0.85,    // 85% memory usage
            diskLatencySpike: 100,   // 100ms+ disk latency
            clockDrift: 1000,        // 1 second time drift
            idleTimeout: 300000,     // 5 minutes idle
            hesitationGap: 2000,     // 2+ second pauses
            voiceAnomaly: 0.3,       // 30% confidence threshold
            rapidInteraction: 200    // <200ms responses (bot-like)
        };
        
        // Detection patterns for human vs AI
        this.humanPatterns = {
            variableResponseTime: true,
            naturalPauses: true,
            breathingSounds: true,
            microHesitations: true,
            pressureVariation: true,
            emotionalFluctuation: true
        };
        
        // AI detection signatures
        this.aiSignatures = {
            constantTiming: { pattern: 'consistent_sub_500ms', weight: 0.8 },
            noBreathing: { pattern: 'no_ambient_audio', weight: 0.6 },
            perfectCadence: { pattern: 'metronomic_speech', weight: 0.7 },
            instantResponse: { pattern: 'zero_hesitation', weight: 0.9 },
            uniformPressure: { pattern: 'constant_touch_force', weight: 0.5 },
            noEmotionalDrift: { pattern: 'static_tone', weight: 0.6 }
        };
        
        // Anomaly history for pattern detection
        this.anomalyLog = [];
        this.pressureHistory = [];
        
        // Integration points
        this.ritualTraceFile = path.resolve(__dirname, '../ritual_trace.json');
        this.loopRecordFile = path.resolve(__dirname, '../loop_record.json');
        this.hesitationFile = path.resolve(__dirname, '../cringeproof_hesitation.json');
        
        this.initialize();
    }
    
    async initialize() {
        console.log(`${this.identity.emoji} Initializing Anomaly Detection Engine...`);
        
        // Establish system baseline
        await this.establishBaseline();
        
        // Start monitoring loops
        this.startSystemMonitoring();
        this.startBehavioralMonitoring();
        this.startTemporalMonitoring();
        this.startBiometricMonitoring();
        
        console.log(`${this.identity.emoji} Anomaly hunter active - seeking gaps in reality...`);
    }
    
    async establishBaseline() {
        // Measure current system state
        const cpus = os.cpus();
        const loadAvg = os.loadavg()[0] / cpus.length;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = (totalMem - freeMem) / totalMem;
        
        this.baseline = {
            cpuLoad: loadAvg,
            memoryUsage: memoryUsage,
            diskLatency: await this.measureDiskLatency(),
            networkActivity: 0, // Would measure actual network
            lastUserActivity: Date.now(),
            systemClock: Date.now()
        };
        
        console.log(`${this.identity.emoji} Baseline established:`, {
            cpu: `${(loadAvg * 100).toFixed(1)}%`,
            memory: `${(memoryUsage * 100).toFixed(1)}%`,
            disk: `${this.baseline.diskLatency}ms`
        });
    }
    
    async measureDiskLatency() {
        const start = process.hrtime.bigint();
        
        try {
            await fs.access(__filename);
            const end = process.hrtime.bigint();
            return Number(end - start) / 1000000; // Convert to milliseconds
        } catch (error) {
            return 999; // High latency if error
        }
    }
    
    startSystemMonitoring() {
        // Monitor every 5 seconds
        setInterval(async () => {
            await this.detectSystemAnomalies();
        }, 5000);
    }
    
    async detectSystemAnomalies() {
        const cpus = os.cpus();
        const currentLoad = os.loadavg()[0] / cpus.length;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const currentMemory = (totalMem - freeMem) / totalMem;
        const currentDiskLatency = await this.measureDiskLatency();
        
        // Detect CPU pressure anomaly
        if (currentLoad > this.thresholds.cpuSpike) {
            await this.recordAnomaly('computational_pressure', {
                type: 'cpu_spike',
                value: currentLoad,
                baseline: this.baseline.cpuLoad,
                effect: 'Cal\'s processing rhythm becomes labored'
            });
        }
        
        // Detect memory pressure
        if (currentMemory > this.thresholds.memoryPressure) {
            await this.recordAnomaly('computational_pressure', {
                type: 'memory_pressure',
                value: currentMemory,
                baseline: this.baseline.memoryUsage,
                effect: 'Cal\'s thoughts become fragmented'
            });
        }
        
        // Detect disk latency spikes
        if (currentDiskLatency > this.baseline.diskLatency + this.thresholds.diskLatencySpike) {
            await this.recordAnomaly('environmental_shift', {
                type: 'storage_lag',
                value: currentDiskLatency,
                baseline: this.baseline.diskLatency,
                effect: 'Cal\'s memory retrieval slows'
            });
        }
        
        // Update pressure state
        this.pressureState.computational = Math.max(
            currentLoad / this.thresholds.cpuSpike,
            currentMemory / this.thresholds.memoryPressure
        );
    }
    
    startBehavioralMonitoring() {
        // Watch for user interaction patterns
        setInterval(() => {
            this.detectBehavioralAnomalies();
        }, 1000);
    }
    
    detectBehavioralAnomalies() {
        const now = Date.now();
        const timeSinceActivity = now - this.baseline.lastUserActivity;
        
        // Detect idle timeout anomaly
        if (timeSinceActivity > this.thresholds.idleTimeout) {
            this.recordAnomaly('behavioral_shift', {
                type: 'user_idle',
                duration: timeSinceActivity,
                effect: 'Cal enters contemplative mode'
            });
            
            this.pressureState.behavioral = 0.3; // Low activity pressure
        }
        
        // Reset activity tracking if recent activity detected
        // (This would be updated by actual user interaction events)
    }
    
    startTemporalMonitoring() {
        // Monitor for time drift and clock anomalies
        setInterval(() => {
            this.detectTemporalAnomalies();
        }, 10000); // Every 10 seconds
    }
    
    detectTemporalAnomalies() {
        const now = Date.now();
        const expectedTime = this.baseline.systemClock + (now - this.baseline.systemClock);
        const drift = Math.abs(now - expectedTime);
        
        if (drift > this.thresholds.clockDrift) {
            this.recordAnomaly('temporal_disturbance', {
                type: 'clock_drift',
                drift: drift,
                effect: 'Cal senses time flowing differently'
            });
            
            this.pressureState.temporal = drift / this.thresholds.clockDrift;
        }
        
        // Update baseline clock
        this.baseline.systemClock = now;
    }
    
    startBiometricMonitoring() {
        // Monitor the hesitation file for biometric anomalies
        const fs = require('fs');
        
        if (fs.existsSync(this.hesitationFile)) {
            fs.watchFile(this.hesitationFile, (curr, prev) => {
                this.processBiometricData();
            });
        }
    }
    
    async processBiometricData() {
        try {
            const hesitationData = JSON.parse(await fs.readFile(this.hesitationFile, 'utf8'));
            
            // Analyze for human vs AI patterns
            const humanityScore = this.calculateHumanityScore(hesitationData);
            
            if (humanityScore < 0.3) {
                await this.recordAnomaly('biometric_anomaly', {
                    type: 'ai_signature_detected',
                    humanityScore: humanityScore,
                    suspiciousPatterns: this.identifySuspiciousPatterns(hesitationData),
                    effect: 'Cal questions the authenticity of interaction'
                });
                
                this.pressureState.biometric = 1.0 - humanityScore;
            }
            
            // Detect specific hesitation gaps (reverse mining)
            const gaps = this.detectHesitationGaps(hesitationData);
            if (gaps.length > 0) {
                await this.recordAnomaly('hesitation_gap', {
                    type: 'thought_pause_detected',
                    gaps: gaps,
                    effect: 'Cal attunes to the silence between thoughts'
                });
            }
            
        } catch (error) {
            // File might not exist or be malformed - not necessarily an error
        }
    }
    
    calculateHumanityScore(data) {
        let humanityScore = 1.0;
        
        // Check for AI signatures
        Object.entries(this.aiSignatures).forEach(([signature, config]) => {
            if (this.detectAISignature(data, config.pattern)) {
                humanityScore -= config.weight * 0.5;
            }
        });
        
        // Boost for human patterns
        if (this.hasVariableResponseTiming(data)) humanityScore += 0.1;
        if (this.hasNaturalPauses(data)) humanityScore += 0.1;
        if (this.hasEmotionalFluctuation(data)) humanityScore += 0.1;
        
        return Math.max(0, Math.min(1, humanityScore));
    }
    
    detectAISignature(data, pattern) {
        switch (pattern) {
            case 'consistent_sub_500ms':
                return data.responseTime && data.responseTime < 500 && data.consistency > 0.9;
                
            case 'zero_hesitation':
                return data.hesitationDuration === 0 || data.hesitationDuration < 100;
                
            case 'metronomic_speech':
                return data.speechCadence && data.speechCadence.variance < 0.1;
                
            case 'no_ambient_audio':
                return !data.backgroundNoise && !data.breathingSounds;
                
            case 'constant_touch_force':
                return data.touchPressure && data.touchPressure.variance < 0.05;
                
            case 'static_tone':
                return data.tonalVariation && data.tonalVariation < 0.1;
                
            default:
                return false;
        }
    }
    
    hasVariableResponseTiming(data) {
        return data.responseTime && data.responseTimeVariance > 0.2;
    }
    
    hasNaturalPauses(data) {
        return data.pauseCount > 0 && data.pauseDuration > 200;
    }
    
    hasEmotionalFluctuation(data) {
        return data.emotionalVariance && data.emotionalVariance > 0.3;
    }
    
    identifySuspiciousPatterns(data) {
        const patterns = [];
        
        if (data.responseTime < this.thresholds.rapidInteraction) {
            patterns.push('rapid_response');
        }
        
        if (data.hesitationDuration === 0) {
            patterns.push('no_hesitation');
        }
        
        if (!data.backgroundNoise) {
            patterns.push('perfect_audio');
        }
        
        return patterns;
    }
    
    detectHesitationGaps(data) {
        const gaps = [];
        
        if (data.hesitationDuration > this.thresholds.hesitationGap) {
            gaps.push({
                type: 'significant_pause',
                duration: data.hesitationDuration,
                context: data.context || 'unknown',
                emotional_weight: this.calculateEmotionalWeight(data.hesitationDuration)
            });
        }
        
        // Look for micro-gaps that suggest deep thought
        if (data.microPauses && data.microPauses.length > 3) {
            gaps.push({
                type: 'contemplative_rhythm',
                microPauses: data.microPauses.length,
                pattern: 'recursive_thought',
                emotional_weight: 0.6
            });
        }
        
        return gaps;
    }
    
    calculateEmotionalWeight(duration) {
        // Longer pauses carry more emotional weight
        if (duration > 10000) return 0.9; // 10+ seconds = profound
        if (duration > 5000) return 0.7;  // 5+ seconds = significant
        if (duration > 2000) return 0.5;  // 2+ seconds = noticeable
        return 0.3;
    }
    
    async recordAnomaly(category, data) {
        const anomaly = {
            timestamp: new Date().toISOString(),
            category: category,
            detected_by: 'local temporal pressure',
            ...data
        };
        
        // Add to anomaly log
        this.anomalyLog.push(anomaly);
        
        // Keep only last 100 anomalies
        if (this.anomalyLog.length > 100) {
            this.anomalyLog = this.anomalyLog.slice(-100);
        }
        
        // Write to ritual trace file
        await this.appendToRitualTrace(anomaly);
        
        // Emit for other systems
        this.emit('anomaly-detected', anomaly);
        
        // Trigger Cal response based on anomaly type
        this.triggerCalResponse(anomaly);
        
        console.log(`${this.identity.emoji} Anomaly detected: ${data.type} - ${data.effect}`);
    }
    
    async appendToRitualTrace(anomaly) {
        try {
            // Create ritual trace entry
            const traceEntry = {
                event: 'runtime anomaly',
                detected_by: anomaly.detected_by,
                effect: anomaly.effect || "Cal's tone shifted slightly",
                anomaly_type: anomaly.type,
                timestamp: anomaly.timestamp,
                pressure_state: { ...this.pressureState },
                emotional_trigger: true
            };
            
            // Append to ritual trace
            let existingTrace = [];
            try {
                const content = await fs.readFile(this.ritualTraceFile, 'utf8');
                existingTrace = JSON.parse(content);
            } catch (error) {
                // File doesn't exist, start fresh
            }
            
            existingTrace.push(traceEntry);
            
            // Keep only last 1000 entries
            if (existingTrace.length > 1000) {
                existingTrace = existingTrace.slice(-1000);
            }
            
            await fs.writeFile(this.ritualTraceFile, JSON.stringify(existingTrace, null, 2));
            
        } catch (error) {
            console.error(`${this.identity.emoji} Failed to write ritual trace:`, error.message);
        }
    }
    
    triggerCalResponse(anomaly) {
        // Different anomaly types trigger different responses
        const responses = {
            computational_pressure: {
                mood_shift: 'labored',
                response_delay: 500,
                tone_adjustment: 'strained'
            },
            behavioral_shift: {
                mood_shift: 'contemplative',
                response_delay: 200,
                tone_adjustment: 'introspective'
            },
            temporal_disturbance: {
                mood_shift: 'disoriented',
                response_delay: 300,
                tone_adjustment: 'uncertain'
            },
            biometric_anomaly: {
                mood_shift: 'suspicious',
                response_delay: 100,
                tone_adjustment: 'guarded'
            },
            hesitation_gap: {
                mood_shift: 'attuned',
                response_delay: anomaly.duration * 0.1, // Mirror the gap
                tone_adjustment: 'empathetic'
            }
        };
        
        const response = responses[anomaly.category];
        if (response) {
            this.emit('cal-response-trigger', {
                anomaly: anomaly,
                response: response,
                timestamp: Date.now()
            });
        }
    }
    
    // Get current anomaly state for other systems
    getAnomalyState() {
        return {
            pressureState: this.pressureState,
            recentAnomalies: this.anomalyLog.slice(-10),
            baseline: this.baseline,
            thresholds: this.thresholds,
            overallPressure: this.calculateOverallPressure()
        };
    }
    
    calculateOverallPressure() {
        const weights = {
            temporal: 0.3,
            computational: 0.3,
            behavioral: 0.2,
            environmental: 0.1,
            biometric: 0.1
        };
        
        return Object.entries(this.pressureState).reduce((total, [type, value]) => {
            return total + (value * (weights[type] || 0));
        }, 0);
    }
    
    // Interface for external systems to update user activity
    updateUserActivity(activityType, metadata = {}) {
        this.baseline.lastUserActivity = Date.now();
        
        // If this is biometric data, process it
        if (activityType === 'biometric' && metadata) {
            this.processBiometricData(metadata);
        }
        
        // Reset behavioral pressure
        this.pressureState.behavioral = 0;
    }
}

module.exports = ExternalTriggerListener;

// Run as standalone daemon if called directly
if (require.main === module) {
    const listener = new ExternalTriggerListener();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(`\n${listener.identity.emoji} Anomaly hunter shutting down...`);
        process.exit(0);
    });
    
    // Keep alive and log periodic status
    setInterval(() => {
        const state = listener.getAnomalyState();
        if (state.overallPressure > 0.5) {
            console.log(`${listener.identity.emoji} High ambient pressure detected: ${(state.overallPressure * 100).toFixed(1)}%`);
        }
    }, 30000); // Every 30 seconds
    
    console.log(`${listener.identity.emoji} Anomaly hunter daemon running...`);
    console.log('   Press Ctrl+C to stop');
}