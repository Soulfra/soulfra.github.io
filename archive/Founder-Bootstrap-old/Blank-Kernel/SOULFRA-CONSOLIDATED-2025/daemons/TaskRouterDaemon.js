#!/usr/bin/env node
/**
 * Task Router Daemon
 * Watches for tasks and processes them asynchronously
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class TaskRouterDaemon extends EventEmitter {
    constructor() {
        super();
        this.tasksDir = './tasks';
        this.queueDir = path.join(this.tasksDir, 'queue');
        this.workingDir = path.join(this.tasksDir, 'working');
        this.resolvedDir = path.join(this.tasksDir, 'resolved');
        this.ledgerPath = './ledger/task_record.json';
        
        this.isRunning = false;
        this.currentTasks = new Map();
        
        this.ensureDirectories();
        this.loadLedger();
    }
    
    ensureDirectories() {
        [this.queueDir, this.workingDir, this.resolvedDir, './ledger'].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadLedger() {
        if (fs.existsSync(this.ledgerPath)) {
            this.ledger = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
        } else {
            this.ledger = { tasks: [], stats: { total: 0, completed: 0, failed: 0 } };
            this.saveLedger();
        }
    }
    
    saveLedger() {
        fs.writeFileSync(this.ledgerPath, JSON.stringify(this.ledger, null, 2));
    }
    
    /**
     * Start the daemon
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('TaskRouterDaemon started');
        console.log(`Watching: ${this.queueDir}`);
        
        // Watch for new tasks
        this.watcher = fs.watch(this.queueDir, (eventType, filename) => {
            if (eventType === 'rename' && filename && filename.endsWith('.json')) {
                this.processNewTask(filename);
            }
        });
        
        // Process any existing queued tasks
        this.processExistingQueue();
        
        // Periodic health check
        this.healthInterval = setInterval(() => {
            this.healthCheck();
        }, 30000); // Every 30 seconds
    }
    
    stop() {
        this.isRunning = false;
        if (this.watcher) this.watcher.close();
        if (this.healthInterval) clearInterval(this.healthInterval);
        console.log('TaskRouterDaemon stopped');
    }
    
    processExistingQueue() {
        const queuedTasks = fs.readdirSync(this.queueDir)
            .filter(f => f.endsWith('.json'))
            .sort(); // Process in order
            
        queuedTasks.forEach(taskFile => {
            this.processNewTask(taskFile);
        });
    }
    
    async processNewTask(filename) {
        const taskPath = path.join(this.queueDir, filename);
        
        // Check if file still exists (might have been processed)
        if (!fs.existsSync(taskPath)) return;
        
        try {
            const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
            console.log(`\nProcessing task: ${task.task_id}`);
            
            // Move to working directory
            const workingPath = path.join(this.workingDir, filename);
            fs.renameSync(taskPath, workingPath);
            
            // Update task status
            task.status = 'working';
            task.started_at = new Date().toISOString();
            fs.writeFileSync(workingPath, JSON.stringify(task, null, 2));
            
            // Track active task
            this.currentTasks.set(task.task_id, {
                task,
                workingPath,
                startTime: Date.now()
            });
            
            // Process based on task type
            const result = await this.executeTask(task);
            
            // Complete task
            this.completeTask(task, result, workingPath);
            
        } catch (error) {
            console.error(`Error processing task ${filename}:`, error);
            this.failTask(filename, error);
        }
    }
    
    async executeTask(task) {
        console.log(`Executing ${task.type} for ${task.task_id}`);
        
        switch (task.type) {
            case 'loop_prototype_simulation':
                return await this.simulateLoop(task);
                
            case 'agent_build':
                return await this.buildAgent(task);
                
            case 'reflection_process':
                return await this.processReflection(task);
                
            case 'tone_analysis':
                return await this.analyzeTone(task);
                
            default:
                return await this.genericProcess(task);
        }
    }
    
    async simulateLoop(task) {
        const { inputs } = task;
        const [agentInfo, toneInfo, seedInfo] = inputs;
        
        // Simulate loop processing
        const steps = [];
        const duration = task.estimated_runtime ? parseInt(task.estimated_runtime) : 30;
        
        for (let i = 0; i < 5; i++) {
            await this.delay(duration / 5 * 1000);
            steps.push({
                step: i + 1,
                timestamp: new Date().toISOString(),
                state: `Loop iteration ${i + 1}`,
                tone: toneInfo.split(':')[1],
                agent: agentInfo.split(':')[1]
            });
        }
        
        return {
            type: 'loop_simulation_complete',
            task_id: task.task_id,
            duration: `${duration}s`,
            iterations: 5,
            final_state: 'resonance_achieved',
            steps,
            reflection: {
                agent_feedback: `${agentInfo.split(':')[1]} achieved resonance`,
                tone_shift: `${toneInfo.split(':')[1]} → harmonious`,
                loop_quality: 0.87
            }
        };
    }
    
    async buildAgent(task) {
        console.log(`Building agent: ${task.inputs.agent_name}`);
        
        // Simulate agent construction
        await this.delay(10000); // 10 seconds
        
        return {
            type: 'agent_built',
            task_id: task.task_id,
            agent_id: `agent_${Date.now()}`,
            agent_name: task.inputs.agent_name,
            capabilities: task.inputs.capabilities || [],
            initialization: {
                memory_allocated: '256MB',
                reflection_depth: 3,
                tone_sensitivity: 0.8
            }
        };
    }
    
    async processReflection(task) {
        const reflectionSteps = [];
        
        // Simulate deep reflection
        for (let depth = 1; depth <= 3; depth++) {
            await this.delay(5000);
            reflectionSteps.push({
                depth,
                insight: `Layer ${depth} reflection complete`,
                resonance: Math.random() * 0.5 + 0.5
            });
        }
        
        return {
            type: 'reflection_complete',
            task_id: task.task_id,
            total_depth: 3,
            steps: reflectionSteps,
            synthesis: 'Multi-layer reflection achieved convergence'
        };
    }
    
    async analyzeTone(task) {
        await this.delay(3000);
        
        const tones = ['confident', 'tentative', 'curious', 'harmonious', 'dissonant'];
        const selectedTone = tones[Math.floor(Math.random() * tones.length)];
        
        return {
            type: 'tone_analysis_complete',
            task_id: task.task_id,
            primary_tone: selectedTone,
            confidence: Math.random() * 0.3 + 0.7,
            harmonics: {
                positive: Math.random(),
                negative: Math.random(),
                neutral: Math.random()
            }
        };
    }
    
    async genericProcess(task) {
        const processingTime = task.estimated_runtime ? 
            parseInt(task.estimated_runtime) * 1000 : 5000;
            
        await this.delay(processingTime);
        
        return {
            type: 'process_complete',
            task_id: task.task_id,
            status: 'success',
            processing_time: `${processingTime / 1000}s`
        };
    }
    
    completeTask(task, result, workingPath) {
        const filename = path.basename(workingPath);
        const resolvedPath = path.join(this.resolvedDir, filename);
        
        // Add completion metadata
        task.status = 'resolved';
        task.completed_at = new Date().toISOString();
        task.result = result;
        task.processing_time = Date.now() - this.currentTasks.get(task.task_id).startTime;
        
        // Save to resolved
        fs.writeFileSync(resolvedPath, JSON.stringify(task, null, 2));
        
        // Remove from working
        fs.unlinkSync(workingPath);
        
        // Update ledger
        this.ledger.tasks.push({
            task_id: task.task_id,
            type: task.type,
            requested_by: task.requested_by,
            started_at: task.started_at,
            completed_at: task.completed_at,
            processing_time: task.processing_time,
            status: 'completed'
        });
        
        this.ledger.stats.total++;
        this.ledger.stats.completed++;
        this.saveLedger();
        
        // Clean up tracking
        this.currentTasks.delete(task.task_id);
        
        console.log(`✓ Task completed: ${task.task_id} (${task.processing_time}ms)`);
        this.emit('task_complete', task);
    }
    
    failTask(filename, error) {
        const workingPath = path.join(this.workingDir, filename);
        if (!fs.existsSync(workingPath)) return;
        
        const task = JSON.parse(fs.readFileSync(workingPath, 'utf8'));
        task.status = 'failed';
        task.error = error.message;
        task.failed_at = new Date().toISOString();
        
        // Move to resolved with error
        const resolvedPath = path.join(this.resolvedDir, filename);
        fs.writeFileSync(resolvedPath, JSON.stringify(task, null, 2));
        fs.unlinkSync(workingPath);
        
        // Update ledger
        this.ledger.stats.failed++;
        this.saveLedger();
        
        this.emit('task_failed', task);
    }
    
    healthCheck() {
        const stats = {
            queued: fs.readdirSync(this.queueDir).filter(f => f.endsWith('.json')).length,
            working: this.currentTasks.size,
            resolved: fs.readdirSync(this.resolvedDir).filter(f => f.endsWith('.json')).length,
            ledger_total: this.ledger.stats.total
        };
        
        console.log(`Health: Q:${stats.queued} W:${stats.working} R:${stats.resolved}`);
        
        // Check for stuck tasks
        this.currentTasks.forEach((taskInfo, taskId) => {
            const runtime = Date.now() - taskInfo.startTime;
            if (runtime > 300000) { // 5 minutes
                console.warn(`Task ${taskId} running for ${runtime}ms`);
            }
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run as daemon
if (require.main === module) {
    const daemon = new TaskRouterDaemon();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\nShutdown requested...');
        daemon.stop();
        process.exit(0);
    });
    
    // Start daemon
    daemon.start();
    
    // Keep process alive
    process.stdin.resume();
}

module.exports = TaskRouterDaemon;