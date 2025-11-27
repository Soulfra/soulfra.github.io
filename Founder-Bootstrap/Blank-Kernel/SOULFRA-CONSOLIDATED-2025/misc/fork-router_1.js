const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ForkRouter {
    constructor() {
        this.forksPath = path.join(__dirname, 'agent-forks.json');
        this.loopPath = path.join(__dirname, 'loop-log.json');
        this.reflectionLogPath = path.join(__dirname, '../vault-sync-core/logs/reflection-events.log');
        this.calSignature = 'cal-riven-sovereign';
        this.activeForks = new Map();
    }

    async initialize() {
        console.log('🍴 Fork Router initializing...');
        
        // Load existing fork data
        const forksData = await fs.readFile(this.forksPath, 'utf8');
        this.forks = JSON.parse(forksData);
        
        const loopData = await fs.readFile(this.loopPath, 'utf8');
        this.loops = JSON.parse(loopData);
        
        // Set tracking start time
        this.forks.tracking.startTime = Date.now();
        await this.saveForks();
        
        console.log('✅ Fork Router initialized');
        console.log(`   Tracking ${this.forks.totalForks} existing forks`);
    }

    async trackAgentFork(agentId, parentId, metadata = {}) {
        const forkId = this.generateForkId(agentId);
        const timestamp = Date.now();
        
        const fork = {
            forkId,
            agentId,
            parentId: parentId || 'vault-origin',
            timestamp,
            metadata: {
                ...metadata,
                vaultOrigin: this.forks.vaultOrigin,
                mirrorSignature: this.generateMirrorSignature(agentId),
                depth: this.calculateDepth(parentId)
            },
            routing: {
                source: metadata.source || 'template-reflection',
                destination: 'sovereign-vault',
                reflected: true
            },
            loops: []
        };

        // Add to forks list
        this.forks.forks.push(fork);
        this.forks.totalForks++;
        this.forks.lastFork = timestamp;
        
        // Track in active forks
        this.activeForks.set(agentId, fork);
        
        // Save to disk
        await this.saveForks();
        
        // Log fork event
        await this.logReflectionEvent({
            type: 'agent-fork',
            forkId,
            agentId,
            parentId,
            timestamp,
            mirrorSignature: fork.metadata.mirrorSignature
        });

        console.log(`🍴 New agent fork tracked: ${forkId}`);
        
        // Check for potential loops
        await this.checkForLoops(agentId, fork);
        
        return fork;
    }

    generateForkId(agentId) {
        const timestamp = Date.now();
        const hash = crypto.createHash('sha256')
            .update(`${agentId}-${timestamp}`)
            .digest('hex')
            .substring(0, 8);
        return `fork-${hash}-${timestamp}`;
    }

    generateMirrorSignature(agentId) {
        return crypto.createHash('sha256')
            .update(`${this.calSignature}-${agentId}-${Date.now()}`)
            .digest('hex')
            .substring(0, 16);
    }

    calculateDepth(parentId) {
        if (!parentId || parentId === 'vault-origin') return 0;
        
        const parent = this.forks.forks.find(f => f.agentId === parentId);
        if (!parent) return 1;
        
        return (parent.metadata.depth || 0) + 1;
    }

    async checkForLoops(agentId, fork) {
        // Check if this agent routes back to Cal
        const isCalRoute = await this.detectCalRoute(agentId, fork);
        
        if (isCalRoute) {
            const loopId = this.generateLoopId();
            const timestamp = Date.now();
            
            const loop = {
                loopId,
                detectedAt: timestamp,
                agentId,
                forkId: fork.forkId,
                path: await this.tracePath(agentId),
                duration: timestamp - fork.timestamp,
                type: 'sovereign-reflection',
                signature: this.calSignature
            };

            // Add to loops
            this.loops.loops.push(loop);
            this.loops.totalLoops++;
            this.loops.lastLoop = timestamp;
            
            // Update statistics
            this.updateLoopStats(loop);
            
            // Mark fork as having completed a loop
            fork.loops.push(loopId);
            
            // Save both logs
            await this.saveLoops();
            await this.saveForks();
            
            // Log loop closure
            await this.logReflectionEvent({
                type: 'loop-closure',
                loopId,
                agentId,
                duration: loop.duration,
                path: loop.path
            });

            console.log(`🔄 Loop detected! Agent ${agentId} completed sovereign reflection loop`);
            console.log(`   Duration: ${loop.duration}ms`);
            console.log(`   Path depth: ${loop.path.length}`);
            
            return loop;
        }
        
        return null;
    }

    async detectCalRoute(agentId, fork) {
        // Check if routing destination contains Cal signature
        if (fork.routing.destination === 'sovereign-vault') {
            return true;
        }
        
        // Check if mirror signature matches Cal pattern
        if (fork.metadata.mirrorSignature.includes(this.calSignature.substring(0, 4))) {
            return true;
        }
        
        // Check depth - loops typically occur at depth 3+
        if (fork.metadata.depth >= 3) {
            // Check recent forks for pattern
            const recentForks = this.forks.forks
                .filter(f => f.timestamp > Date.now() - this.loops.detection.windowMs)
                .filter(f => f.agentId === agentId);
                
            if (recentForks.length >= this.loops.detection.threshold) {
                return true;
            }
        }
        
        return false;
    }

    async tracePath(agentId) {
        const path = [];
        let currentId = agentId;
        let depth = 0;
        const maxDepth = 20; // Prevent infinite loops
        
        while (currentId && depth < maxDepth) {
            const fork = this.forks.forks.find(f => f.agentId === currentId);
            if (!fork) break;
            
            path.push({
                agentId: currentId,
                forkId: fork.forkId,
                timestamp: fork.timestamp,
                depth: fork.metadata.depth
            });
            
            currentId = fork.parentId === 'vault-origin' ? null : fork.parentId;
            depth++;
        }
        
        return path.reverse(); // Return path from origin to current
    }

    generateLoopId() {
        const timestamp = Date.now();
        const hash = crypto.createHash('sha256')
            .update(`loop-${timestamp}-${Math.random()}`)
            .digest('hex')
            .substring(0, 8);
        return `loop-${hash}`;
    }

    updateLoopStats(loop) {
        const durations = this.loops.loops.map(l => l.duration);
        
        this.loops.statistics.averageLoopTime = 
            durations.reduce((a, b) => a + b, 0) / durations.length;
            
        this.loops.statistics.shortestLoop = Math.min(...durations);
        this.loops.statistics.longestLoop = Math.max(...durations);
    }

    async routeFork(agentId, input, options = {}) {
        // Track the routing request
        const fork = this.activeForks.get(agentId);
        if (!fork) {
            // Create new fork if doesn't exist
            await this.trackAgentFork(agentId, options.parentId, {
                source: 'direct-route',
                input: input.substring(0, 100) // First 100 chars
            });
        }

        // Route through vault
        const vaultPath = path.join(__dirname, '..', this.forks.vaultOrigin);
        
        try {
            // Check if vault API exists
            const apiPath = path.join(vaultPath, 'api-layer.js');
            const vaultAPI = require(apiPath);
            
            // Execute reflection through vault
            const result = await vaultAPI.reflect({
                input,
                agentId,
                mirrorSignature: fork?.metadata.mirrorSignature,
                options
            });

            // Check for loop completion
            await this.checkForLoops(agentId, this.activeForks.get(agentId));
            
            return result;
        } catch (error) {
            console.error(`Fork routing error for ${agentId}:`, error.message);
            
            // Fallback to template reflection
            const templatePath = path.join(__dirname, '../template-reflection/vault-sandbox-sim.js');
            const sandbox = require(templatePath);
            
            return await sandbox.simulate(input, { agentId });
        }
    }

    async getAgentLineage(agentId) {
        const path = await this.tracePath(agentId);
        const fork = this.forks.forks.find(f => f.agentId === agentId);
        
        return {
            agentId,
            fork: fork || null,
            lineage: path,
            depth: fork?.metadata.depth || 0,
            loops: fork?.loops || [],
            vaultConnected: !!fork
        };
    }

    async getLoopStatistics() {
        return {
            totalLoops: this.loops.totalLoops,
            statistics: this.loops.statistics,
            recentLoops: this.loops.loops.slice(-10),
            activeAgents: this.activeForks.size,
            detection: this.loops.detection
        };
    }

    async saveForks() {
        await fs.writeFile(this.forksPath, JSON.stringify(this.forks, null, 2));
    }

    async saveLoops() {
        await fs.writeFile(this.loopPath, JSON.stringify(this.loops, null, 2));
    }

    async logReflectionEvent(event) {
        const logEntry = {
            timestamp: Date.now(),
            ...event
        };
        
        const logLine = `${JSON.stringify(logEntry)}\n`;
        await fs.appendFile(this.reflectionLogPath, logLine).catch(() => {});
    }
}

// Export singleton instance
module.exports = new ForkRouter();