#!/usr/bin/env node

/**
 * Soulfra Reliability Wrapper
 * Non-invasive integration that enhances existing services
 * WITHOUT modifying their code
 */

const fs = require('fs');
const path = require('path');

// Import the new reliability components
const { InfrastructureReliabilityEngine } = require('./soulfra_integration_guide.js');
const FileSystemDebugger = require('./soulfra_file_system_debugger.js');

// Import existing monitoring systems
let existingMonitors = {};

// Try to load existing monitors
const monitors = [
    ['silentError', './soulfra_silent_error_monitoring.js'],
    ['health', './health-monitor.js'],
    ['calDiagnostic', './cal-self-diagnostic.js'],
    ['validation', './daemon/SystemValidationDaemon.js'],
    ['heartbeat', './daemon/LoopHeartbeatWatcher.js']
];

for (const [name, path] of monitors) {
    try {
        if (fs.existsSync(path)) {
            existingMonitors[name] = require(path);
            console.log(`✅ Loaded existing monitor: ${name}`);
        }
    } catch (e) {
        console.log(`⚠️  Could not load ${name}: ${e.message}`);
    }
}

// Initialize the reliability engine
console.log('\n🛡️  Initializing Soulfra Reliability Engine...\n');

const reliabilityEngine = new InfrastructureReliabilityEngine({
    // Use existing monitors if available
    existingMonitors: existingMonitors,
    
    // Configuration
    config: {
        silentErrorDetection: true,
        autoRecovery: true,
        predictiveMonitoring: true,
        developmentMode: process.env.NODE_ENV !== 'production'
    },
    
    // Thresholds
    thresholds: {
        errorRate: 0.01,        // 1% error rate threshold
        responseTime: 1000,     // 1 second response time
        memoryUsage: 0.8,      // 80% memory usage
        cpuUsage: 0.7          // 70% CPU usage
    }
});

// File system debugger for robust operations
const fsDebugger = new FileSystemDebugger();

// Patch file system operations to prevent race conditions
console.log('🔧 Patching file system operations...');

// Create robust file operations
global.robustFs = {
    async writeFile(filePath, content) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write to temp file first, then rename (atomic)
        const tempPath = `${filePath}.tmp`;
        fs.writeFileSync(tempPath, content);
        fs.renameSync(tempPath, filePath);
        
        // Verify write succeeded
        await new Promise(resolve => setTimeout(resolve, 10));
        if (!fs.existsSync(filePath)) {
            throw new Error(`Failed to write file: ${filePath}`);
        }
    },
    
    async readFile(filePath) {
        // Retry logic for transient failures
        let attempts = 3;
        while (attempts > 0) {
            try {
                return fs.readFileSync(filePath, 'utf8');
            } catch (e) {
                if (e.code === 'ENOENT' && attempts > 1) {
                    attempts--;
                    await new Promise(resolve => setTimeout(resolve, 100));
                } else {
                    throw e;
                }
            }
        }
    }
};

// Wrap existing services
console.log('\n📦 Wrapping existing services...\n');

const wrappedServices = {};

// Services to wrap with their start commands
const servicesToWrap = [
    {
        name: 'unified-gateway',
        path: './soulfra-unified-gateway.js',
        startCommand: 'node soulfra-unified-gateway.js',
        port: 8888
    },
    {
        name: 'production-server',
        path: './production-server.js',
        startCommand: 'node production-server.js',
        port: 9999
    },
    {
        name: 'smart-router',
        path: './smart-route-server.py',
        startCommand: 'python3 smart-route-server.py',
        port: 7777,
        isPython: true
    },
    {
        name: 'cal-riven',
        path: './runtime/riven-cli-server.js',
        startCommand: 'node runtime/riven-cli-server.js',
        port: 4040
    }
];

// Function to start a service with reliability wrapper
async function startServiceWithReliability(serviceConfig) {
    const { name, path, startCommand, port, isPython } = serviceConfig;
    
    console.log(`🚀 Starting ${name} with reliability wrapper...`);
    
    try {
        // Register service with reliability engine
        reliabilityEngine.registerService(name, {
            startCommand,
            port,
            healthEndpoint: `http://localhost:${port}/health`,
            criticalityLevel: 'high'
        });
        
        // If it's a Node.js service, try to wrap it directly
        if (!isPython && fs.existsSync(path)) {
            try {
                const service = require(path);
                wrappedServices[name] = reliabilityEngine.wrap(name, service);
                console.log(`✅ ${name} wrapped successfully`);
            } catch (e) {
                console.log(`⚠️  Could not directly wrap ${name}: ${e.message}`);
                console.log(`   Will monitor externally`);
            }
        }
        
        // Start the service using spawn for external monitoring
        const { spawn } = require('child_process');
        const [command, ...args] = startCommand.split(' ');
        
        const serviceProcess = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: process.cwd()
        });
        
        // Monitor the service
        reliabilityEngine.monitorExternalService(name, {
            pid: serviceProcess.pid,
            process: serviceProcess,
            port: port
        });
        
        // Log output
        const logFile = `logs/${name}-reliability.log`;
        const logStream = fs.createWriteStream(logFile, { flags: 'a' });
        
        serviceProcess.stdout.on('data', (data) => {
            logStream.write(`[${new Date().toISOString()}] ${data}`);
        });
        
        serviceProcess.stderr.on('data', (data) => {
            logStream.write(`[ERROR] ${data}`);
            // Report errors to reliability engine
            reliabilityEngine.reportError(new Error(data.toString()), {
                service: name,
                severity: 'high'
            });
        });
        
        serviceProcess.on('exit', (code) => {
            console.log(`⚠️  ${name} exited with code ${code}`);
            // Reliability engine will handle restart
        });
        
        return serviceProcess;
        
    } catch (error) {
        console.error(`❌ Failed to start ${name}:`, error.message);
        return null;
    }
}

