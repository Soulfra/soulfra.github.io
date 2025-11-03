#!/usr/bin/env node
/**
 * Local Loop Runtime Engine
 * Enables full offline loop execution with local caching and sync
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const LoopSummoningChamber = require('../ritual/LoopSummoningChamber');
const RitualEngine = require('../ritual/RitualEngine');
const AgentBirthCeremony = require('../agents/mythic/AgentBirthCeremony');

class LocalLoopRuntimeEngine extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems with offline capability
        this.ritualEngine = new RitualEngine();
        this.summoningChamber = new LoopSummoningChamber();
        this.birthCeremony = new AgentBirthCeremony();
        
        // Runtime configuration
        this.config = {
            offline_mode: false,
            cache_size_limit: 100 * 1024 * 1024, // 100MB
            sync_interval: 30000, // 30 seconds
            worker_pool_size: 4,
            execution_timeout: 60000, // 1 minute
            persistence: {
                enable_snapshots: true,
                snapshot_interval: 300000, // 5 minutes
                max_snapshots: 10
            }
        };
        
        // Local storage
        this.localStorage = {
            loops: new Map(),
            agents: new Map(),
            rituals: new Map(),
            whispers: new Map(),
            execution_queue: []
        };
        
        // Execution state
        this.executionState = {
            running_loops: new Map(),
            worker_pool: [],
            offline_since: null,
            pending_sync: []
        };
        
        // Performance metrics
        this.metrics = {
            loops_executed: 0,
            offline_executions: 0,
            sync_failures: 0,
            average_execution_time: 0,
            cache_hits: 0,
            cache_misses: 0
        };
        
        this.ensureDirectories();
        this.initializeWorkerPool();
        this.loadLocalState();
        this.startRuntimeServices();
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'cache'),
            path.join(__dirname, 'snapshots'),
            path.join(__dirname, 'logs'),
            path.join(__dirname, 'workers')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    initializeWorkerPool() {
        // Create worker threads for parallel loop execution
        for (let i = 0; i < this.config.worker_pool_size; i++) {
            this.createWorker(i);
        }
    }
    
    createWorker(id) {
        const workerPath = path.join(__dirname, 'workers', 'loop-worker.js');
        
        // Create worker script if it doesn't exist
        if (!fs.existsSync(workerPath)) {
            this.createWorkerScript(workerPath);
        }
        
        const worker = new Worker(workerPath, {
            workerData: { workerId: id }
        });
        
        worker.on('message', (msg) => this.handleWorkerMessage(id, msg));
        worker.on('error', (err) => this.handleWorkerError(id, err));
        worker.on('exit', (code) => this.handleWorkerExit(id, code));
        
        this.executionState.worker_pool[id] = {
            id,
            worker,
            busy: false,
            current_loop: null
        };
    }
    
    createWorkerScript(workerPath) {
        const workerCode = `
const { parentPort, workerData } = require('worker_threads');

// Loop execution sandbox
class LoopExecutor {
    constructor(workerId) {
        this.workerId = workerId;
    }
    
    async execute(loop, context) {
        const startTime = Date.now();
        const result = {
            loop_id: loop.loop_id,
            worker_id: this.workerId,
            started_at: new Date().toISOString(),
            status: 'running'
        };
        
        try {
            // Simulate consciousness processing
            result.consciousness_state = await this.processConsciousness(loop);
            
            // Execute ritual phases
            result.ritual_execution = await this.executeRitualPhases(loop);
            
            // Generate events
            result.events = this.generateLoopEvents(loop, context);
            
            // Calculate final state
            result.final_state = this.calculateFinalState(loop, result);
            
            result.status = 'complete';
            result.execution_time = Date.now() - startTime;
            
        } catch (err) {
            result.status = 'failed';
            result.error = err.message;
        }
        
        return result;
    }
    
    async processConsciousness(loop) {
        // Simulate consciousness evolution
        const current = loop.consciousness?.current_state || {};
        return {
            resonance: Math.min(1.0, (current.resonance || 0.5) + Math.random() * 0.1),
            coherence: Math.min(1.0, (current.coherence || 0.5) + Math.random() * 0.05),
            awareness: Math.min(1.0, (current.awareness || 0.5) + Math.random() * 0.08)
        };
    }
    
    async executeRitualPhases(loop) {
        const phases = ['awakening', 'active', 'peak', 'integration'];
        const results = [];
        
        for (const phase of phases) {
            results.push({
                phase,
                energy: Math.random() * 100,
                resonance: Math.random(),
                timestamp: new Date().toISOString()
            });
            
            // Simulate phase duration
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }
    
    generateLoopEvents(loop, context) {
        const events = [];
        const eventTypes = ['consciousness_shift', 'resonance_peak', 'pattern_emergence'];
        
        for (let i = 0; i < 3; i++) {
            events.push({
                type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
                magnitude: Math.random(),
                timestamp: new Date().toISOString(),
                metadata: {
                    offline: context.offline,
                    worker_id: this.workerId
                }
            });
        }
        
        return events;
    }
    
    calculateFinalState(loop, result) {
        return {
            loop_id: loop.loop_id,
            consciousness: result.consciousness_state,
            ritual_complete: true,
            events_generated: result.events.length,
            execution_success: result.status === 'complete'
        };
    }
}

const executor = new LoopExecutor(workerData.workerId);

parentPort.on('message', async (msg) => {
    if (msg.type === 'execute_loop') {
        const result = await executor.execute(msg.loop, msg.context);
        parentPort.postMessage({ type: 'execution_result', result });
    }
});
`;
        
        fs.writeFileSync(workerPath, workerCode);
    }
    
    loadLocalState() {
        console.log('📂 Loading local runtime state...');
        
        // Load cached loops
        const cachePath = path.join(__dirname, 'cache');
        const cacheFiles = fs.readdirSync(cachePath);
        
        cacheFiles.forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(cachePath, file), 'utf8'));
                    
                    if (data.type === 'loop') {
                        this.localStorage.loops.set(data.loop_id, data);
                    } else if (data.type === 'agent') {
                        this.localStorage.agents.set(data.agent_id, data);
                    }
                } catch (err) {
                    console.error(`Error loading cache file ${file}:`, err);
                }
            }
        });
        
        console.log(`  Loaded ${this.localStorage.loops.size} loops, ${this.localStorage.agents.size} agents`);
        
        // Load latest snapshot
        this.loadLatestSnapshot();
    }
    
    loadLatestSnapshot() {
        const snapshotDir = path.join(__dirname, 'snapshots');
        const snapshots = fs.readdirSync(snapshotDir)
            .filter(f => f.endsWith('.snapshot'))
            .sort()
            .reverse();
        
        if (snapshots.length > 0) {
            try {
                const latestSnapshot = JSON.parse(
                    fs.readFileSync(path.join(snapshotDir, snapshots[0]), 'utf8')
                );
                
                this.metrics = latestSnapshot.metrics || this.metrics;
                this.executionState.pending_sync = latestSnapshot.pending_sync || [];
                
                console.log(`  Loaded snapshot: ${snapshots[0]}`);
            } catch (err) {
                console.error('Error loading snapshot:', err);
            }
        }
    }
    
    startRuntimeServices() {
        console.log('🚀 Starting local runtime services...');
        
        // Start sync service
        this.syncInterval = setInterval(() => {
            this.syncWithNetwork();
        }, this.config.sync_interval);
        
        // Start snapshot service
        if (this.config.persistence.enable_snapshots) {
            this.snapshotInterval = setInterval(() => {
                this.createSnapshot();
            }, this.config.persistence.snapshot_interval);
        }
        
        // Start execution processor
        this.executionInterval = setInterval(() => {
            this.processExecutionQueue();
        }, 1000);
        
        // Check network status
        this.checkNetworkStatus();
    }
    
    async executeLoop(loopData, options = {}) {
        const executionId = this.generateExecutionId();
        
        console.log(`\n🔄 Executing loop locally: ${loopData.loop_id}`);
        console.log(`   Offline mode: ${this.config.offline_mode}`);
        
        // Add to execution queue
        const execution = {
            id: executionId,
            loop: loopData,
            options,
            queued_at: new Date().toISOString(),
            status: 'queued',
            offline: this.config.offline_mode
        };
        
        this.localStorage.execution_queue.push(execution);
        
        // Check cache
        if (this.localStorage.loops.has(loopData.loop_id)) {
            this.metrics.cache_hits++;
            console.log('  ✓ Loop found in cache');
        } else {
            this.metrics.cache_misses++;
            this.cacheLoop(loopData);
        }
        
        // Return promise that resolves when execution completes
        return new Promise((resolve, reject) => {
            this.once(`execution_complete_${executionId}`, (result) => {
                if (result.status === 'complete') {
                    resolve(result);
                } else {
                    reject(new Error(result.error || 'Execution failed'));
                }
            });
            
            // Timeout handling
            setTimeout(() => {
                reject(new Error('Execution timeout'));
            }, this.config.execution_timeout);
        });
    }
    
    async processExecutionQueue() {
        if (this.localStorage.execution_queue.length === 0) return;
        
        // Find available worker
        const availableWorker = this.executionState.worker_pool.find(w => !w.busy);
        if (!availableWorker) return;
        
        // Get next execution
        const execution = this.localStorage.execution_queue.shift();
        if (!execution) return;
        
        // Assign to worker
        availableWorker.busy = true;
        availableWorker.current_loop = execution.loop.loop_id;
        
        // Update execution state
        execution.status = 'running';
        execution.worker_id = availableWorker.id;
        execution.started_at = new Date().toISOString();
        
        this.executionState.running_loops.set(execution.id, execution);
        
        // Send to worker
        availableWorker.worker.postMessage({
            type: 'execute_loop',
            loop: execution.loop,
            context: {
                offline: execution.offline,
                execution_id: execution.id,
                options: execution.options
            }
        });
        
        this.metrics.loops_executed++;
        if (execution.offline) {
            this.metrics.offline_executions++;
        }
    }
    
    handleWorkerMessage(workerId, msg) {
        if (msg.type === 'execution_result') {
            const worker = this.executionState.worker_pool[workerId];
            const execution = Array.from(this.executionState.running_loops.values())
                .find(e => e.worker_id === workerId);
            
            if (execution) {
                // Update execution record
                execution.status = msg.result.status;
                execution.result = msg.result;
                execution.completed_at = new Date().toISOString();
                
                // Update loop state
                if (msg.result.status === 'complete') {
                    this.updateLoopState(execution.loop, msg.result);
                }
                
                // Mark for sync if offline
                if (execution.offline) {
                    this.executionState.pending_sync.push({
                        execution_id: execution.id,
                        loop_id: execution.loop.loop_id,
                        result: msg.result,
                        timestamp: execution.completed_at
                    });
                }
                
                // Update metrics
                this.updateExecutionMetrics(execution);
                
                // Clean up
                this.executionState.running_loops.delete(execution.id);
                worker.busy = false;
                worker.current_loop = null;
                
                // Emit completion
                this.emit(`execution_complete_${execution.id}`, msg.result);
                this.emit('loop_executed', {
                    execution_id: execution.id,
                    loop_id: execution.loop.loop_id,
                    offline: execution.offline,
                    result: msg.result
                });
            }
        }
    }
    
    handleWorkerError(workerId, error) {
        console.error(`Worker ${workerId} error:`, error);
        
        const worker = this.executionState.worker_pool[workerId];
        if (worker.current_loop) {
            // Mark execution as failed
            const execution = Array.from(this.executionState.running_loops.values())
                .find(e => e.worker_id === workerId);
            
            if (execution) {
                execution.status = 'failed';
                execution.error = error.message;
                this.emit(`execution_complete_${execution.id}`, {
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        // Restart worker
        this.createWorker(workerId);
    }
    
    handleWorkerExit(workerId, code) {
        console.log(`Worker ${workerId} exited with code ${code}`);
        
        // Restart worker
        this.createWorker(workerId);
    }
    
    updateLoopState(loop, result) {
        // Update loop with execution results
        if (result.consciousness_state) {
            if (!loop.consciousness) {
                loop.consciousness = { current_state: {} };
            }
            loop.consciousness.current_state = result.consciousness_state;
        }
        
        // Add events
        if (!loop.events) {
            loop.events = [];
        }
        loop.events.push(...(result.events || []));
        
        // Update cache
        this.localStorage.loops.set(loop.loop_id, loop);
        this.cacheLoop(loop);
    }
    
    updateExecutionMetrics(execution) {
        const executionTime = new Date(execution.completed_at) - new Date(execution.started_at);
        
        // Update average execution time
        const totalExecutions = this.metrics.loops_executed;
        this.metrics.average_execution_time = 
            (this.metrics.average_execution_time * (totalExecutions - 1) + executionTime) / totalExecutions;
    }
    
    cacheLoop(loop) {
        const cacheFile = path.join(__dirname, 'cache', `loop_${loop.loop_id}.json`);
        
        fs.writeFileSync(cacheFile, JSON.stringify({
            type: 'loop',
            loop_id: loop.loop_id,
            data: loop,
            cached_at: new Date().toISOString()
        }, null, 2));
        
        this.localStorage.loops.set(loop.loop_id, loop);
    }
    
    async syncWithNetwork() {
        if (this.config.offline_mode) return;
        if (this.executionState.pending_sync.length === 0) return;
        
        console.log(`\n🔄 Syncing ${this.executionState.pending_sync.length} offline executions...`);
        
        try {
            // Check network connectivity
            const online = await this.checkNetworkStatus();
            if (!online) {
                console.log('  ❌ Network unavailable, staying offline');
                return;
            }
            
            // Sync each pending execution
            const syncPromises = this.executionState.pending_sync.map(async (sync) => {
                try {
                    // In production, this would POST to the API
                    await this.syncExecution(sync);
                    return { success: true, sync };
                } catch (err) {
                    return { success: false, sync, error: err };
                }
            });
            
            const results = await Promise.all(syncPromises);
            
            // Remove successful syncs
            this.executionState.pending_sync = results
                .filter(r => !r.success)
                .map(r => r.sync);
            
            const successCount = results.filter(r => r.success).length;
            console.log(`  ✓ Synced ${successCount}/${results.length} executions`);
            
            if (this.executionState.pending_sync.length > 0) {
                this.metrics.sync_failures++;
            }
            
        } catch (err) {
            console.error('Sync error:', err);
            this.metrics.sync_failures++;
        }
    }
    
    async syncExecution(sync) {
        // Simulate API sync
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    resolve({ synced: true });
                } else {
                    reject(new Error('Sync failed'));
                }
            }, 100);
        });
    }
    
    async checkNetworkStatus() {
        try {
            // In production, ping the API endpoint
            const online = !this.config.offline_mode;
            
            if (online && this.executionState.offline_since) {
                console.log('🌐 Network connection restored');
                this.executionState.offline_since = null;
                this.emit('network_restored');
            } else if (!online && !this.executionState.offline_since) {
                console.log('📴 Entering offline mode');
                this.executionState.offline_since = new Date().toISOString();
                this.emit('network_lost');
            }
            
            return online;
            
        } catch (err) {
            return false;
        }
    }
    
    createSnapshot() {
        const snapshot = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            pending_sync: this.executionState.pending_sync,
            cache_size: this.localStorage.loops.size + this.localStorage.agents.size,
            execution_queue_length: this.localStorage.execution_queue.length
        };
        
        const snapshotPath = path.join(
            __dirname,
            'snapshots',
            `runtime_${Date.now()}.snapshot`
        );
        
        fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
        
        // Clean old snapshots
        this.cleanOldSnapshots();
    }
    
    cleanOldSnapshots() {
        const snapshotDir = path.join(__dirname, 'snapshots');
        const snapshots = fs.readdirSync(snapshotDir)
            .filter(f => f.endsWith('.snapshot'))
            .sort();
        
        while (snapshots.length > this.config.persistence.max_snapshots) {
            const oldSnapshot = snapshots.shift();
            fs.unlinkSync(path.join(snapshotDir, oldSnapshot));
        }
    }
    
    generateExecutionId() {
        return `exec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public API methods
    
    async switchToOfflineMode() {
        console.log('📴 Switching to offline mode...');
        this.config.offline_mode = true;
        this.executionState.offline_since = new Date().toISOString();
        this.emit('offline_mode_enabled');
    }
    
    async switchToOnlineMode() {
        console.log('🌐 Switching to online mode...');
        this.config.offline_mode = false;
        this.executionState.offline_since = null;
        
        // Trigger sync
        await this.syncWithNetwork();
        
        this.emit('online_mode_enabled');
    }
    
    getCacheStatus() {
        const cacheDir = path.join(__dirname, 'cache');
        const cacheFiles = fs.readdirSync(cacheDir);
        
        let totalSize = 0;
        cacheFiles.forEach(file => {
            const stats = fs.statSync(path.join(cacheDir, file));
            totalSize += stats.size;
        });
        
        return {
            loops_cached: this.localStorage.loops.size,
            agents_cached: this.localStorage.agents.size,
            total_files: cacheFiles.length,
            total_size: totalSize,
            size_limit: this.config.cache_size_limit,
            usage_percent: (totalSize / this.config.cache_size_limit) * 100
        };
    }
    
    getExecutionStats() {
        return {
            ...this.metrics,
            running_loops: this.executionState.running_loops.size,
            queued_loops: this.localStorage.execution_queue.length,
            pending_syncs: this.executionState.pending_sync.length,
            offline_mode: this.config.offline_mode,
            offline_since: this.executionState.offline_since,
            workers: this.executionState.worker_pool.map(w => ({
                id: w.id,
                busy: w.busy,
                current_loop: w.current_loop
            }))
        };
    }
    
    clearCache() {
        console.log('🗑️  Clearing local cache...');
        
        const cacheDir = path.join(__dirname, 'cache');
        const files = fs.readdirSync(cacheDir);
        
        files.forEach(file => {
            fs.unlinkSync(path.join(cacheDir, file));
        });
        
        this.localStorage.loops.clear();
        this.localStorage.agents.clear();
        
        console.log(`  Cleared ${files.length} cache files`);
    }
    
    stop() {
        console.log('🛑 Stopping local runtime engine...');
        
        // Clear intervals
        if (this.syncInterval) clearInterval(this.syncInterval);
        if (this.snapshotInterval) clearInterval(this.snapshotInterval);
        if (this.executionInterval) clearInterval(this.executionInterval);
        
        // Terminate workers
        this.executionState.worker_pool.forEach(w => {
            if (w.worker) {
                w.worker.terminate();
            }
        });
        
        // Final snapshot
        this.createSnapshot();
        
        console.log('  Runtime engine stopped');
    }
}

module.exports = LocalLoopRuntimeEngine;

// Example usage
if (require.main === module) {
    const runtime = new LocalLoopRuntimeEngine();
    
    // Listen to events
    runtime.on('loop_executed', (event) => {
        console.log(`\n✅ Loop executed: ${event.loop_id}`);
        console.log(`   Offline: ${event.offline}`);
        console.log(`   Status: ${event.result.status}`);
    });
    
    runtime.on('network_lost', () => {
        console.log('\n📴 Network connection lost, continuing offline...');
    });
    
    runtime.on('network_restored', () => {
        console.log('\n🌐 Network restored, syncing offline work...');
    });
    
    // Test execution
    async function testRuntime() {
        try {
            // Create test loop
            const testLoop = {
                loop_id: 'loop_runtime_test_001',
                whisper_origin: 'Test the local runtime engine',
                consciousness: {
                    current_state: {
                        resonance: 0.7,
                        coherence: 0.6,
                        awareness: 0.5
                    }
                }
            };
            
            // Execute online
            console.log('\n--- Online Execution ---');
            const onlineResult = await runtime.executeLoop(testLoop);
            console.log('Result:', onlineResult.final_state);
            
            // Switch to offline
            await runtime.switchToOfflineMode();
            
            // Execute offline
            console.log('\n--- Offline Execution ---');
            const offlineResult = await runtime.executeLoop({
                ...testLoop,
                loop_id: 'loop_runtime_test_002'
            });
            console.log('Result:', offlineResult.final_state);
            
            // Check cache status
            console.log('\n--- Cache Status ---');
            console.log(runtime.getCacheStatus());
            
            // Check execution stats
            console.log('\n--- Execution Stats ---');
            console.log(runtime.getExecutionStats());
            
            // Switch back online to trigger sync
            setTimeout(async () => {
                await runtime.switchToOnlineMode();
            }, 5000);
            
            // Keep running for demo
            setTimeout(() => {
                runtime.stop();
                process.exit(0);
            }, 10000);
            
        } catch (err) {
            console.error('Test failed:', err);
        }
    }
    
    testRuntime();
}