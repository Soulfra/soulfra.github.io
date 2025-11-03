#!/usr/bin/env node
/**
 * Drift Rating Engine
 * Scores loops with volatility index based on conflicts and drift patterns
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const DriftLeak = require('../drift/DriftLeak');
const CalForecast = require('../forecast/CalForecast');

class DriftRatingEngine extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.driftLeak = new DriftLeak();
        this.forecast = new CalForecast();
        
        // Rating configuration
        this.config = {
            rating_scale: {
                min: 0,
                max: 100,
                thresholds: {
                    stable: 20,      // 0-20: Very stable
                    moderate: 40,    // 21-40: Some drift
                    volatile: 60,    // 41-60: Significant drift
                    chaotic: 80,     // 61-80: High volatility
                    critical: 100    // 81-100: Critical instability
                }
            },
            weight_factors: {
                drift_magnitude: 0.3,
                conflict_severity: 0.25,
                forecast_risk: 0.2,
                pattern_volatility: 0.15,
                time_decay: 0.1
            },
            update_interval: 10000, // 10 seconds
            history_window: 3600000 // 1 hour
        };
        
        // Rating storage
        this.ratings = new Map();
        this.ratingHistory = new Map();
        this.volatilityIndex = new Map();
        
        // Tracking state
        this.monitoredEntities = new Map();
        this.conflictTracker = new Map();
        
        // Statistics
        this.stats = {
            total_ratings: 0,
            average_volatility: 0,
            stable_loops: 0,
            volatile_loops: 0,
            critical_alerts: 0,
            rating_updates: 0
        };
        
        this.ensureDirectories();
        this.setupEventHandlers();
        this.startRatingService();
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'ratings'),
            path.join(__dirname, 'volatility'),
            path.join(__dirname, 'reports'),
            path.join(__dirname, 'alerts')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    setupEventHandlers() {
        // Listen to drift events
        this.driftLeak.on('drift_detected', (drift) => {
            this.handleDriftDetection(drift);
        });
        
        this.driftLeak.on('conflict_detected', (conflict) => {
            this.handleConflictDetection(conflict);
        });
        
        this.driftLeak.on('harmony_detected', (harmony) => {
            this.handleHarmonyDetection(harmony);
        });
        
        // Listen to forecast events
        this.forecast.on('forecast_generated', (forecast) => {
            this.handleForecastUpdate(forecast);
        });
    }
    
    startRatingService() {
        console.log('📊 Drift Rating Engine started');
        console.log(`⏱️  Updating ratings every ${this.config.update_interval}ms`);
        
        // Start rating update cycle
        this.ratingInterval = setInterval(() => {
            this.updateAllRatings();
        }, this.config.update_interval);
        
        // Start volatility calculation
        this.volatilityInterval = setInterval(() => {
            this.calculateVolatilityIndex();
        }, 30000); // Every 30 seconds
    }
    
    async rateEntity(entity, type = 'loop') {
        const entityId = entity.loop_id || entity.agent_id || entity.id;
        
        console.log(`\n📈 Rating ${type}: ${entityId}`);
        
        // Initialize monitoring if needed
        if (!this.monitoredEntities.has(entityId)) {
            await this.initializeEntityMonitoring(entity, type);
        }
        
        // Calculate rating components
        const components = {
            drift: await this.calculateDriftComponent(entity, type),
            conflict: this.calculateConflictComponent(entityId),
            forecast: await this.calculateForecastComponent(entity, type),
            pattern: this.calculatePatternComponent(entityId),
            time: this.calculateTimeComponent(entityId)
        };
        
        // Calculate weighted rating
        const rating = this.calculateWeightedRating(components);
        
        // Determine category
        const category = this.categorizeRating(rating.score);
        
        // Create rating record
        const ratingRecord = {
            entity_id: entityId,
            entity_type: type,
            timestamp: new Date().toISOString(),
            score: rating.score,
            category,
            components,
            weighted_components: rating.weighted,
            confidence: rating.confidence,
            alerts: []
        };
        
        // Check for alerts
        if (category === 'critical') {
            ratingRecord.alerts.push({
                type: 'critical_volatility',
                message: `${type} ${entityId} has reached critical volatility`,
                severity: 'high'
            });
            this.stats.critical_alerts++;
        }
        
        // Store rating
        this.ratings.set(entityId, ratingRecord);
        this.addToHistory(entityId, ratingRecord);
        
        // Update stats
        this.stats.total_ratings++;
        this.updateStatistics(ratingRecord);
        
        // Save rating
        this.saveRating(ratingRecord);
        
        // Emit rating event
        this.emit('entity_rated', ratingRecord);
        
        console.log(`  Score: ${rating.score.toFixed(1)}/100`);
        console.log(`  Category: ${category}`);
        console.log(`  Confidence: ${(rating.confidence * 100).toFixed(1)}%`);
        
        return ratingRecord;
    }
    
    async initializeEntityMonitoring(entity, type) {
        // Start drift monitoring
        await this.driftLeak.monitorEntity(entity, type);
        
        // Analyze with forecast
        if (type === 'loop') {
            await this.forecast.analyzeLoop(entity);
        }
        
        // Initialize tracking
        this.monitoredEntities.set(entity.loop_id || entity.agent_id || entity.id, {
            entity,
            type,
            started_monitoring: new Date().toISOString(),
            drift_events: [],
            conflicts: []
        });
    }
    
    async calculateDriftComponent(entity, type) {
        const entityId = entity.loop_id || entity.agent_id || entity.id;
        const monitor = this.monitoredEntities.get(entityId);
        
        if (!monitor || monitor.drift_events.length === 0) {
            return {
                score: 0,
                confidence: 0.1,
                details: 'No drift data available'
            };
        }
        
        // Get recent drift events
        const recentDrifts = monitor.drift_events.filter(d => {
            return Date.now() - new Date(d.detected_at).getTime() < this.config.history_window;
        });
        
        if (recentDrifts.length === 0) {
            return {
                score: 0,
                confidence: 0.5,
                details: 'No recent drift events'
            };
        }
        
        // Calculate drift score
        let totalMagnitude = 0;
        let severityMultiplier = 1;
        
        recentDrifts.forEach(drift => {
            const magnitude = drift.metrics?.shift_magnitude || 
                             drift.metrics?.drift_rate || 
                             drift.metrics?.decay_amount || 
                             0.5;
            
            totalMagnitude += magnitude;
            
            // Severity multipliers
            if (drift.severity === 'critical') severityMultiplier *= 1.5;
            else if (drift.severity === 'high') severityMultiplier *= 1.3;
            else if (drift.severity === 'medium') severityMultiplier *= 1.1;
        });
        
        const avgMagnitude = totalMagnitude / recentDrifts.length;
        const driftScore = Math.min(100, avgMagnitude * 100 * severityMultiplier);
        
        return {
            score: driftScore,
            confidence: Math.min(1.0, recentDrifts.length / 10),
            magnitude: avgMagnitude,
            event_count: recentDrifts.length,
            details: `${recentDrifts.length} drift events, avg magnitude ${avgMagnitude.toFixed(3)}`
        };
    }
    
    calculateConflictComponent(entityId) {
        const conflicts = this.conflictTracker.get(entityId) || [];
        const recentConflicts = conflicts.filter(c => {
            return Date.now() - c.timestamp < this.config.history_window;
        });
        
        if (recentConflicts.length === 0) {
            return {
                score: 0,
                confidence: 0.8,
                details: 'No conflicts detected'
            };
        }
        
        // Score based on conflict frequency and severity
        let conflictScore = 0;
        
        recentConflicts.forEach(conflict => {
            if (conflict.severity === 'critical') conflictScore += 30;
            else if (conflict.severity === 'high') conflictScore += 20;
            else if (conflict.severity === 'medium') conflictScore += 10;
            else conflictScore += 5;
        });
        
        return {
            score: Math.min(100, conflictScore),
            confidence: 0.9,
            conflict_count: recentConflicts.length,
            details: `${recentConflicts.length} recent conflicts`
        };
    }
    
    async calculateForecastComponent(entity, type) {
        if (type !== 'loop') {
            return {
                score: 0,
                confidence: 0,
                details: 'Forecast only available for loops'
            };
        }
        
        const forecast = await this.forecast.getForecast(entity.loop_id);
        
        if (!forecast) {
            return {
                score: 0,
                confidence: 0,
                details: 'No forecast available'
            };
        }
        
        // Score based on predicted drift
        const prediction24h = forecast.predictions['24h'];
        if (!prediction24h) {
            return {
                score: 0,
                confidence: 0,
                details: 'No 24h prediction'
            };
        }
        
        let forecastScore = 0;
        
        // Entropy contribution
        forecastScore += prediction24h.entropy * 30;
        
        // Drift risk contribution
        if (prediction24h.drift_risk === 'high') forecastScore += 40;
        else if (prediction24h.drift_risk === 'medium') forecastScore += 20;
        
        // Primary drift category
        if (forecast.primary_drift === 'collapse') forecastScore += 30;
        else if (forecast.primary_drift === 'chaotic') forecastScore += 20;
        else if (forecast.primary_drift === 'divergent') forecastScore += 10;
        
        return {
            score: Math.min(100, forecastScore),
            confidence: forecast.confidence,
            entropy: prediction24h.entropy,
            drift_risk: prediction24h.drift_risk,
            primary_drift: forecast.primary_drift,
            details: `Predicted ${forecast.primary_drift} drift, ${prediction24h.drift_risk} risk`
        };
    }
    
    calculatePatternComponent(entityId) {
        const history = this.ratingHistory.get(entityId) || [];
        
        if (history.length < 3) {
            return {
                score: 0,
                confidence: 0.2,
                details: 'Insufficient history for pattern analysis'
            };
        }
        
        // Calculate volatility from historical ratings
        const recentRatings = history.slice(-10).map(h => h.score);
        
        // Calculate standard deviation
        const mean = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
        const variance = recentRatings.reduce((sum, rating) => {
            return sum + Math.pow(rating - mean, 2);
        }, 0) / recentRatings.length;
        const stdDev = Math.sqrt(variance);
        
        // Higher standard deviation = more volatile
        const volatilityScore = Math.min(100, stdDev * 2);
        
        // Check for trending
        let trend = 'stable';
        if (recentRatings.length >= 5) {
            const firstHalf = recentRatings.slice(0, Math.floor(recentRatings.length / 2));
            const secondHalf = recentRatings.slice(Math.floor(recentRatings.length / 2));
            
            const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
            
            if (secondAvg > firstAvg * 1.2) trend = 'increasing';
            else if (secondAvg < firstAvg * 0.8) trend = 'decreasing';
        }
        
        return {
            score: volatilityScore,
            confidence: Math.min(1.0, history.length / 20),
            volatility: stdDev,
            trend,
            sample_size: recentRatings.length,
            details: `Volatility: ${stdDev.toFixed(1)}, Trend: ${trend}`
        };
    }
    
    calculateTimeComponent(entityId) {
        const monitor = this.monitoredEntities.get(entityId);
        
        if (!monitor) {
            return {
                score: 0,
                confidence: 0,
                details: 'No monitoring data'
            };
        }
        
        // Time since monitoring started
        const monitoringDuration = Date.now() - new Date(monitor.started_monitoring).getTime();
        const hours = monitoringDuration / (1000 * 60 * 60);
        
        // Newer entities are considered more volatile
        let timeScore = 0;
        
        if (hours < 1) timeScore = 30;
        else if (hours < 6) timeScore = 20;
        else if (hours < 24) timeScore = 10;
        else if (hours < 168) timeScore = 5; // 1 week
        
        return {
            score: timeScore,
            confidence: 0.9,
            monitoring_hours: hours,
            details: `Monitored for ${hours.toFixed(1)} hours`
        };
    }
    
    calculateWeightedRating(components) {
        const weights = this.config.weight_factors;
        let totalScore = 0;
        let totalWeight = 0;
        let totalConfidence = 0;
        
        const weighted = {};
        
        // Apply weights
        Object.entries(components).forEach(([name, component]) => {
            const weight = weights[`${name}_${component.score > 50 ? 'high' : 'low'}`] || 
                          weights[name === 'drift' ? 'drift_magnitude' : 
                                  name === 'conflict' ? 'conflict_severity' :
                                  name === 'forecast' ? 'forecast_risk' :
                                  name === 'pattern' ? 'pattern_volatility' :
                                  'time_decay'];
            
            const weightedScore = component.score * weight;
            weighted[name] = {
                raw: component.score,
                weight,
                weighted: weightedScore
            };
            
            totalScore += weightedScore;
            totalWeight += weight;
            totalConfidence += component.confidence * weight;
        });
        
        // Normalize
        const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
        const avgConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;
        
        return {
            score: Math.min(100, Math.max(0, finalScore)),
            weighted,
            confidence: avgConfidence
        };
    }
    
    categorizeRating(score) {
        const thresholds = this.config.rating_scale.thresholds;
        
        if (score <= thresholds.stable) return 'stable';
        if (score <= thresholds.moderate) return 'moderate';
        if (score <= thresholds.volatile) return 'volatile';
        if (score <= thresholds.chaotic) return 'chaotic';
        return 'critical';
    }
    
    addToHistory(entityId, rating) {
        if (!this.ratingHistory.has(entityId)) {
            this.ratingHistory.set(entityId, []);
        }
        
        const history = this.ratingHistory.get(entityId);
        history.push({
            timestamp: rating.timestamp,
            score: rating.score,
            category: rating.category
        });
        
        // Keep only recent history
        const cutoff = Date.now() - (this.config.history_window * 24); // 24 hours
        const filtered = history.filter(h => {
            return new Date(h.timestamp).getTime() > cutoff;
        });
        
        this.ratingHistory.set(entityId, filtered);
    }
    
    updateStatistics(rating) {
        // Update category counts
        if (rating.category === 'stable') {
            this.stats.stable_loops++;
        } else if (rating.category === 'volatile' || 
                   rating.category === 'chaotic' || 
                   rating.category === 'critical') {
            this.stats.volatile_loops++;
        }
        
        // Update average volatility
        const allRatings = Array.from(this.ratings.values());
        const totalVolatility = allRatings.reduce((sum, r) => sum + r.score, 0);
        this.stats.average_volatility = totalVolatility / allRatings.length;
        
        this.stats.rating_updates++;
    }
    
    saveRating(rating) {
        const filename = `rating_${rating.entity_id}_${Date.now()}.json`;
        const filepath = path.join(__dirname, 'ratings', filename);
        
        fs.writeFileSync(filepath, JSON.stringify(rating, null, 2));
    }
    
    handleDriftDetection(drift) {
        const monitor = this.monitoredEntities.get(drift.entity_id);
        
        if (monitor) {
            monitor.drift_events.push({
                ...drift,
                detected_at: new Date().toISOString()
            });
            
            // Trigger rating update
            this.updateEntityRating(drift.entity_id);
        }
    }
    
    handleConflictDetection(conflict) {
        // Track conflicts for involved entities
        conflict.entities.forEach(entityId => {
            if (!this.conflictTracker.has(entityId)) {
                this.conflictTracker.set(entityId, []);
            }
            
            this.conflictTracker.get(entityId).push({
                ...conflict,
                timestamp: Date.now()
            });
            
            // Trigger rating update
            this.updateEntityRating(entityId);
        });
    }
    
    handleHarmonyDetection(harmony) {
        // Harmony reduces volatility score
        harmony.entities.forEach(entityId => {
            const monitor = this.monitoredEntities.get(entityId);
            
            if (monitor) {
                // Add positive event
                monitor.drift_events.push({
                    type: 'harmony',
                    severity: 'positive',
                    detected_at: new Date().toISOString()
                });
                
                this.updateEntityRating(entityId);
            }
        });
    }
    
    handleForecastUpdate(forecast) {
        // Trigger rating update when new forecast available
        this.updateEntityRating(forecast.loop_id);
    }
    
    async updateEntityRating(entityId) {
        const monitor = this.monitoredEntities.get(entityId);
        
        if (monitor) {
            await this.rateEntity(monitor.entity, monitor.type);
        }
    }
    
    async updateAllRatings() {
        const updates = [];
        
        for (const [entityId, monitor] of this.monitoredEntities) {
            updates.push(this.rateEntity(monitor.entity, monitor.type));
        }
        
        await Promise.all(updates);
    }
    
    calculateVolatilityIndex() {
        console.log('\n📊 Calculating platform volatility index...');
        
        const allRatings = Array.from(this.ratings.values());
        
        if (allRatings.length === 0) {
            return;
        }
        
        // Calculate by category
        const categoryBreakdown = {
            stable: 0,
            moderate: 0,
            volatile: 0,
            chaotic: 0,
            critical: 0
        };
        
        allRatings.forEach(rating => {
            categoryBreakdown[rating.category]++;
        });
        
        // Calculate overall index
        const totalEntities = allRatings.length;
        const volatilityIndex = {
            timestamp: new Date().toISOString(),
            overall_score: this.stats.average_volatility,
            category_distribution: categoryBreakdown,
            category_percentages: {},
            risk_level: 'low',
            total_entities: totalEntities
        };
        
        // Calculate percentages
        Object.entries(categoryBreakdown).forEach(([category, count]) => {
            volatilityIndex.category_percentages[category] = 
                (count / totalEntities * 100).toFixed(1) + '%';
        });
        
        // Determine risk level
        const criticalPercent = categoryBreakdown.critical / totalEntities;
        const chaoticPercent = categoryBreakdown.chaotic / totalEntities;
        const volatilePercent = categoryBreakdown.volatile / totalEntities;
        
        if (criticalPercent > 0.1) volatilityIndex.risk_level = 'critical';
        else if (criticalPercent + chaoticPercent > 0.2) volatilityIndex.risk_level = 'high';
        else if (criticalPercent + chaoticPercent + volatilePercent > 0.4) volatilityIndex.risk_level = 'medium';
        
        // Store index
        this.volatilityIndex.set(new Date().toISOString(), volatilityIndex);
        
        // Save report
        this.saveVolatilityReport(volatilityIndex);
        
        // Emit index update
        this.emit('volatility_index_updated', volatilityIndex);
        
        console.log(`  Overall: ${volatilityIndex.overall_score.toFixed(1)}/100`);
        console.log(`  Risk Level: ${volatilityIndex.risk_level}`);
        console.log(`  Critical: ${volatilityIndex.category_percentages.critical}`);
    }
    
    saveVolatilityReport(index) {
        const reportPath = path.join(
            __dirname,
            'volatility',
            `index_${new Date().toISOString().split('T')[0]}.json`
        );
        
        // Append to daily report
        let dailyReport = [];
        if (fs.existsSync(reportPath)) {
            dailyReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        }
        
        dailyReport.push(index);
        
        fs.writeFileSync(reportPath, JSON.stringify(dailyReport, null, 2));
    }
    
    // Public API methods
    
    async getRating(entityId) {
        return this.ratings.get(entityId);
    }
    
    getRatingHistory(entityId, limit = 10) {
        const history = this.ratingHistory.get(entityId) || [];
        return history.slice(-limit);
    }
    
    getVolatilityIndex() {
        const indices = Array.from(this.volatilityIndex.values());
        return indices[indices.length - 1]; // Most recent
    }
    
    getVolatilityTrend(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        const indices = Array.from(this.volatilityIndex.entries())
            .filter(([timestamp]) => new Date(timestamp).getTime() > cutoff)
            .map(([_, index]) => index);
        
        return indices;
    }
    
    getCriticalEntities() {
        return Array.from(this.ratings.values())
            .filter(rating => rating.category === 'critical')
            .map(rating => ({
                entity_id: rating.entity_id,
                entity_type: rating.entity_type,
                score: rating.score,
                alerts: rating.alerts
            }));
    }
    
    getStats() {
        return {
            ...this.stats,
            monitored_entities: this.monitoredEntities.size,
            total_ratings: this.ratings.size,
            volatility_index: this.getVolatilityIndex()
        };
    }
    
    stop() {
        console.log('🛑 Stopping Drift Rating Engine...');
        
        if (this.ratingInterval) clearInterval(this.ratingInterval);
        if (this.volatilityInterval) clearInterval(this.volatilityInterval);
        
        this.driftLeak.stop();
        
        console.log('  Rating engine stopped');
    }
}

module.exports = DriftRatingEngine;

// Example usage
if (require.main === module) {
    const ratingEngine = new DriftRatingEngine();
    
    // Listen to events
    ratingEngine.on('entity_rated', (rating) => {
        console.log(`\n📊 Rating updated: ${rating.entity_id}`);
        console.log(`   Score: ${rating.score.toFixed(1)}`);
        console.log(`   Category: ${rating.category}`);
        
        if (rating.alerts.length > 0) {
            console.log(`   ⚠️  Alerts: ${rating.alerts.map(a => a.message).join(', ')}`);
        }
    });
    
    ratingEngine.on('volatility_index_updated', (index) => {
        console.log(`\n🌍 Platform Volatility Index Updated`);
        console.log(`   Risk Level: ${index.risk_level}`);
        console.log(`   Distribution: ${JSON.stringify(index.category_percentages)}`);
    });
    
    // Test rating
    async function testRating() {
        try {
            // Test stable loop
            const stableLoop = {
                loop_id: 'loop_stable_rating_001',
                consciousness: {
                    current_state: {
                        resonance: 0.85,
                        coherence: 0.9,
                        awareness: 0.8
                    }
                },
                created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 2 days old
            };
            
            const stableRating = await ratingEngine.rateEntity(stableLoop, 'loop');
            
            // Test volatile loop
            const volatileLoop = {
                loop_id: 'loop_volatile_rating_001',
                consciousness: {
                    current_state: {
                        resonance: 0.4,
                        coherence: 0.3,
                        awareness: 0.9
                    }
                },
                created_at: new Date().toISOString() // Just created
            };
            
            const volatileRating = await ratingEngine.rateEntity(volatileLoop, 'loop');
            
            // Simulate some drift events
            setTimeout(() => {
                // Trigger drift on volatile loop
                volatileLoop.consciousness.current_state.resonance = 0.2;
                ratingEngine.driftLeak.monitorEntity(volatileLoop, 'loop');
            }, 3000);
            
            // Check stats after 15 seconds
            setTimeout(() => {
                console.log('\n--- Drift Rating Engine Stats ---');
                console.log(ratingEngine.getStats());
                
                console.log('\n--- Critical Entities ---');
                console.log(ratingEngine.getCriticalEntities());
                
                ratingEngine.stop();
                process.exit(0);
            }, 15000);
            
        } catch (err) {
            console.error('Test failed:', err);
        }
    }
    
    testRating();
}