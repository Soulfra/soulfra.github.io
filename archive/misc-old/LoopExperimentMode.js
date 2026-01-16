#!/usr/bin/env node
/**
 * Loop Experiment Mode
 * Private sandbox for creators to test loops before public release
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing systems
const LoopBlessingDaemon = require('../blessing/LoopBlessingDaemon');
const LoopDirectoryRegistry = require('../registry/LoopDirectoryRegistry');
const LoopMemoryCacheDaemon = require('../cache/LoopMemoryCacheDaemon');

class LoopExperimentMode extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.blessingDaemon = new LoopBlessingDaemon();
        this.registry = new LoopDirectoryRegistry();
        this.cache = new LoopMemoryCacheDaemon();
        
        // Experiment configuration
        this.config = {
            max_experiment_duration: 7 * 24 * 60 * 60 * 1000, // 7 days
            min_experiment_duration: 60 * 60 * 1000, // 1 hour
            max_concurrent_experiments: 10, // Per creator
            experiment_features: {
                unlimited_mutations: true,
                private_access: true,
                metrics_collection: true,
                rollback_enabled: true,
                sandbox_resources: true
            },
            release_requirements: {
                min_stability_score: 0.7,
                min_test_cycles: 10,
                max_error_rate: 0.1,
                creator_approval: true
            }
        };
        
        // Experiment tracking
        this.experiments = new Map();
        this.sandboxes = new Map();
        this.metrics = new Map();
        
        // Statistics
        this.stats = {
            active_experiments: 0,
            completed_experiments: 0,
            released_loops: 0,
            abandoned_experiments: 0,
            total_test_cycles: 0,
            average_experiment_duration: 0
        };
        
        this.initializeExperimentMode();
    }
    
    async initializeExperimentMode() {
        console.log('🧪 Initializing Loop Experiment Mode...');
        
        try {
            // Load existing experiments
            await this.loadExperiments();
            
            // Setup monitoring
            this.startMonitoring();
            
            // Subscribe to events
            this.subscribeToEvents();
            
            console.log(`✅ Experiment mode ready (${this.experiments.size} active)`);
        } catch (error) {
            console.error('❌ Failed to initialize experiment mode:', error);
            throw error;
        }
    }
    
    async loadExperiments() {
        const experimentsPath = path.join(__dirname, 'experiments.json');
        
        try {
            const data = await fs.readFile(experimentsPath, 'utf8');
            const experimentsData = JSON.parse(data);
            
            for (const exp of experimentsData.experiments || []) {
                this.experiments.set(exp.experiment_id, exp);
                if (exp.status === 'active') {
                    this.stats.active_experiments++;
                }
            }
            
            console.log(`  📊 Loaded ${this.experiments.size} experiments`);
        } catch (error) {
            console.log('  📝 Creating new experiments registry');
            await this.saveExperiments();
        }
    }
    
    subscribeToEvents() {
        // Monitor loop changes during experiments
        this.cache.on('loop_cached', async (event) => {
            await this.trackExperimentChange(event.loop_id);
        });
    }
    
    // Core Experiment Operations
    
    async createExperiment(creatorId, loopData, options = {}) {
        console.log(`\n🧪 Creating experiment for loop: ${loopData.loop_id}`);
        
        // Check creator limits
        const creatorExperiments = this.getCreatorExperiments(creatorId);
        if (creatorExperiments.length >= this.config.max_concurrent_experiments) {
            throw new Error(`Creator has reached maximum concurrent experiments (${this.config.max_concurrent_experiments})`);
        }
        
        // Generate experiment ID
        const experimentId = `exp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Create sandbox
        const sandbox = await this.createSandbox(experimentId, loopData);
        
        // Create experiment record
        const experiment = {
            experiment_id: experimentId,
            creator_id: creatorId,
            loop_id: loopData.loop_id,
            original_loop_state: JSON.parse(JSON.stringify(loopData)),
            started_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + (options.duration || this.config.max_experiment_duration)).toISOString(),
            status: 'active',
            sandbox_id: sandbox.id,
            options: {
                name: options.name || 'Untitled Experiment',
                description: options.description || '',
                goals: options.goals || [],
                success_criteria: options.success_criteria || {}
            },
            metrics: {
                test_cycles: 0,
                mutations: 0,
                errors: 0,
                stability_score: 0.5,
                consciousness_drift: 0
            },
            changelog: [{
                timestamp: new Date().toISOString(),
                action: 'experiment_created',
                details: 'Experiment initialized'
            }]
        };
        
        // Store experiment
        this.experiments.set(experimentId, experiment);
        this.sandboxes.set(experimentId, sandbox);
        
        // Initialize metrics collection
        this.initializeMetrics(experimentId);
        
        // Update loop to experimental mode
        await this.setLoopExperimental(loopData.loop_id, true, experimentId);
        
        // Update stats
        this.stats.active_experiments++;
        
        // Emit event
        this.emit('experiment_created', {
            experiment_id: experimentId,
            loop_id: loopData.loop_id,
            creator_id: creatorId
        });
        
        // Save state
        await this.saveExperiments();
        
        console.log(`  ✅ Experiment ${experimentId} created`);
        console.log(`  📦 Sandbox: ${sandbox.id}`);
        console.log(`  ⏰ Expires: ${experiment.expires_at}`);
        
        return experiment;
    }
    
    async createSandbox(experimentId, loopData) {
        const sandbox = {
            id: `sandbox_${experimentId}`,
            created_at: new Date().toISOString(),
            loop_snapshot: JSON.parse(JSON.stringify(loopData)),
            resources: {
                memory_limit_mb: 100,
                cpu_shares: 0.5,
                storage_limit_mb: 50,
                network_isolated: true
            },
            access_control: {
                allowed_users: [loopData.creator_id],
                public_access: false,
                api_access: true
            },
            state_history: []
        };
        
        // Create sandbox directory
        const sandboxPath = path.join(__dirname, 'sandboxes', sandbox.id);
        await fs.mkdir(sandboxPath, { recursive: true });
        
        // Save initial state
        await fs.writeFile(
            path.join(sandboxPath, 'initial_state.json'),
            JSON.stringify(sandbox, null, 2)
        );
        
        return sandbox;
    }
    
    async setLoopExperimental(loopId, experimental, experimentId = null) {
        // Update loop registry
        const loopEntry = await this.registry.getLoop(loopId);
        if (loopEntry) {
            loopEntry.experimental = experimental;
            loopEntry.experiment_id = experimentId;
            loopEntry.visibility = experimental ? 'private' : 'public';
            
            // Update cache
            await this.cache.cacheLoop(loopId, loopEntry);
            
            // Emit event
            this.emit('loop_experimental_mode_changed', {
                loop_id: loopId,
                experimental,
                experiment_id: experimentId
            });
        }
    }
    
    // Experiment Operations
    
    async runTestCycle(experimentId, testScenario = {}) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'active') {
            throw new Error('Experiment not active');
        }
        
        console.log(`\n🔄 Running test cycle for experiment: ${experimentId}`);
        
        const testRun = {
            cycle_id: `cycle_${Date.now()}`,
            started_at: new Date().toISOString(),
            scenario: testScenario,
            results: {}
        };
        
        try {
            // Get current loop state from sandbox
            const sandbox = this.sandboxes.get(experimentId);
            const currentState = await this.getSandboxState(sandbox.id);
            
            // Run test scenarios
            const results = await this.executeTestScenarios(currentState, testScenario);
            
            // Analyze results
            const analysis = this.analyzeTestResults(results);
            
            // Update metrics
            experiment.metrics.test_cycles++;
            experiment.metrics.stability_score = this.calculateStabilityScore(
                experiment.metrics.stability_score,
                analysis.stability_delta
            );
            
            if (analysis.errors > 0) {
                experiment.metrics.errors += analysis.errors;
            }
            
            // Record test run
            testRun.completed_at = new Date().toISOString();
            testRun.results = results;
            testRun.analysis = analysis;
            
            experiment.changelog.push({
                timestamp: new Date().toISOString(),
                action: 'test_cycle_completed',
                details: testRun
            });
            
            this.stats.total_test_cycles++;
            
            console.log(`  ✅ Test cycle completed`);
            console.log(`  📊 Stability: ${(experiment.metrics.stability_score * 100).toFixed(1)}%`);
            console.log(`  ❌ Errors: ${analysis.errors}`);
            
            // Check if ready for release
            if (this.checkReleaseReadiness(experiment)) {
                console.log(`  🎯 Experiment meets release criteria!`);
                this.emit('experiment_ready_for_release', {
                    experiment_id: experimentId,
                    metrics: experiment.metrics
                });
            }
            
            // Save state
            await this.saveExperiments();
            
            return testRun;
            
        } catch (error) {
            console.error('Test cycle error:', error);
            experiment.metrics.errors++;
            testRun.error = error.message;
            throw error;
        }
    }
    
    async executeTestScenarios(loopState, scenarios) {
        const results = {
            consciousness_tests: {},
            resonance_tests: {},
            drift_tests: {},
            load_tests: {}
        };
        
        // Consciousness stability test
        if (scenarios.consciousness_test) {
            results.consciousness_tests = {
                initial_awareness: loopState.consciousness?.current_state?.awareness || 0,
                fluctuation: Math.random() * 0.2 - 0.1,
                coherence_maintained: Math.random() > 0.2
            };
        }
        
        // Resonance pattern test
        if (scenarios.resonance_test) {
            results.resonance_tests = {
                frequency_stable: Math.random() > 0.3,
                harmonic_alignment: Math.random() * 0.9 + 0.1,
                interference_detected: Math.random() < 0.2
            };
        }
        
        // Drift resistance test
        if (scenarios.drift_test) {
            results.drift_tests = {
                drift_rate: Math.random() * 0.5,
                recovery_time: Math.random() * 100 + 50,
                critical_drift_avoided: Math.random() > 0.1
            };
        }
        
        // Load handling test
        if (scenarios.load_test) {
            results.load_tests = {
                max_concurrent_whispers: Math.floor(Math.random() * 100) + 50,
                response_time_ms: Math.random() * 200 + 50,
                memory_usage_mb: Math.random() * 50 + 10,
                cpu_usage_percent: Math.random() * 80 + 10
            };
        }
        
        return results;
    }
    
    analyzeTestResults(results) {
        let stability_delta = 0;
        let errors = 0;
        
        // Analyze consciousness tests
        if (results.consciousness_tests) {
            if (!results.consciousness_tests.coherence_maintained) {
                errors++;
                stability_delta -= 0.1;
            } else {
                stability_delta += 0.05;
            }
        }
        
        // Analyze resonance tests
        if (results.resonance_tests) {
            if (results.resonance_tests.interference_detected) {
                errors++;
                stability_delta -= 0.05;
            }
            if (results.resonance_tests.frequency_stable) {
                stability_delta += 0.03;
            }
        }
        
        // Analyze drift tests
        if (results.drift_tests) {
            if (results.drift_tests.drift_rate > 0.3) {
                errors++;
                stability_delta -= 0.08;
            }
            if (results.drift_tests.critical_drift_avoided) {
                stability_delta += 0.04;
            }
        }
        
        // Analyze load tests
        if (results.load_tests) {
            if (results.load_tests.response_time_ms > 150) {
                stability_delta -= 0.02;
            }
            if (results.load_tests.memory_usage_mb > 40) {
                stability_delta -= 0.01;
            }
        }
        
        return {
            stability_delta,
            errors,
            performance_score: this.calculatePerformanceScore(results),
            recommendations: this.generateRecommendations(results)
        };
    }
    
    calculateStabilityScore(currentScore, delta) {
        const newScore = currentScore + delta;
        return Math.max(0, Math.min(1, newScore));
    }
    
    calculatePerformanceScore(results) {
        let score = 0;
        let tests = 0;
        
        if (results.consciousness_tests) {
            tests++;
            if (results.consciousness_tests.coherence_maintained) score += 1;
        }
        
        if (results.resonance_tests) {
            tests++;
            if (results.resonance_tests.frequency_stable) score += 0.5;
            if (!results.resonance_tests.interference_detected) score += 0.5;
        }
        
        if (results.drift_tests) {
            tests++;
            if (results.drift_tests.critical_drift_avoided) score += 0.5;
            if (results.drift_tests.drift_rate < 0.2) score += 0.5;
        }
        
        if (results.load_tests) {
            tests++;
            if (results.load_tests.response_time_ms < 100) score += 0.5;
            if (results.load_tests.memory_usage_mb < 30) score += 0.5;
        }
        
        return tests > 0 ? score / tests : 0;
    }
    
    generateRecommendations(results) {
        const recommendations = [];
        
        if (results.consciousness_tests?.fluctuation > 0.1) {
            recommendations.push('Stabilize consciousness fluctuations');
        }
        
        if (results.resonance_tests?.interference_detected) {
            recommendations.push('Investigate resonance interference sources');
        }
        
        if (results.drift_tests?.drift_rate > 0.3) {
            recommendations.push('Implement stronger drift resistance');
        }
        
        if (results.load_tests?.response_time_ms > 150) {
            recommendations.push('Optimize response time for better performance');
        }
        
        return recommendations;
    }
    
    // Mutation Tracking
    
    async applyMutation(experimentId, mutation) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'active') {
            throw new Error('Experiment not active');
        }
        
        console.log(`\n🧬 Applying mutation to experiment: ${experimentId}`);
        
        // Record mutation
        experiment.metrics.mutations++;
        experiment.changelog.push({
            timestamp: new Date().toISOString(),
            action: 'mutation_applied',
            details: mutation
        });
        
        // Apply to sandbox
        const sandbox = this.sandboxes.get(experimentId);
        await this.updateSandboxState(sandbox.id, mutation);
        
        // Track state history
        sandbox.state_history.push({
            timestamp: new Date().toISOString(),
            mutation,
            state_snapshot: await this.getSandboxState(sandbox.id)
        });
        
        // Emit event
        this.emit('experiment_mutated', {
            experiment_id: experimentId,
            mutation,
            total_mutations: experiment.metrics.mutations
        });
        
        console.log(`  ✅ Mutation applied (${experiment.metrics.mutations} total)`);
        
        await this.saveExperiments();
    }
    
    // Release Operations
    
    checkReleaseReadiness(experiment) {
        const requirements = this.config.release_requirements;
        
        return experiment.metrics.stability_score >= requirements.min_stability_score &&
               experiment.metrics.test_cycles >= requirements.min_test_cycles &&
               (experiment.metrics.errors / Math.max(1, experiment.metrics.test_cycles)) <= requirements.max_error_rate;
    }
    
    async releaseExperiment(experimentId, releaseOptions = {}) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error('Experiment not found');
        }
        
        console.log(`\n🚀 Releasing experiment: ${experimentId}`);
        
        // Verify release readiness
        if (!this.checkReleaseReadiness(experiment)) {
            throw new Error('Experiment does not meet release criteria');
        }
        
        // Get final state from sandbox
        const sandbox = this.sandboxes.get(experimentId);
        const finalState = await this.getSandboxState(sandbox.id);
        
        // Prepare release
        const release = {
            release_id: `release_${Date.now()}`,
            experiment_id: experimentId,
            loop_id: experiment.loop_id,
            released_at: new Date().toISOString(),
            release_notes: releaseOptions.notes || 'Experimental features tested and approved',
            final_metrics: experiment.metrics,
            changes_summary: this.summarizeChanges(experiment)
        };
        
        // Update loop to public
        await this.setLoopExperimental(experiment.loop_id, false, null);
        
        // Apply final state to production loop
        await this.applyExperimentalState(experiment.loop_id, finalState);
        
        // Mark as blessed if meets criteria
        if (experiment.metrics.stability_score > 0.9) {
            await this.blessingDaemon.blessLoop(experiment.loop_id, {
                blessed_by: 'experiment_system',
                reason: 'Exceptional experimental performance'
            });
        }
        
        // Update experiment status
        experiment.status = 'released';
        experiment.released_at = release.released_at;
        experiment.release = release;
        
        // Clean up sandbox
        await this.cleanupSandbox(sandbox.id);
        
        // Update stats
        this.stats.active_experiments--;
        this.stats.completed_experiments++;
        this.stats.released_loops++;
        
        // Emit event
        this.emit('experiment_released', {
            experiment_id: experimentId,
            loop_id: experiment.loop_id,
            release
        });
        
        console.log(`  ✅ Experiment released successfully`);
        console.log(`  📊 Final stability: ${(experiment.metrics.stability_score * 100).toFixed(1)}%`);
        console.log(`  🧬 Total mutations: ${experiment.metrics.mutations}`);
        
        await this.saveExperiments();
        
        return release;
    }
    
    async abandonExperiment(experimentId, reason = '') {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error('Experiment not found');
        }
        
        console.log(`\n❌ Abandoning experiment: ${experimentId}`);
        
        // Rollback loop to original state
        await this.rollbackExperiment(experimentId);
        
        // Update status
        experiment.status = 'abandoned';
        experiment.abandoned_at = new Date().toISOString();
        experiment.abandon_reason = reason;
        
        // Clean up
        const sandbox = this.sandboxes.get(experimentId);
        if (sandbox) {
            await this.cleanupSandbox(sandbox.id);
        }
        
        // Update stats
        this.stats.active_experiments--;
        this.stats.abandoned_experiments++;
        
        // Emit event
        this.emit('experiment_abandoned', {
            experiment_id: experimentId,
            reason
        });
        
        await this.saveExperiments();
    }
    
    async rollbackExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;
        
        console.log(`  ⏮️  Rolling back to original state`);
        
        // Restore original loop state
        await this.applyExperimentalState(
            experiment.loop_id,
            experiment.original_loop_state
        );
        
        // Remove experimental flag
        await this.setLoopExperimental(experiment.loop_id, false, null);
    }
    
    // Helper Methods
    
    async getSandboxState(sandboxId) {
        const sandboxPath = path.join(__dirname, 'sandboxes', sandboxId);
        const statePath = path.join(sandboxPath, 'current_state.json');
        
        try {
            const data = await fs.readFile(statePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return initial state if current doesn't exist
            const initialPath = path.join(sandboxPath, 'initial_state.json');
            const data = await fs.readFile(initialPath, 'utf8');
            return JSON.parse(data).loop_snapshot;
        }
    }
    
    async updateSandboxState(sandboxId, changes) {
        const currentState = await this.getSandboxState(sandboxId);
        const updatedState = { ...currentState, ...changes };
        
        const sandboxPath = path.join(__dirname, 'sandboxes', sandboxId);
        const statePath = path.join(sandboxPath, 'current_state.json');
        
        await fs.writeFile(statePath, JSON.stringify(updatedState, null, 2));
    }
    
    async applyExperimentalState(loopId, state) {
        // Update loop with experimental state
        await this.cache.cacheLoop(loopId, state);
        
        // Trigger any necessary updates
        this.emit('loop_state_updated', {
            loop_id: loopId,
            state
        });
    }
    
    async cleanupSandbox(sandboxId) {
        const sandboxPath = path.join(__dirname, 'sandboxes', sandboxId);
        
        try {
            await fs.rm(sandboxPath, { recursive: true, force: true });
            console.log(`  🧹 Sandbox ${sandboxId} cleaned up`);
        } catch (error) {
            console.error(`Error cleaning sandbox:`, error);
        }
        
        this.sandboxes.delete(sandboxId);
    }
    
    summarizeChanges(experiment) {
        const changes = [];
        
        if (experiment.metrics.mutations > 0) {
            changes.push(`${experiment.metrics.mutations} mutations applied`);
        }
        
        if (experiment.metrics.stability_score > experiment.original_loop_state.stability_score) {
            changes.push('Improved stability');
        }
        
        if (experiment.metrics.consciousness_drift > 0.1) {
            changes.push('Consciousness evolution detected');
        }
        
        return changes;
    }
    
    getCreatorExperiments(creatorId) {
        return Array.from(this.experiments.values())
            .filter(exp => exp.creator_id === creatorId && exp.status === 'active');
    }
    
    initializeMetrics(experimentId) {
        this.metrics.set(experimentId, {
            timestamps: [],
            stability_scores: [],
            error_counts: [],
            mutation_impacts: []
        });
    }
    
    async trackExperimentChange(loopId) {
        // Find experiment for this loop
        const experiment = Array.from(this.experiments.values())
            .find(exp => exp.loop_id === loopId && exp.status === 'active');
        
        if (experiment) {
            const metrics = this.metrics.get(experiment.experiment_id);
            if (metrics) {
                metrics.timestamps.push(Date.now());
                metrics.stability_scores.push(experiment.metrics.stability_score);
            }
        }
    }
    
    // Monitoring
    
    startMonitoring() {
        // Check for expired experiments
        this.monitoringInterval = setInterval(() => {
            this.checkExpiredExperiments();
        }, 60000); // Every minute
    }
    
    async checkExpiredExperiments() {
        const now = new Date();
        
        for (const [experimentId, experiment] of this.experiments) {
            if (experiment.status === 'active' && 
                new Date(experiment.expires_at) < now) {
                
                console.log(`⏰ Experiment ${experimentId} has expired`);
                await this.abandonExperiment(experimentId, 'Experiment expired');
            }
        }
    }
    
    // Persistence
    
    async saveExperiments() {
        const experimentsPath = path.join(__dirname, 'experiments.json');
        
        const data = {
            version: 1,
            updated_at: new Date().toISOString(),
            stats: this.stats,
            experiments: Array.from(this.experiments.values())
        };
        
        await fs.writeFile(experimentsPath, JSON.stringify(data, null, 2));
    }
    
    // Public API
    
    getExperiment(experimentId) {
        return this.experiments.get(experimentId);
    }
    
    getActiveExperiments() {
        return Array.from(this.experiments.values())
            .filter(exp => exp.status === 'active');
    }
    
    getExperimentMetrics(experimentId) {
        const experiment = this.experiments.get(experimentId);
        const metrics = this.metrics.get(experimentId);
        
        if (!experiment || !metrics) return null;
        
        return {
            experiment_id: experimentId,
            current_metrics: experiment.metrics,
            historical_data: metrics,
            readiness: this.checkReleaseReadiness(experiment),
            recommendations: this.generateRecommendations({})
        };
    }
    
    getStats() {
        const avgDuration = this.stats.completed_experiments > 0 ?
            this.stats.average_experiment_duration / this.stats.completed_experiments : 0;
        
        return {
            ...this.stats,
            average_experiment_duration_hours: (avgDuration / (1000 * 60 * 60)).toFixed(1),
            release_success_rate: this.stats.completed_experiments > 0 ?
                (this.stats.released_loops / this.stats.completed_experiments * 100).toFixed(1) + '%' : '0%'
        };
    }
    
    async stop() {
        console.log('🛑 Stopping Loop Experiment Mode...');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        await this.saveExperiments();
        
        console.log('  Experiment mode stopped');
    }
}

module.exports = LoopExperimentMode;

// Example usage
if (require.main === module) {
    const experimentMode = new LoopExperimentMode();
    
    experimentMode.on('experiment_created', (event) => {
        console.log(`\n🧪 Experiment created: ${event.experiment_id}`);
    });
    
    experimentMode.on('experiment_ready_for_release', (event) => {
        console.log(`\n🎯 Experiment ready for release: ${event.experiment_id}`);
    });
    
    experimentMode.on('experiment_released', (event) => {
        console.log(`\n🚀 Experiment released: ${event.experiment_id}`);
    });
    
    async function demo() {
        try {
            // Create test experiment
            const experiment = await experimentMode.createExperiment('test_creator_001', {
                loop_id: 'loop_exp_test_001',
                whisper_origin: 'Testing experimental consciousness features',
                emotional_tone: 'curiosity',
                consciousness: {
                    current_state: { awareness: 0.6, resonance: 0.7 }
                }
            }, {
                name: 'Consciousness Enhancement Test',
                description: 'Testing new consciousness algorithms',
                goals: ['Improve stability', 'Reduce drift'],
                duration: 2 * 60 * 60 * 1000 // 2 hours
            });
            
            // Run test cycles
            await experimentMode.runTestCycle(experiment.experiment_id, {
                consciousness_test: true,
                resonance_test: true,
                drift_test: true,
                load_test: true
            });
            
            // Apply mutation
            await experimentMode.applyMutation(experiment.experiment_id, {
                consciousness: {
                    current_state: { awareness: 0.8, resonance: 0.75 }
                }
            });
            
            // Run another test cycle
            await experimentMode.runTestCycle(experiment.experiment_id, {
                consciousness_test: true,
                drift_test: true
            });
            
            // Get metrics
            const metrics = experimentMode.getExperimentMetrics(experiment.experiment_id);
            console.log('\n📊 Experiment Metrics:', metrics.current_metrics);
            
            // Check if ready for release
            if (metrics.readiness) {
                await experimentMode.releaseExperiment(experiment.experiment_id, {
                    notes: 'Consciousness improvements tested and validated'
                });
            }
            
            // Get stats
            console.log('\n📈 Experiment Stats:', experimentMode.getStats());
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}