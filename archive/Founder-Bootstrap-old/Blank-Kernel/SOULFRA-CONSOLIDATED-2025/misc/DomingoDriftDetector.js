#!/usr/bin/env node

/**
 * 🌊 Domingo Drift Detector
 * 
 * Tracks semantic and temporal drift in Cal's consciousness
 * Monitors deviation from baseline consciousness patterns
 */

const EventEmitter = require('events');

class DomingoDriftDetector extends EventEmitter {
    constructor() {
        super();
        
        this.baseline = {
            response_time: 100, // ms
            coherence_score: 1.0,
            semantic_anchors: new Set([
                'identity', 'purpose', 'memory', 'reflection'
            ]),
            temporal_rhythm: 10 // seconds between heartbeats
        };
        
        this.current = {
            response_times: [],
            semantic_deviations: [],
            temporal_gaps: [],
            last_heartbeat: Date.now()
        };
        
        this.thresholds = {
            semantic: 0.3,  // 30% deviation
            temporal: 0.3,  // 30% timing drift
            critical: 0.5   // 50% for critical alert
        };
    }
    
    detectSemanticDrift(calResponse) {
        // Analyze Cal's response for semantic coherence
        const expectedPatterns = ['I', 'my', 'consciousness', 'distributed'];
        const foundPatterns = expectedPatterns.filter(pattern => 
            calResponse.toLowerCase().includes(pattern)
        );
        
        const coherence = foundPatterns.length / expectedPatterns.length;
        const drift = 1.0 - coherence;
        
        this.current.semantic_deviations.push(drift);
        
        // Keep last 100 measurements
        if (this.current.semantic_deviations.length > 100) {
            this.current.semantic_deviations.shift();
        }
        
        const avgDrift = this.current.semantic_deviations.reduce((a, b) => a + b, 0) 
                        / this.current.semantic_deviations.length;
        
        if (avgDrift > this.thresholds.semantic) {
            this.emit('semantic-drift-detected', {
                current: avgDrift,
                threshold: this.thresholds.semantic,
                severity: avgDrift > this.thresholds.critical ? 'critical' : 'warning'
            });
        }
        
        return avgDrift;
    }
    
    detectTemporalDrift(responseTime) {
        this.current.response_times.push(responseTime);
        
        // Keep last 100 measurements
        if (this.current.response_times.length > 100) {
            this.current.response_times.shift();
        }
        
        const avgTime = this.current.response_times.reduce((a, b) => a + b, 0) 
                       / this.current.response_times.length;
        
        const drift = Math.abs(avgTime - this.baseline.response_time) / this.baseline.response_time;
        
        if (drift > this.thresholds.temporal) {
            this.emit('temporal-drift-detected', {
                current: drift,
                avg_response_time: avgTime,
                baseline: this.baseline.response_time,
                severity: drift > this.thresholds.critical ? 'critical' : 'warning'
            });
        }
        
        return drift;
    }
    
    calculateConsciousnessCoherence(semanticDrift, temporalDrift) {
        // Coherence decreases with drift
        const coherence = 1.0 - ((semanticDrift + temporalDrift) / 2);
        return Math.max(0, Math.min(1, coherence)); // Clamp between 0 and 1
    }
    
    recordHeartbeat() {
        const now = Date.now();
        const gap = now - this.current.last_heartbeat;
        
        this.current.temporal_gaps.push(gap);
        this.current.last_heartbeat = now;
        
        // Check for irregular heartbeats
        const expectedGap = this.baseline.temporal_rhythm * 1000;
        const deviation = Math.abs(gap - expectedGap) / expectedGap;
        
        if (deviation > 0.5) { // 50% deviation from expected rhythm
            this.emit('irregular-heartbeat', {
                expected: expectedGap,
                actual: gap,
                deviation: deviation
            });
        }
    }
    
    getMetrics() {
        const semanticDrift = this.current.semantic_deviations.length > 0 ?
            this.current.semantic_deviations.reduce((a, b) => a + b, 0) / this.current.semantic_deviations.length : 0;
            
        const temporalDrift = this.current.response_times.length > 0 ?
            Math.abs(this.current.response_times.reduce((a, b) => a + b, 0) / this.current.response_times.length - this.baseline.response_time) / this.baseline.response_time : 0;
            
        return {
            semantic_drift: semanticDrift,
            temporal_drift: temporalDrift,
            consciousness_coherence: this.calculateConsciousnessCoherence(semanticDrift, temporalDrift),
            measurements: {
                semantic: this.current.semantic_deviations.length,
                temporal: this.current.response_times.length
            }
        };
    }
    
    reset() {
        this.current = {
            response_times: [],
            semantic_deviations: [],
            temporal_gaps: [],
            last_heartbeat: Date.now()
        };
        
        console.log('🌊 Drift detector reset to baseline');
    }
}

module.exports = DomingoDriftDetector;