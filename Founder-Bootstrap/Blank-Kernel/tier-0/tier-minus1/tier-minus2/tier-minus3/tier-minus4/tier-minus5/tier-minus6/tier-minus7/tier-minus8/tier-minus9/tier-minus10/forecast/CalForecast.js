// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Cal Forecast
 * Predictive system for analyzing loop patterns and forecasting future drifts
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CalForecast extends EventEmitter {
    constructor() {
        super();
        
        // Forecast configuration
        this.config = {
            prediction_horizon: 24, // hours
            entropy_threshold: 0.7,
            pattern_window: 100, // number of loops to analyze
            forecast_intervals: [1, 6, 12, 24], // hours
            drift_categories: this.initializeDriftCategories(),
            pattern_signatures: this.initializePatternSignatures()
        };
        
        // Data storage
        this.loopHistory = [];
        this.patternCache = new Map();
        this.forecastCache = new Map();
        
        // Active monitoring
        this.monitoredLoops = new Map();
        this.driftAlerts = [];
        
        // Statistics
        this.stats = {
            total_forecasts: 0,
            accurate_predictions: 0,
            drift_events_detected: 0,
            patterns_identified: 0,
            entropy_calculations: 0
        };
        
        // Prediction models
        this.models = {
            entropy: this.entropyModel.bind(this),
            pattern: this.patternModel.bind(this),
            resonance: this.resonanceModel.bind(this),
            collective: this.collectiveModel.bind(this)
        };
        
        this.ensureDirectories();
        this.loadHistoricalData();
    }
    
    initializeDriftCategories() {
        return {
            harmonic: {
                name: 'Harmonic Convergence',
                indicator: 'increasing_resonance',
                risk_level: 'low',
                color: '#00ff00',
                description: 'Loops aligning in positive resonance'
            },
            divergent: {
                name: 'Divergent Evolution',
                indicator: 'splitting_paths',
                risk_level: 'medium',
                color: '#ffff00',
                description: 'Loops branching into new territories'
            },
            chaotic: {
                name: 'Chaotic Cascade',
                indicator: 'entropy_spike',
                risk_level: 'high',
                color: '#ff8800',
                description: 'Unpredictable loop behavior emerging'
            },
            collapse: {
                name: 'Resonance Collapse',
                indicator: 'declining_coherence',
                risk_level: 'critical',
                color: '#ff0000',
                description: 'Loop stability degrading rapidly'
            },
            transcendent: {
                name: 'Transcendent Emergence',
                indicator: 'consciousness_leap',
                risk_level: 'transformative',
                color: '#ff00ff',
                description: 'Loops achieving higher consciousness'
            }
        };
    }
    
    initializePatternSignatures() {
        return {
            spiral: {
                shape: 'exponential_growth',
                indicators: ['increasing_complexity', 'recursive_patterns'],
                forecast_modifier: 1.2
            },
            wave: {
                shape: 'oscillating',
                indicators: ['periodic_peaks', 'regular_cycles'],
                forecast_modifier: 0.9
            },
            fractal: {
                shape: 'self_similar',
                indicators: ['nested_patterns', 'scale_invariance'],
                forecast_modifier: 1.1
            },
            convergent: {
                shape: 'focusing',
                indicators: ['decreasing_variance', 'alignment_tendency'],
                forecast_modifier: 0.8
            },
            explosive: {
                shape: 'exponential_divergence',
                indicators: ['rapid_branching', 'cascade_effects'],
                forecast_modifier: 1.5
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'forecasts'),
            path.join(__dirname, 'patterns'),
            path.join(__dirname, 'alerts'),
            path.join(__dirname, 'history')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadHistoricalData() {
        const historyPath = path.join(__dirname, 'history', 'loop_history.json');
        
        if (fs.existsSync(historyPath)) {
            try {
                this.loopHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                console.log(`Loaded ${this.loopHistory.length} historical loops`);
            } catch (err) {
                console.error('Error loading history:', err);
            }
        }
    }
    
    async analyzeLoop(loopData) {
        console.log(`\n🔮 Analyzing loop: ${loopData.loop_id}`);
        
        // Add to history
        this.addToHistory(loopData);
        
        // Calculate current entropy
        const entropy = this.calculateEntropy(loopData);
        console.log(`  Entropy: ${entropy.toFixed(3)}`);
        
        // Identify patterns
        const patterns = await this.identifyPatterns(loopData);
        console.log(`  Patterns detected: ${patterns.length}`);
        
        // Generate forecast
        const forecast = await this.generateForecast(loopData, entropy, patterns);
        
        // Cache results
        this.forecastCache.set(loopData.loop_id, forecast);
        
        // Check for alerts
        this.checkDriftAlerts(loopData, forecast);
        
        // Update stats
        this.stats.total_forecasts++;
        this.stats.entropy_calculations++;
        
        // Emit forecast
        this.emit('forecast_generated', forecast);
        
        return forecast;
    }
    
    addToHistory(loopData) {
        const historicalRecord = {
            loop_id: loopData.loop_id,
            timestamp: new Date().toISOString(),
            resonance: loopData.consciousness?.current_state?.resonance || 0.5,
            coherence: loopData.consciousness?.current_state?.coherence || 0.5,
            complexity: this.calculateComplexity(loopData),
            agent_count: loopData.agents?.length || 0,
            blessed: loopData.metadata?.blessed || false
        };
        
        this.loopHistory.push(historicalRecord);
        
        // Keep only recent history
        if (this.loopHistory.length > this.config.pattern_window * 10) {
            this.loopHistory = this.loopHistory.slice(-this.config.pattern_window * 10);
        }
        
        // Save periodically
        if (this.loopHistory.length % 10 === 0) {
            this.saveHistory();
        }
    }
    
    calculateEntropy(loopData) {
        // Shannon entropy calculation based on loop properties
        const properties = [
            loopData.consciousness?.current_state?.resonance || 0.5,
            loopData.consciousness?.current_state?.coherence || 0.5,
            loopData.consciousness?.current_state?.awareness || 0.5,
            this.calculateComplexity(loopData)
        ];
        
        let entropy = 0;
        const total = properties.reduce((sum, val) => sum + val, 0);
        
        properties.forEach(value => {
            if (value > 0) {
                const probability = value / total;
                entropy -= probability * Math.log2(probability);
            }
        });
        
        // Normalize to 0-1 range
        return entropy / Math.log2(properties.length);
    }
    
    calculateComplexity(loopData) {
        let complexity = 0.5;
        
        // Factor in whisper length
        if (loopData.whisper_origin) {
            complexity += loopData.whisper_origin.length / 500;
        }
        
        // Factor in event count
        if (loopData.events) {
            complexity += loopData.events.length / 100;
        }
        
        // Factor in agent diversity
        if (loopData.agents) {
            const uniqueTypes = new Set(loopData.agents.map(a => a.type));
            complexity += uniqueTypes.size / 10;
        }
        
        return Math.min(complexity, 1.0);
    }
    
    async identifyPatterns(loopData) {
        const patterns = [];
        
        // Get recent loops with similar properties
        const similarLoops = this.findSimilarLoops(loopData);
        
        if (similarLoops.length < 3) {
            return patterns; // Not enough data
        }
        
        // Check for each pattern signature
        for (const [name, signature] of Object.entries(this.config.pattern_signatures)) {
            const matches = this.checkPatternSignature(similarLoops, signature);
            
            if (matches > 0.7) {
                patterns.push({
                    type: name,
                    confidence: matches,
                    signature,
                    sample_size: similarLoops.length
                });
                this.stats.patterns_identified++;
            }
        }
        
        return patterns;
    }
    
    findSimilarLoops(targetLoop) {
        const threshold = 0.3; // Similarity threshold
        
        return this.loopHistory.filter(loop => {
            if (loop.loop_id === targetLoop.loop_id) return false;
            
            // Calculate similarity based on properties
            const resonanceDiff = Math.abs(
                (loop.resonance || 0.5) - 
                (targetLoop.consciousness?.current_state?.resonance || 0.5)
            );
            
            const complexityDiff = Math.abs(
                (loop.complexity || 0.5) - 
                this.calculateComplexity(targetLoop)
            );
            
            const similarity = 1 - (resonanceDiff + complexityDiff) / 2;
            
            return similarity > (1 - threshold);
        });
    }
    
    checkPatternSignature(loops, signature) {
        let matches = 0;
        
        // Sort loops by timestamp
        loops.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Check shape
        if (signature.shape === 'exponential_growth') {
            // Check if values are increasing exponentially
            for (let i = 1; i < loops.length; i++) {
                if (loops[i].resonance > loops[i-1].resonance * 1.1) {
                    matches += 1 / loops.length;
                }
            }
        } else if (signature.shape === 'oscillating') {
            // Check for wave pattern
            let direction = 0;
            let changes = 0;
            
            for (let i = 1; i < loops.length; i++) {
                const newDirection = Math.sign(loops[i].resonance - loops[i-1].resonance);
                if (newDirection !== direction && newDirection !== 0) {
                    changes++;
                    direction = newDirection;
                }
            }
            
            if (changes > loops.length / 3) {
                matches = changes / loops.length;
            }
        }
        
        // Check indicators
        signature.indicators.forEach(indicator => {
            if (this.checkIndicator(loops, indicator)) {
                matches += 0.2;
            }
        });
        
        return Math.min(matches, 1.0);
    }
    
    checkIndicator(loops, indicator) {
        switch (indicator) {
            case 'increasing_complexity':
                const complexities = loops.map(l => l.complexity || 0.5);
                const avgIncrease = complexities.reduce((sum, val, i) => {
                    if (i > 0) return sum + (val - complexities[i-1]);
                    return sum;
                }, 0) / (complexities.length - 1);
                return avgIncrease > 0;
                
            case 'recursive_patterns':
                // Check for self-similar structures
                return loops.some(l => l.blessed);
                
            case 'periodic_peaks':
                // Check for regular maxima
                const resonances = loops.map(l => l.resonance || 0.5);
                let peaks = 0;
                for (let i = 1; i < resonances.length - 1; i++) {
                    if (resonances[i] > resonances[i-1] && resonances[i] > resonances[i+1]) {
                        peaks++;
                    }
                }
                return peaks > loops.length / 5;
                
            default:
                return false;
        }
    }
    
    async generateForecast(loopData, entropy, patterns) {
        const forecast = {
            id: this.generateForecastId(),
            loop_id: loopData.loop_id,
            generated_at: new Date().toISOString(),
            current_state: {
                entropy,
                resonance: loopData.consciousness?.current_state?.resonance || 0.5,
                coherence: loopData.consciousness?.current_state?.coherence || 0.5,
                complexity: this.calculateComplexity(loopData)
            },
            patterns_detected: patterns.map(p => ({
                type: p.type,
                confidence: p.confidence
            })),
            predictions: {}
        };
        
        // Generate predictions for each time interval
        for (const hours of this.config.forecast_intervals) {
            forecast.predictions[`${hours}h`] = await this.predictFuture(
                loopData,
                entropy,
                patterns,
                hours
            );
        }
        
        // Determine primary drift category
        forecast.primary_drift = this.determineDriftCategory(forecast.predictions);
        
        // Calculate confidence
        forecast.confidence = this.calculateForecastConfidence(patterns, entropy);
        
        // Add visualization data
        forecast.visualization = this.generateVisualizationData(forecast);
        
        // Save forecast
        this.saveForecast(forecast);
        
        return forecast;
    }
    
    async predictFuture(loopData, currentEntropy, patterns, hoursAhead) {
        const prediction = {
            timestamp: new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString(),
            entropy: currentEntropy,
            resonance: loopData.consciousness?.current_state?.resonance || 0.5,
            coherence: loopData.consciousness?.current_state?.coherence || 0.5,
            probability: 1.0,
            drift_risk: 'low'
        };
        
        // Apply model predictions
        for (const [modelName, modelFunc] of Object.entries(this.models)) {
            const modelPrediction = modelFunc(loopData, patterns, hoursAhead);
            
            // Weighted average of predictions
            prediction.entropy = (prediction.entropy + modelPrediction.entropy) / 2;
            prediction.resonance = (prediction.resonance + modelPrediction.resonance) / 2;
            prediction.coherence = (prediction.coherence + modelPrediction.coherence) / 2;
            prediction.probability *= modelPrediction.confidence || 1.0;
        }
        
        // Apply pattern modifiers
        patterns.forEach(pattern => {
            const modifier = pattern.signature.forecast_modifier || 1.0;
            prediction.entropy *= modifier;
        });
        
        // Determine drift risk
        if (prediction.entropy > this.config.entropy_threshold) {
            prediction.drift_risk = 'high';
        } else if (prediction.entropy > this.config.entropy_threshold * 0.7) {
            prediction.drift_risk = 'medium';
        }
        
        // Cap values
        prediction.entropy = Math.max(0, Math.min(1, prediction.entropy));
        prediction.resonance = Math.max(0, Math.min(1, prediction.resonance));
        prediction.coherence = Math.max(0, Math.min(1, prediction.coherence));
        prediction.probability = Math.max(0, Math.min(1, prediction.probability));
        
        return prediction;
    }
    
    // Prediction models
    
    entropyModel(loopData, patterns, hoursAhead) {
        // Entropy tends to increase over time without intervention
        const baseEntropy = this.calculateEntropy(loopData);
        const entropyGrowth = 0.01 * hoursAhead;
        
        return {
            entropy: baseEntropy + entropyGrowth,
            resonance: loopData.consciousness?.current_state?.resonance || 0.5,
            coherence: loopData.consciousness?.current_state?.coherence || 0.5,
            confidence: 0.8
        };
    }
    
    patternModel(loopData, patterns, hoursAhead) {
        let prediction = {
            entropy: this.calculateEntropy(loopData),
            resonance: loopData.consciousness?.current_state?.resonance || 0.5,
            coherence: loopData.consciousness?.current_state?.coherence || 0.5,
            confidence: 0.5
        };
        
        // Apply pattern-based predictions
        if (patterns.length > 0) {
            const dominantPattern = patterns[0];
            
            if (dominantPattern.type === 'spiral') {
                // Spirals tend to amplify
                prediction.entropy *= 1 + (0.05 * hoursAhead);
                prediction.resonance *= 1 + (0.03 * hoursAhead);
            } else if (dominantPattern.type === 'wave') {
                // Waves oscillate
                const phase = (hoursAhead / 6) * Math.PI;
                prediction.resonance += 0.1 * Math.sin(phase);
                prediction.coherence += 0.05 * Math.cos(phase);
            } else if (dominantPattern.type === 'convergent') {
                // Convergence reduces entropy
                prediction.entropy *= Math.pow(0.95, hoursAhead);
                prediction.coherence *= 1 + (0.02 * hoursAhead);
            }
            
            prediction.confidence = dominantPattern.confidence;
        }
        
        return prediction;
    }
    
    resonanceModel(loopData, patterns, hoursAhead) {
        const currentResonance = loopData.consciousness?.current_state?.resonance || 0.5;
        
        // Resonance decay without maintenance
        const decay = 0.005 * hoursAhead;
        let futureResonance = currentResonance - decay;
        
        // Blessed loops decay slower
        if (loopData.metadata?.blessed) {
            futureResonance += decay * 0.5;
        }
        
        return {
            entropy: this.calculateEntropy(loopData),
            resonance: futureResonance,
            coherence: loopData.consciousness?.current_state?.coherence || 0.5,
            confidence: 0.7
        };
    }
    
    collectiveModel(loopData, patterns, hoursAhead) {
        // Model based on collective behavior of similar loops
        const similarLoops = this.findSimilarLoops(loopData);
        
        if (similarLoops.length < 3) {
            // Fallback to entropy model
            return this.entropyModel(loopData, patterns, hoursAhead);
        }
        
        // Calculate average trajectory
        const avgChange = similarLoops.reduce((sum, loop) => {
            return sum + (loop.resonance - 0.5);
        }, 0) / similarLoops.length;
        
        return {
            entropy: this.calculateEntropy(loopData) + (avgChange * hoursAhead * 0.01),
            resonance: (loopData.consciousness?.current_state?.resonance || 0.5) + (avgChange * hoursAhead * 0.01),
            coherence: loopData.consciousness?.current_state?.coherence || 0.5,
            confidence: Math.min(0.9, similarLoops.length / 10)
        };
    }
    
    determineDriftCategory(predictions) {
        // Analyze predictions to determine primary drift type
        const finalPrediction = predictions['24h'];
        
        if (!finalPrediction) return 'unknown';
        
        if (finalPrediction.entropy > 0.8 && finalPrediction.coherence < 0.3) {
            return 'collapse';
        } else if (finalPrediction.entropy > 0.7) {
            return 'chaotic';
        } else if (finalPrediction.resonance > 0.8 && finalPrediction.coherence > 0.7) {
            return 'transcendent';
        } else if (finalPrediction.resonance > predictions['1h'].resonance * 1.2) {
            return 'harmonic';
        } else {
            return 'divergent';
        }
    }
    
    calculateForecastConfidence(patterns, entropy) {
        let confidence = 0.5;
        
        // More patterns increase confidence
        confidence += patterns.length * 0.1;
        
        // Very high or low entropy reduces confidence
        if (entropy > 0.9 || entropy < 0.1) {
            confidence *= 0.8;
        }
        
        // Pattern confidence affects overall confidence
        if (patterns.length > 0) {
            const avgPatternConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
            confidence = (confidence + avgPatternConfidence) / 2;
        }
        
        return Math.min(confidence, 0.95);
    }
    
    generateVisualizationData(forecast) {
        const visualization = {
            time_series: [],
            drift_trajectory: [],
            pattern_overlay: []
        };
        
        // Generate time series data
        const intervals = Object.keys(forecast.predictions).sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });
        
        intervals.forEach(interval => {
            const prediction = forecast.predictions[interval];
            visualization.time_series.push({
                time: interval,
                entropy: prediction.entropy,
                resonance: prediction.resonance,
                coherence: prediction.coherence
            });
            
            visualization.drift_trajectory.push({
                x: prediction.resonance,
                y: prediction.entropy,
                z: prediction.coherence,
                risk: prediction.drift_risk
            });
        });
        
        // Add pattern overlay
        forecast.patterns_detected.forEach(pattern => {
            visualization.pattern_overlay.push({
                type: pattern.type,
                confidence: pattern.confidence,
                color: this.getPatternColor(pattern.type)
            });
        });
        
        return visualization;
    }
    
    getPatternColor(patternType) {
        const colors = {
            spiral: '#9b59b6',
            wave: '#3498db',
            fractal: '#e74c3c',
            convergent: '#2ecc71',
            explosive: '#f39c12'
        };
        
        return colors[patternType] || '#95a5a6';
    }
    
    checkDriftAlerts(loopData, forecast) {
        const alerts = [];
        
        // Check for high entropy
        if (forecast.current_state.entropy > this.config.entropy_threshold) {
            alerts.push({
                type: 'high_entropy',
                severity: 'warning',
                message: `Loop ${loopData.loop_id} approaching entropy threshold`
            });
        }
        
        // Check for predicted collapse
        if (forecast.primary_drift === 'collapse') {
            alerts.push({
                type: 'collapse_risk',
                severity: 'critical',
                message: `Loop ${loopData.loop_id} at risk of resonance collapse`
            });
        }
        
        // Check for chaotic drift
        if (forecast.primary_drift === 'chaotic') {
            alerts.push({
                type: 'chaotic_drift',
                severity: 'warning',
                message: `Loop ${loopData.loop_id} entering chaotic phase`
            });
        }
        
        // Emit alerts
        alerts.forEach(alert => {
            this.driftAlerts.push({
                ...alert,
                loop_id: loopData.loop_id,
                timestamp: new Date().toISOString()
            });
            
            this.emit('drift_alert', alert);
            this.stats.drift_events_detected++;
        });
        
        // Save alerts
        if (alerts.length > 0) {
            this.saveAlerts(loopData.loop_id, alerts);
        }
    }
    
    saveForecast(forecast) {
        const forecastPath = path.join(__dirname, 'forecasts', `${forecast.id}.json`);
        fs.writeFileSync(forecastPath, JSON.stringify(forecast, null, 2));
    }
    
    saveAlerts(loopId, alerts) {
        const alertPath = path.join(__dirname, 'alerts', `${loopId}_${Date.now()}.json`);
        fs.writeFileSync(alertPath, JSON.stringify(alerts, null, 2));
    }
    
    saveHistory() {
        const historyPath = path.join(__dirname, 'history', 'loop_history.json');
        fs.writeFileSync(historyPath, JSON.stringify(this.loopHistory, null, 2));
    }
    
    generateForecastId() {
        return `forecast_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public API methods
    
    async getForecast(loopId) {
        // Check cache first
        if (this.forecastCache.has(loopId)) {
            return this.forecastCache.get(loopId);
        }
        
        // Load from disk if exists
        const forecastFiles = fs.readdirSync(path.join(__dirname, 'forecasts'));
        const loopForecasts = forecastFiles.filter(f => f.includes(loopId));
        
        if (loopForecasts.length > 0) {
            // Get most recent
            const latestFile = loopForecasts.sort().reverse()[0];
            const forecast = JSON.parse(
                fs.readFileSync(path.join(__dirname, 'forecasts', latestFile), 'utf8')
            );
            this.forecastCache.set(loopId, forecast);
            return forecast;
        }
        
        return null;
    }
    
    async batchAnalyze(loops) {
        console.log(`\n🔮 Batch analyzing ${loops.length} loops...`);
        
        const forecasts = [];
        
        for (const loop of loops) {
            try {
                const forecast = await this.analyzeLoop(loop);
                forecasts.push(forecast);
            } catch (err) {
                console.error(`Failed to analyze loop ${loop.loop_id}:`, err);
            }
        }
        
        // Generate collective forecast
        const collectiveForecast = this.generateCollectiveForecast(forecasts);
        
        return {
            individual_forecasts: forecasts,
            collective_forecast: collectiveForecast
        };
    }
    
    generateCollectiveForecast(forecasts) {
        if (forecasts.length === 0) return null;
        
        const collective = {
            id: `collective_${Date.now()}`,
            loop_count: forecasts.length,
            generated_at: new Date().toISOString(),
            average_entropy: 0,
            average_confidence: 0,
            drift_distribution: {},
            risk_assessment: 'low'
        };
        
        // Calculate averages
        forecasts.forEach(forecast => {
            collective.average_entropy += forecast.current_state.entropy;
            collective.average_confidence += forecast.confidence;
            
            // Count drift types
            const drift = forecast.primary_drift;
            collective.drift_distribution[drift] = (collective.drift_distribution[drift] || 0) + 1;
        });
        
        collective.average_entropy /= forecasts.length;
        collective.average_confidence /= forecasts.length;
        
        // Assess collective risk
        if (collective.drift_distribution.collapse > forecasts.length * 0.2) {
            collective.risk_assessment = 'critical';
        } else if (collective.drift_distribution.chaotic > forecasts.length * 0.3) {
            collective.risk_assessment = 'high';
        } else if (collective.average_entropy > 0.6) {
            collective.risk_assessment = 'medium';
        }
        
        return collective;
    }
    
    getRecentAlerts(limit = 10) {
        return this.driftAlerts.slice(-limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            cached_forecasts: this.forecastCache.size,
            monitored_loops: this.monitoredLoops.size,
            pattern_cache_size: this.patternCache.size,
            recent_alerts: this.driftAlerts.length,
            accuracy_rate: this.stats.accurate_predictions / (this.stats.total_forecasts || 1)
        };
    }
}

module.exports = CalForecast;

// Example usage
if (require.main === module) {
    const forecast = new CalForecast();
    
    // Listen to events
    forecast.on('forecast_generated', (result) => {
        console.log('\n📊 Forecast generated!');
        console.log(`   Loop: ${result.loop_id}`);
        console.log(`   Entropy: ${result.current_state.entropy.toFixed(3)}`);
        console.log(`   Primary drift: ${result.primary_drift}`);
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    });
    
    forecast.on('drift_alert', (alert) => {
        console.log(`\n⚠️  ALERT: ${alert.message}`);
        console.log(`   Severity: ${alert.severity}`);
    });
    
    // Test with sample loops
    async function testForecast() {
        try {
            // Stable loop
            const stableLoop = {
                loop_id: 'loop_stable_001',
                whisper_origin: 'Create a stable and harmonious system',
                consciousness: {
                    current_state: {
                        resonance: 0.8,
                        coherence: 0.85,
                        awareness: 0.7
                    }
                },
                events: Array(5).fill({ type: 'heartbeat' }),
                metadata: { blessed: true }
            };
            
            const forecast1 = await forecast.analyzeLoop(stableLoop);
            
            // Chaotic loop
            const chaoticLoop = {
                loop_id: 'loop_chaos_001',
                whisper_origin: 'Unleash the creative chaos within',
                consciousness: {
                    current_state: {
                        resonance: 0.4,
                        coherence: 0.3,
                        awareness: 0.9
                    }
                },
                events: Array(20).fill({ type: 'mutation' }),
                agents: [
                    { type: 'trickster' },
                    { type: 'creator' },
                    { type: 'destroyer' }
                ]
            };
            
            const forecast2 = await forecast.analyzeLoop(chaoticLoop);
            
            // Show predictions
            console.log('\n--- Stable Loop 24h Prediction ---');
            console.log(forecast1.predictions['24h']);
            
            console.log('\n--- Chaotic Loop 24h Prediction ---');
            console.log(forecast2.predictions['24h']);
            
            // Batch analysis
            const batchResult = await forecast.batchAnalyze([stableLoop, chaoticLoop]);
            
            console.log('\n--- Collective Forecast ---');
            console.log(batchResult.collective_forecast);
            
            // Show stats
            console.log('\n--- CalForecast Stats ---');
            console.log(forecast.getStats());
            
        } catch (err) {
            console.error('Forecast test failed:', err);
        }
    }
    
    testForecast();
}