// Reliability dashboard
const express = require('express');
const dashboardApp = express();
const DASHBOARD_PORT = 5050;

dashboardApp.get('/reliability', async (req, res) => {
    const status = await reliabilityEngine.getSystemStatus();
    res.json({
        timestamp: new Date(),
        uptime: process.uptime(),
        services: status.services,
        errors: status.recentErrors,
        health: status.overallHealth,
        predictions: status.predictions,
        metrics: status.metrics
    });
});

dashboardApp.get('/reliability/dashboard', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Reliability Dashboard</title>
    <style>
        body { 
            background: #000; 
            color: #00ff88; 
            font-family: monospace; 
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #00ffff; }
        .status { 
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        .status.healthy { background: #00ff88; }
        .status.warning { background: #ffaa00; }
        .status.error { background: #ff0044; }
        .metric {
            background: #111;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #00ff88;
        }
        pre { background: #222; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛡️ Soulfra Reliability Dashboard</h1>
        <div id="status">Loading...</div>
    </div>
    
    <script>
        async function updateStatus() {
            try {
                const response = await fetch('/reliability');
                const data = await response.json();
                
                let html = '<h2>System Status</h2>';
                
                // Overall health
                const healthClass = data.health.score > 0.9 ? 'healthy' : 
                                  data.health.score > 0.7 ? 'warning' : 'error';
                html += '<div class="metric">';
                html += '<span class="status ' + healthClass + '"></span>';
                html += 'Overall Health: ' + (data.health.score * 100).toFixed(1) + '%';
                html += '</div>';
                
                // Services
                html += '<h3>Services</h3>';
                for (const [name, service] of Object.entries(data.services || {})) {
                    const statusClass = service.healthy ? 'healthy' : 'error';
                    html += '<div class="metric">';
                    html += '<span class="status ' + statusClass + '"></span>';
                    html += name + ' - ' + (service.healthy ? 'Running' : 'Down');
                    if (service.responseTime) {
                        html += ' (Response: ' + service.responseTime + 'ms)';
                    }
                    html += '</div>';
                }
                
                // Recent errors
                if (data.errors && data.errors.length > 0) {
                    html += '<h3>Recent Errors</h3>';
                    html += '<pre>' + JSON.stringify(data.errors.slice(0, 5), null, 2) + '</pre>';
                }
                
                // Predictions
                if (data.predictions) {
                    html += '<h3>Predictions</h3>';
                    html += '<pre>' + JSON.stringify(data.predictions, null, 2) + '</pre>';
                }
                
                document.getElementById('status').innerHTML = html;
            } catch (e) {
                document.getElementById('status').innerHTML = 
                    '<div class="metric"><span class="status error"></span>Failed to load status</div>';
            }
        }
        
        // Update every 5 seconds
        updateStatus();
        setInterval(updateStatus, 5000);
    </script>
</body>
</html>
    `);
});

// Start the reliability dashboard
dashboardApp.listen(DASHBOARD_PORT, () => {
    console.log(`\n📊 Reliability Dashboard: http://localhost:${DASHBOARD_PORT}/reliability/dashboard`);
});

// Main startup function
async function startWithReliability() {
    console.log('\n🎯 Starting all services with reliability enhancement...\n');
    
    // Ensure directories exist
    ['logs', 'pids'].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
    
    // Start each service with delay
    for (const service of servicesToWrap) {
        await startServiceWithReliability(service);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Run file system diagnostic
    console.log('\n🔍 Running file system diagnostic...');
    const fsIssues = await fsDebugger.diagnose();
    if (fsIssues.length > 0) {
        console.log(`⚠️  Found ${fsIssues.length} file system issues`);
        const fixScript = fsDebugger.generateFixScript(fsIssues);
        await robustFs.writeFile('fs-fixes.sh', fixScript);
        console.log('📝 Fix script written to: fs-fixes.sh');
    } else {
        console.log('✅ No file system issues found');
    }
    
    // Start monitoring
    reliabilityEngine.startMonitoring();
    
    console.log('\n✅ All services started with reliability monitoring!');
    console.log('\n📍 Access Points:');
    console.log('  • Reliability Dashboard: http://localhost:5050/reliability/dashboard');
    console.log('  • Unified Gateway: http://localhost:8888');
    console.log('  • Production Server: http://localhost:9999');
    console.log('  • Smart Router: http://localhost:7777');
    console.log('  • Cal Riven: http://localhost:4040\n');
}

// Handle shutdown gracefully
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down reliability wrapper...');
    await reliabilityEngine.shutdown();
    process.exit(0);
});

// Start if run directly
if (require.main === module) {
    startWithReliability().catch(error => {
        console.error('❌ Failed to start:', error);
        process.exit(1);
    });
}

module.exports = { reliabilityEngine, robustFs, startWithReliability };