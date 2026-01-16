// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * ClaudePortLockController
 * Ensures all ports are available before starting services
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const net = require('net');

const execAsync = promisify(exec);

class ClaudePortLockController {
    constructor() {
        this.ports = {
            backend: parseInt(process.env.PORT_BACKEND) || 7777,
            frontend: parseInt(process.env.PORT_FRONTEND) || 9999,
            proxy: parseInt(process.env.PORT_PROXY) || 8080,
            agent: parseInt(process.env.PORT_AGENT) || 5000
        };
        
        this.lockFile = '.soulfra-lock';
        this.logFile = 'logs/portcheck.log';
    }
    
    async initialize() {
        console.log('🔐 ClaudePortLockController initializing...');
        
        // Ensure log directory exists
        await fs.mkdir('logs', { recursive: true });
        
        // Clear log
        await this.log('=== Port Check Started ===');
        await this.log(`Time: ${new Date().toISOString()}`);
        
        // Check all ports
        const results = await this.checkAllPorts();
        
        // Create lock file
        await this.createLockFile(results);
        
        return results;
    }
    
    async checkAllPorts() {
        const results = {};
        
        for (const [name, port] of Object.entries(this.ports)) {
            console.log(`\nChecking ${name} port ${port}...`);
            const result = await this.checkPort(port);
            results[name] = result;
            
            if (result.inUse) {
                console.log(`  ⚠️  Port ${port} is in use by PID ${result.pid}`);
                await this.log(`Port ${port} (${name}) in use by PID ${result.pid}`);
                
                if (result.process?.includes('soulfra') || result.process?.includes('unified')) {
                    console.log(`  ℹ️  Appears to be a Soulfra process`);
                    result.isSoulfra = true;
                } else {
                    console.log(`  ❌ Non-Soulfra process: ${result.process}`);
                    
                    // Ask to kill
                    if (await this.shouldKillProcess(port, result.pid, result.process)) {
                        await this.killProcess(result.pid);
                        result.killed = true;
                        result.inUse = false;
                        console.log(`  ✅ Process killed`);
                    }
                }
            } else {
                console.log(`  ✅ Port ${port} is available`);
                await this.log(`Port ${port} (${name}) is available`);
            }
        }
        
        return results;
    }
    
    async checkPort(port) {
        const result = {
            port,
            inUse: false,
            pid: null,
            process: null,
            error: null
        };
        
        try {
            // First check if port is in use
            const isInUse = await this.isPortInUse(port);
            
            if (isInUse) {
                result.inUse = true;
                
                // Get process info
                const { stdout } = await execAsync(`lsof -i :${port} | grep LISTEN || true`);
                if (stdout) {
                    const lines = stdout.trim().split('\n');
                    const parts = lines[0].split(/\s+/);
                    result.pid = parts[1];
                    result.process = parts[0];
                }
            }
        } catch (error) {
            result.error = error.message;
        }
        
        return result;
    }
    
    async isPortInUse(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
            
            server.once('listening', () => {
                server.close();
                resolve(false);
            });
            
            server.listen(port);
        });
    }
    
    async shouldKillProcess(port, pid, processName) {
        // Auto-kill known conflicting processes
        const autoKill = [
            'HABBO_HOTEL',
            'test-basic-server',
            'node.*unused',
            'python.*SimpleHTTP'
        ];
        
        for (const pattern of autoKill) {
            if (processName?.match(new RegExp(pattern))) {
                return true;
            }
        }
        
        // For important ports, be more aggressive
        if (port === this.ports.backend || port === this.ports.frontend) {
            console.log(`  ⚠️  Critical port ${port} blocked by ${processName}`);
            return true; // Auto-kill for critical ports
        }
        
        return false;
    }
    
    async killProcess(pid) {
        try {
            await execAsync(`kill -9 ${pid}`);
            await this.log(`Killed process ${pid}`);
            
            // Wait a moment for port to be released
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            await this.log(`Failed to kill process ${pid}: ${error.message}`);
            throw error;
        }
    }
    
    async createLockFile(results) {
        const lockData = {
            timestamp: new Date().toISOString(),
            ports: this.ports,
            results,
            pid: process.pid
        };
        
        await fs.writeFile(this.lockFile, JSON.stringify(lockData, null, 2));
        console.log(`\n✅ Lock file created: ${this.lockFile}`);
    }
    
    async log(message) {
        const timestamp = new Date().toISOString();
        const logLine = `${timestamp} - ${message}\n`;
        await fs.appendFile(this.logFile, logLine);
    }
    
    async release() {
        try {
            await fs.unlink(this.lockFile);
            console.log('🔓 Lock file removed');
        } catch (error) {
            // Ignore if doesn't exist
        }
    }
}

// Export for use in other scripts
module.exports = ClaudePortLockController;

// Run if called directly
if (require.main === module) {
    const controller = new ClaudePortLockController();
    
    controller.initialize()
        .then(results => {
            console.log('\n📊 Port Check Summary:');
            console.log(JSON.stringify(results, null, 2));
            
            // Check if all critical ports are available
            const critical = ['backend', 'frontend'];
            const allClear = critical.every(name => !results[name]?.inUse);
            
            if (allClear) {
                console.log('\n✅ All critical ports are available!');
                process.exit(0);
            } else {
                console.log('\n❌ Some critical ports are still in use');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💀 Port check failed:', error);
            process.exit(1);
        });
}