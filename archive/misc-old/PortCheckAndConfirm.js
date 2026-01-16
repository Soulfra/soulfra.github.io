#!/usr/bin/env node
/**
 * Port Check and Confirm
 * Ensures services are actually ready before exposing them
 */

const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');

class PortCheckAndConfirm {
    constructor() {
        this.statusFile = '../runtime_status.json';
        this.services = new Map();
        this.checkInterval = 500; // 500ms between checks
        this.maxRetries = 60; // 30 seconds max wait
        
        this.loadConfig();
    }
    
    loadConfig() {
        // Known Soulfra services from our analysis
        this.registerService('cal-riven', 4040, '/health', 'Cal Riven CLI');
        this.registerService('infinity-router', 9090, '/', 'Infinity Router');
        this.registerService('semantic-api', 3666, '/api/health', 'Semantic Graph API');
        this.registerService('consciousness-ledger', 8889, '/', 'Consciousness Ledger');
        this.registerService('chat-processor', 8080, '/', 'Chat Processor');
        this.registerService('task-daemon', 7778, '/api/status', 'Task Processing');
    }
    
    registerService(name, port, healthPath, description) {
        this.services.set(name, {
            port,
            healthPath,
            description,
            status: 'unknown',
            lastCheck: null,
            retries: 0
        });
    }
    
    async checkPort(port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(2000);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }
    
    async checkHealth(service) {
        const { port, healthPath } = service;
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port,
                path: healthPath,
                method: 'GET',
                timeout: 2000
            };
            
            const req = http.request(options, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }
    
    async verifyService(name) {
        const service = this.services.get(name);
        if (!service) return false;
        
        console.log(`Checking ${name} on port ${service.port}...`);
        
        // First check if port is open
        const portOpen = await this.checkPort(service.port);
        if (!portOpen) {
            service.status = 'port_closed';
            return false;
        }
        
        // Then check if service responds to health check
        const healthy = await this.checkHealth(service);
        service.status = healthy ? 'ready' : 'not_responding';
        service.lastCheck = new Date().toISOString();
        
        return healthy;
    }
    
    async waitForService(name, callback) {
        const service = this.services.get(name);
        if (!service) {
            callback(new Error(`Unknown service: ${name}`));
            return;
        }
        
        console.log(`Waiting for ${service.description} to be ready...`);
        
        const checkLoop = async () => {
            const ready = await this.verifyService(name);
            
            if (ready) {
                console.log(`✓ ${service.description} is ready!`);
                callback(null, service);
                return;
            }
            
            service.retries++;
            
            if (service.retries >= this.maxRetries) {
                console.error(`✗ ${service.description} failed to start after ${this.maxRetries} attempts`);
                callback(new Error(`Service ${name} failed to start`));
                return;
            }
            
            // Try again
            setTimeout(checkLoop, this.checkInterval);
        };
        
        checkLoop();
    }
    
    async verifyAll() {
        const results = {};
        
        for (const [name, service] of this.services) {
            const ready = await this.verifyService(name);
            results[name] = {
                ...service,
                ready
            };
        }
        
        this.updateStatus(results);
        return results;
    }
    
    updateStatus(results) {
        const status = {
            timestamp: new Date().toISOString(),
            services: results,
            summary: {
                total: this.services.size,
                ready: Object.values(results).filter(s => s.ready).length,
                failed: Object.values(results).filter(s => !s.ready).length
            }
        };
        
        fs.writeFileSync(
            path.join(__dirname, this.statusFile),
            JSON.stringify(status, null, 2)
        );
    }
    
    startMonitoring(interval = 5000) {
        console.log('Starting service monitoring...');
        
        // Initial check
        this.verifyAll().then(results => {
            console.log('\nInitial Status:');
            for (const [name, service] of Object.entries(results)) {
                const symbol = service.ready ? '✓' : '✗';
                console.log(`${symbol} ${service.description}: ${service.status}`);
            }
        });
        
        // Periodic checks
        setInterval(() => {
            this.verifyAll();
        }, interval);
    }
}

// Export for use by other modules
module.exports = PortCheckAndConfirm;

// Run if called directly
if (require.main === module) {
    const checker = new PortCheckAndConfirm();
    
    const args = process.argv.slice(2);
    
    if (args[0] === 'monitor') {
        checker.startMonitoring();
    } else if (args[0] === 'wait' && args[1]) {
        checker.waitForService(args[1], (err, service) => {
            if (err) {
                console.error(err.message);
                process.exit(1);
            } else {
                console.log(`Service ready: ${JSON.stringify(service, null, 2)}`);
                process.exit(0);
            }
        });
    } else if (args[0] === 'check') {
        checker.verifyAll().then(results => {
            console.log(JSON.stringify(results, null, 2));
        });
    } else {
        console.log('Usage:');
        console.log('  node PortCheckAndConfirm.js monitor        - Start monitoring all services');
        console.log('  node PortCheckAndConfirm.js wait <service> - Wait for specific service');
        console.log('  node PortCheckAndConfirm.js check          - Check all services once');
    }
}