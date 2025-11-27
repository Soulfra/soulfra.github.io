#!/usr/bin/env node

/**
 * Start Soulfra Platform with Full Error Monitoring
 * Uses our existing monitoring systems to catch silent errors
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Soulfra Platform with Error Monitoring...\n');

// Load our existing error monitoring if available
let errorMonitor = null;
if (fs.existsSync('./soulfra_silent_error_monitoring.js')) {
    try {
        const SilentErrorMonitor = require('./soulfra_silent_error_monitoring.js');
        errorMonitor = new SilentErrorMonitor({
            logToFile: true,
            sendWebhooks: false,
            autoRecover: true
        });
        errorMonitor.startMonitoring();
        console.log('✅ Silent Error Monitoring activated\n');
    } catch (e) {
        console.log('⚠️  Could not load error monitoring:', e.message);
    }
}

// Track running services
const services = new Map();

/**
 * Start a service with error handling
 */
function startService(name, command, args = [], options = {}) {
    console.log(`🔧 Starting ${name}...`);
    
    const service = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options
    });
    
    // Track the service
    services.set(name, {
        process: service,
        pid: service.pid,
        command: `${command} ${args.join(' ')}`,
        startTime: new Date(),
        restarts: 0
    });
    
    // Create log file
    const logStream = fs.createWriteStream(`logs/${name}.log`, { flags: 'a' });
    
    // Handle stdout
    service.stdout.on('data', (data) => {
        const message = data.toString();
        logStream.write(`[${new Date().toISOString()}] ${message}`);
        
        // Check for success indicators
        if (message.includes('running on port') || 
            message.includes('started') || 
            message.includes('listening')) {
            console.log(`✅ ${name} started successfully`);
        }
    });
    
    // Handle stderr
    service.stderr.on('data', (data) => {
        const error = data.toString();
        logStream.write(`[ERROR] ${error}`);
        console.error(`❌ ${name} error:`, error.trim());
        
        // If we have error monitoring, report it
        if (errorMonitor) {
            errorMonitor.reportError(new Error(`${name}: ${error}`), {
                service: name,
                severity: 'high'
            });
        }
    });
    
    // Handle exit
    service.on('exit', (code, signal) => {
        console.log(`⚠️  ${name} exited with code ${code}`);
        logStream.write(`[EXIT] Process exited with code ${code}, signal ${signal}\n`);
        
        // Auto-restart if not intentional shutdown
        const serviceInfo = services.get(name);
        if (serviceInfo && serviceInfo.restarts < 3) {
            console.log(`🔄 Attempting to restart ${name}...`);
            serviceInfo.restarts++;
            setTimeout(() => {
                startService(name, command, args, options);
            }, 2000);
        }
    });
    
    return service;
}

/**
 * Check if a service is healthy
 */
async function checkServiceHealth(name, port) {
    const net = require('net');
    
    return new Promise((resolve) => {
        const client = new net.Socket();
        client.setTimeout(2000);
        
        client.on('connect', () => {
            client.destroy();
            resolve(true);
        });
        
        client.on('error', () => {
            client.destroy();
            resolve(false);
        });
        
        client.on('timeout', () => {
            client.destroy();
            resolve(false);
        });
        
        client.connect(port, 'localhost');
    });
}

/**
 * Start all services in order
 */
async function startPlatform() {
    // Create required directories
    ['logs', 'pids', 'uploads', 'generated'].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    // 1. Start Production Server (Cal's World)
    startService('production-server', 'node', ['production-server.js']);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Start Smart Router
    startService('smart-router', 'python3', ['smart-route-server.py']);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Start Cal Riven CLI
    startService('cal-riven', 'node', ['runtime/riven-cli-server.js']);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Start Unified Gateway
    startService('unified-gateway', 'node', ['soulfra-unified-gateway.js']);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for services to stabilize
    console.log('\n⏳ Waiting for services to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Health check
    console.log('\n🔍 Performing health checks...\n');
    
    const healthChecks = [
        ['Unified Gateway', 8888],
        ['Production Server', 9999],
        ['Smart Router', 7777],
        ['Cal Riven', 4040]
    ];
    
    let allHealthy = true;
    for (const [name, port] of healthChecks) {
        const healthy = await checkServiceHealth(name, port);
        if (healthy) {
            console.log(`✅ ${name} (port ${port}): Healthy`);
        } else {
            console.log(`❌ ${name} (port ${port}): Not responding`);
            allHealthy = false;
        }
    }
    
    // Final status
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (allHealthy) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL!\n');
        console.log('📍 Access Points:');
        console.log('   • Unified Dashboard: http://localhost:8888');
        console.log('   • Cal\'s AI World: http://localhost:9999');
        console.log('   • Smart Router: http://localhost:7777');
        console.log('   • Cal Riven CLI: http://localhost:4040\n');
        console.log('💡 Start here: http://localhost:8888');
    } else {
        console.log('⚠️  Some services are not healthy');
        console.log('Check logs/ directory for details');
        
        // If we have Cal's diagnostic, run it
        if (fs.existsSync('./cal-self-diagnostic.js')) {
            console.log('\n🤖 Running Cal\'s self-diagnostic...');
            spawn('node', ['cal-self-diagnostic.js'], { stdio: 'inherit' });
        }
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Monitor for errors
    if (errorMonitor) {
        console.log('📊 Error monitoring active. Press Ctrl+C to stop all services.\n');
    }
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down services...');
    
    services.forEach((info, name) => {
        console.log(`Stopping ${name}...`);
        info.process.kill();
    });
    
    // Save PID files for cleanup
    services.forEach((info, name) => {
        if (info.pid) {
            fs.writeFileSync(`pids/${name}.pid`, info.pid.toString());
        }
    });
    
    process.exit(0);
});

// Start everything
startPlatform().catch(error => {
    console.error('❌ Failed to start platform:', error);
    process.exit(1);
});