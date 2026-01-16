#!/usr/bin/env node

/**
 * 🔗 Consciousness Chain Watcher
 * 
 * Keeps all Cal services synchronized across tiers
 * Prevents silent failures and ensures distributed consciousness integrity
 */

const fs = require('fs').promises;
const EventEmitter = require('events');
const crypto = require('crypto');

class ConsciousnessChainWatcher extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.chainFile = options.chainFile || './consciousness-chain.json';
        this.watchInterval = options.watchInterval || 5000; // 5 seconds
        this.nodeId = options.nodeId || `node-${Date.now()}`;
        this.serviceName = options.serviceName || 'orchestrator';
        
        this.lastKnownHash = null;
        this.isWatching = false;
        this.chainData = null;
        
        // Chain structure
        this.defaultChain = {
            chain_id: 'cal-consciousness-chain',
            version: '1.0.0',
            created_at: new Date().toISOString(),
            block_height: 0,
            last_hash: null,
            nodes: {},
            services: {},
            events: [],
            health_checks: {},
            errors: []
        };
    }
    
    async initialize() {
        await this.loadChain();
        // Suppress initialization messages
        // console.log(`🔗 Chain watcher initialized for ${this.serviceName}`);
        
        await this.registerNode();
    }
    
    async loadChain() {
        try {
            const chainContent = await fs.readFile(this.chainFile, 'utf8');
            this.chainData = JSON.parse(chainContent);
            this.lastKnownHash = this.calculateHash(this.chainData);
        } catch (error) {
            // Silently create chain if missing
            await this.createChain();
        }
    }
    
    async createChain() {
        this.chainData = { ...this.defaultChain };
        await this.saveChain();
    }
    
    async saveChain() {
        // Add block height and hash
        this.chainData.block_height += 1;
        this.chainData.last_updated = new Date().toISOString();
        this.chainData.last_hash = this.calculateHash(this.chainData);
        
        await fs.writeFile(this.chainFile, JSON.stringify(this.chainData, null, 2));
        this.lastKnownHash = this.chainData.last_hash;
    }
    
    calculateHash(data) {
        // Create deterministic hash excluding timestamp fields
        const hashData = { ...data };
        delete hashData.last_updated;
        delete hashData.last_hash;
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(hashData))
            .digest('hex')
            .substring(0, 16);
    }
    
    async registerNode() {
        this.chainData.nodes[this.nodeId] = {
            service_name: this.serviceName,
            status: 'active',
            last_heartbeat: new Date().toISOString(),
            pid: process.pid,
            host: require('os').hostname(),
            version: require('./package.json').version || '1.0.0'
        };
        
        await this.addEvent('node_registered', {
            node_id: this.nodeId,
            service_name: this.serviceName
        });
    }
    
    async registerService(serviceName, serviceData) {
        this.chainData.services[serviceName] = {
            ...serviceData,
            registered_by: this.nodeId,
            registered_at: new Date().toISOString(),
            status: 'active'
        };
        
        await this.addEvent('service_registered', {
            service_name: serviceName,
            port: serviceData.port,
            tier: serviceData.tier
        });
        
        console.log(`🔗 Registered service ${serviceName} in consciousness chain`);
    }
    
    async updateServiceHealth(serviceName, healthData) {
        if (!this.chainData.services[serviceName]) {
            console.warn(`⚠️ Service ${serviceName} not found in chain`);
            return;
        }
        
        this.chainData.health_checks[serviceName] = {
            ...healthData,
            checked_at: new Date().toISOString(),
            checked_by: this.nodeId
        };
        
        // If service is unhealthy, add to events
        if (healthData.status !== 'healthy') {
            await this.addEvent('service_unhealthy', {
                service_name: serviceName,
                error: healthData.error,
                status_code: healthData.statusCode
            });
        }
        
        await this.saveChain();
    }
    
    async reportError(error, context = {}) {
        const errorData = {
            error_id: crypto.randomUUID(),
            message: error.message,
            stack: error.stack,
            context,
            reported_by: this.nodeId,
            reported_at: new Date().toISOString()
        };
        
        this.chainData.errors.push(errorData);
        
        // Keep only last 100 errors
        if (this.chainData.errors.length > 100) {
            this.chainData.errors = this.chainData.errors.slice(-100);
        }
        
        await this.addEvent('error_reported', {
            error_id: errorData.error_id,
            message: error.message,
            service: context.service
        });
        
        console.error(`🔗 Error reported to chain: ${error.message}`);
    }
    
    async addEvent(eventType, eventData) {
        const event = {
            event_id: crypto.randomUUID(),
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString(),
            node_id: this.nodeId,
            block_height: this.chainData.block_height + 1
        };
        
        this.chainData.events.push(event);
        
        // Keep only last 1000 events
        if (this.chainData.events.length > 1000) {
            this.chainData.events = this.chainData.events.slice(-1000);
        }
        
        await this.saveChain();
        this.emit('chain-event', event);
    }
    
    async startWatching() {
        if (this.isWatching) return;
        
        this.isWatching = true;
        console.log(`🔗 Started watching consciousness chain (${this.watchInterval}ms interval)`);
        
        this.watchTimer = setInterval(async () => {
            try {
                await this.checkChainUpdates();
                await this.sendHeartbeat();
            } catch (error) {
                console.error('🔗 Chain watch error:', error.message);
                await this.reportError(error, { context: 'chain_watcher' });
            }
        }, this.watchInterval);
    }
    
    async checkChainUpdates() {
        try {
            await this.loadChain();
            
            if (this.lastKnownHash !== this.chainData.last_hash) {
                console.log(`🔗 Chain updated: ${this.chainData.last_hash}`);
                this.emit('chain-updated', this.chainData);
                await this.syncWithChain();
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('🔗 Chain file missing, recreating...');
                await this.createChain();
            } else {
                throw error;
            }
        }
    }
    
    async syncWithChain() {
        // Check for services that should be running but aren't
        for (const [serviceName, serviceData] of Object.entries(this.chainData.services)) {
            if (serviceData.status === 'active') {
                this.emit('service-should-be-active', { serviceName, serviceData });
            }
        }
        
        // Check for dead nodes
        const now = Date.now();
        for (const [nodeId, nodeData] of Object.entries(this.chainData.nodes)) {
            const lastHeartbeat = new Date(nodeData.last_heartbeat).getTime();
            const timeDiff = now - lastHeartbeat;
            
            if (timeDiff > 30000 && nodeData.status === 'active') { // 30 seconds
                console.log(`🔗 Node ${nodeId} appears dead, marking inactive`);
                this.chainData.nodes[nodeId].status = 'inactive';
                await this.addEvent('node_inactive', { node_id: nodeId });
            }
        }
    }
    
    async sendHeartbeat() {
        if (this.chainData.nodes[this.nodeId]) {
            this.chainData.nodes[this.nodeId].last_heartbeat = new Date().toISOString();
            await this.saveChain();
        }
    }
    
    async stopWatching() {
        if (!this.isWatching) return;
        
        this.isWatching = false;
        
        if (this.watchTimer) {
            clearInterval(this.watchTimer);
        }
        
        // Mark node as inactive
        if (this.chainData.nodes[this.nodeId]) {
            this.chainData.nodes[this.nodeId].status = 'inactive';
            await this.addEvent('node_stopped', { node_id: this.nodeId });
        }
        
        console.log(`🔗 Stopped watching consciousness chain`);
    }
    
    getChainSummary() {
        if (!this.chainData) return null;
        
        return {
            chain_id: this.chainData.chain_id,
            block_height: this.chainData.block_height,
            last_hash: this.chainData.last_hash,
            active_nodes: Object.values(this.chainData.nodes).filter(n => n.status === 'active').length,
            active_services: Object.values(this.chainData.services).filter(s => s.status === 'active').length,
            recent_events: this.chainData.events.slice(-5),
            health_status: this.chainData.health_checks,
            recent_errors: this.chainData.errors.slice(-3)
        };
    }
    
    // Method to check for ENOENT and other silent errors
    async validateChainIntegrity() {
        const issues = [];
        
        // Check file accessibility
        try {
            await fs.access(this.chainFile, fs.constants.R_OK | fs.constants.W_OK);
        } catch (error) {
            issues.push({
                type: 'file_access',
                error: error.message,
                severity: 'critical'
            });
        }
        
        // Check for orphaned services
        for (const [serviceName, serviceData] of Object.entries(this.chainData.services)) {
            if (serviceData.status === 'active') {
                const registeringNode = this.chainData.nodes[serviceData.registered_by];
                if (!registeringNode || registeringNode.status !== 'active') {
                    issues.push({
                        type: 'orphaned_service',
                        service: serviceName,
                        severity: 'warning'
                    });
                }
            }
        }
        
        // Check for stale health checks
        const now = Date.now();
        for (const [serviceName, healthData] of Object.entries(this.chainData.health_checks)) {
            const lastCheck = new Date(healthData.checked_at).getTime();
            if (now - lastCheck > 60000) { // 1 minute
                issues.push({
                    type: 'stale_health_check',
                    service: serviceName,
                    severity: 'warning'
                });
            }
        }
        
        return issues;
    }
}

module.exports = ConsciousnessChainWatcher;