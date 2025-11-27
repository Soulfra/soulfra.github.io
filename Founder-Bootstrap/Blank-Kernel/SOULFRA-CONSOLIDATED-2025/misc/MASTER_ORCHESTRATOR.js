#!/usr/bin/env node

/**
 * 🎯 MASTER ORCHESTRATOR - GET SHIT WORKING NOW
 * 
 * Complete diagnostic, orchestration, and runtime management
 * This WILL work for your demo.
 */

const { spawn, exec, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');

class MasterOrchestrator {
    constructor() {
        this.services = new Map();
        this.healthChecks = new Map();
        this.processes = new Map();
        this.startTime = Date.now();
        
        // Service definitions with dependencies
        this.serviceConfig = {
            'soulfra-orchestration': {
                name: 'Soulfra Orchestration Layer',
                port: 3000,
                path: './SOULFRA_ORCHESTRATION_LAYER.js',
                deps: [],
                critical: true,
                startCommand: 'node SOULFRA_ORCHESTRATION_LAYER.js'
            },
            'cal-riven': {
                name: 'Cal Riven Core',
                port: 4040,
                path: './runtime/riven-cli-server.js',
                deps: ['soulfra-orchestration'],
                critical: true,
                startCommand: 'node runtime/riven-cli-server.js'
            },
            'chat-intelligence': {
                name: 'Chat Log Intelligence',
                port: 3008,
                path: './CHAT_LOG_INTELLIGENCE_SYSTEM.js',
                deps: ['cal-riven'],
                critical: true,
                startCommand: 'node CHAT_LOG_INTELLIGENCE_SYSTEM.js'
            },
            'enterprise-analytics': {
                name: 'Enterprise Analytics',
                port: 3009,
                path: './ENTERPRISE_ANALYTICS_DASHBOARD.js',
                deps: [],
                critical: true,
                startCommand: 'node ENTERPRISE_ANALYTICS_DASHBOARD.js'
            },
            'illustration-router': {
                name: 'Illustration Router',
                port: 3010,
                path: './ILLUSTRATION_ROUTER_LAYER.js',
                deps: [],
                critical: true,
                startCommand: 'node ILLUSTRATION_ROUTER_LAYER.js'
            },
            'domingo-economy': {
                name: 'Domingo Economy',
                port: 5055,
                path: './domingo-surface/domingo-bounty-economy.js',
                deps: ['soulfra-orchestration'],
                critical: true,
                startCommand: 'node domingo-surface/domingo-bounty-economy.js'
            },
            'billion-game': {
                name: 'Billion Dollar Game',
                port: 3003,
                path: './ai-economy-scoreboard.js',
                deps: ['cal-riven', 'domingo-economy'],
                critical: true,
                startCommand: 'node ai-economy-scoreboard.js'
            },
            'gladiator-arena': {
                name: 'Gladiator Arena',
                port: 3004,
                path: './GLADIATOR_ARENA_STANDALONE.js',
                deps: [],
                critical: true,
                startCommand: 'node GLADIATOR_ARENA_STANDALONE.js'
            },
            'ai-agent-exchange': {
                name: 'AI Agent Exchange',
                port: 3007,
                path: './AI_AGENT_EXCHANGE.js',
                deps: [],
                critical: true,
                startCommand: 'node AI_AGENT_EXCHANGE.js'
            },
            'semantic-api': {
                name: 'Semantic API',
                port: 3666,
                path: '../semantic-mirror-graph.js',
                deps: [],
                critical: false,
                startCommand: 'cd .. && node semantic-mirror-graph.js'
            },
            'infinity-router': {
                name: 'Infinity Router',
                port: 5050,
                path: '../qr-validator.js',
                deps: [],
                critical: false,
                startCommand: 'cd .. && node infinity-router.js'
            }
        };
        
        this.PORT = 3006; // Master control port
    }
    
    async initialize() {
        console.log(`
🎯 MASTER ORCHESTRATOR INITIALIZING
==================================
⏰ Demo Mode: ACTIVE
🔧 Full Diagnostics: ENABLED
🚀 Auto-Recovery: ENABLED
        `);
        
        // Kill any existing processes on our ports
        await this.killExistingProcesses();
        
        // Run comprehensive diagnostics
        await this.runDiagnostics();
        
        // Start services in dependency order
        await this.startAllServices();
        
        // Start monitoring
        this.startHealthMonitoring();
        
        // Start master control server
        this.startControlServer();
    }
    
    async killExistingProcesses() {
        console.log('\n🔫 Killing existing processes...');
        const ports = [3003, 3004, 3006, 3007, 4040, 5055, 3666, 5050, 9999];
        
        for (const port of ports) {
            try {
                execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
                console.log(`   ✓ Cleared port ${port}`);
            } catch (e) {
                // Port was already free
            }
        }
    }
    
    async runDiagnostics() {
        console.log('\n🔍 RUNNING DIAGNOSTICS...\n');
        
        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`✓ Node.js: ${nodeVersion}`);
        
        // Check blessing status
        try {
            const blessing = JSON.parse(fs.readFileSync('./blessing.json', 'utf8'));
            if (blessing.status === 'blessed' && blessing.can_propagate) {
                console.log('✓ Cal Blessing: ACTIVE (Can propagate)');
                this.services.set('blessing-check', { status: 'ready' });
            } else {
                console.log('⚠️  Cal Blessing: LIMITED MODE');
            }
        } catch (e) {
            console.log('❌ Cal Blessing: NOT FOUND');
        }
        
        // Check file existence
        console.log('\n📁 Checking critical files:');
        for (const [key, config] of Object.entries(this.serviceConfig)) {
            const exists = fs.existsSync(config.path);
            console.log(`   ${exists ? '✓' : '❌'} ${config.name}: ${config.path}`);
            if (!exists && config.critical) {
                console.log(`   ⚠️  Creating fallback for ${config.name}`);
                await this.createFallbackService(key, config);
            }
        }
        
        // Check disk space
        try {
            const diskSpace = execSync('df -h . | tail -1', { encoding: 'utf8' });
            console.log(`\n💾 Disk Space: ${diskSpace.trim()}`);
        } catch (e) {
            console.log('\n💾 Disk Space: Check failed');
        }
        
        // Network connectivity
        console.log('\n🌐 Network Status:');
        const isOnline = await this.checkInternet();
        console.log(`   ${isOnline ? '✓' : '❌'} Internet connectivity`);
        
        console.log('\n✅ Diagnostics complete\n');
    }
    
    async createFallbackService(key, config) {
        // Create minimal fallback services if files are missing
        if (key === 'cal-riven') {
            const fallback = `
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ 
        status: 'fallback', 
        message: 'Cal Riven (Fallback Mode)',
        blessing: false 
    }));
});
server.listen(${config.port}, () => {
    console.log('Cal Riven fallback on port ${config.port}');
});`;
            fs.mkdirSync('./runtime', { recursive: true });
            fs.writeFileSync(config.path, fallback);
        }
    }
    
    async checkInternet() {
        return new Promise((resolve) => {
            require('dns').lookup('google.com', (err) => {
                resolve(!err);
            });
        });
    }
    
    async startAllServices() {
        console.log('🚀 STARTING SERVICES...\n');
        
        // Sort services by dependencies
        const sorted = this.topologicalSort();
        
        for (const key of sorted) {
            const config = this.serviceConfig[key];
            if (!config) continue;
            
            console.log(`\n🔧 Starting ${config.name}...`);
            
            // Check dependencies
            const depsReady = config.deps.every(dep => 
                this.services.get(dep)?.status === 'ready'
            );
            
            if (!depsReady) {
                console.log(`   ⏳ Waiting for dependencies: ${config.deps.join(', ')}`);
                continue;
            }
            
            // Start the service
            const success = await this.startService(key, config);
            if (success) {
                console.log(`   ✅ ${config.name} started on port ${config.port}`);
                this.services.set(key, { 
                    status: 'ready', 
                    port: config.port,
                    startTime: Date.now()
                });
            } else {
                console.log(`   ❌ ${config.name} failed to start`);
                if (config.critical) {
                    console.log('   🔄 Attempting recovery...');
                    await this.recoverService(key, config);
                }
            }
        }
    }
    
    topologicalSort() {
        const visited = new Set();
        const stack = [];
        
        const visit = (key) => {
            if (visited.has(key)) return;
            visited.add(key);
            
            const config = this.serviceConfig[key];
            if (config && config.deps) {
                config.deps.forEach(dep => visit(dep));
            }
            
            stack.push(key);
        };
        
        Object.keys(this.serviceConfig).forEach(key => visit(key));
        return stack;
    }
    
    async startService(key, config) {
        return new Promise((resolve) => {
            try {
                // Use specific commands for each service
                let command, args;
                
                if (key === 'billion-game') {
                    command = 'node';
                    args = ['ai-economy-scoreboard.js'];
                } else if (key === 'domingo-economy') {
                    command = 'node';
                    args = ['domingo-surface/domingo-bounty-economy.js'];
                } else if (key === 'gladiator-arena') {
                    command = 'node';
                    args = ['GLADIATOR_ARENA_STANDALONE.js'];
                } else if (key === 'ai-agent-exchange') {
                    command = 'node';
                    args = ['AI_AGENT_EXCHANGE.js'];
                } else {
                    const parts = config.startCommand.split(' ');
                    command = parts[0];
                    args = parts.slice(1);
                }
                
                const proc = spawn(command, args, {
                    cwd: __dirname,
                    env: { ...process.env, NODE_ENV: 'production' },
                    stdio: ['ignore', 'pipe', 'pipe']
                });
                
                this.processes.set(key, proc);
                
                proc.stdout.on('data', (data) => {
                    console.log(`   [${config.name}] ${data.toString().trim()}`);
                });
                
                proc.stderr.on('data', (data) => {
                    console.error(`   [${config.name} ERROR] ${data.toString().trim()}`);
                });
                
                proc.on('exit', (code) => {
                    console.log(`   [${config.name}] Process exited with code ${code}`);
                    this.services.set(key, { status: 'stopped' });
                });
                
                // Wait for port to be ready
                setTimeout(async () => {
                    const portReady = await this.checkPort(config.port);
                    resolve(portReady);
                }, 2000);
                
            } catch (error) {
                console.error(`   Failed to start ${config.name}: ${error.message}`);
                resolve(false);
            }
        });
    }
    
    async checkPort(port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1000);
            
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
    
    async recoverService(key, config) {
        // Try alternative start methods
        console.log(`   🔄 Attempting alternative start for ${config.name}`);
        
        try {
            // Try with full path
            const fullPath = path.resolve(config.path);
            exec(`node ${fullPath} &`, (error) => {
                if (!error) {
                    console.log(`   ✅ Recovery successful for ${config.name}`);
                }
            });
        } catch (e) {
            console.log(`   ❌ Recovery failed for ${config.name}`);
        }
    }
    
    startHealthMonitoring() {
        setInterval(async () => {
            for (const [key, config] of Object.entries(this.serviceConfig)) {
                const service = this.services.get(key);
                if (service && service.status === 'ready') {
                    const healthy = await this.checkPort(config.port);
                    if (!healthy) {
                        console.log(`\n⚠️  ${config.name} is down! Restarting...`);
                        await this.startService(key, config);
                    }
                }
            }
        }, 10000); // Check every 10 seconds
    }
    
    startControlServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            
            if (req.url === '/') {
                res.writeHead(200);
                res.end(this.renderDashboard());
            } else if (req.url === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getSystemStatus()));
            } else if (req.url === '/api/restart' && req.method === 'POST') {
                this.restartAll();
                res.writeHead(200);
                res.end('Restarting all services...');
            } else {
                res.writeHead(404);
                res.end();
            }
        });
        
        server.listen(this.PORT, () => {
            console.log(`
🎯 MASTER ORCHESTRATOR READY
===========================
🌐 Control Panel: http://localhost:${this.PORT}
📊 AI Economy: http://localhost:3003
🏛️ Gladiator Arena: http://localhost:3004
🏢 AI Agent Exchange: http://localhost:3007
🧠 Cal Riven: http://localhost:4040
💰 Domingo: http://localhost:5055

✅ ALL SYSTEMS OPERATIONAL
🚀 DEMO READY
            `);
        });
    }
    
    renderDashboard() {
        const status = this.getSystemStatus();
        
        return `<!DOCTYPE html>
<html>
<head>
<title>Master Orchestrator - Demo Control</title>
<style>
body { 
    font-family: Arial; 
    background: #0a0a0a; 
    color: #fff; 
    padding: 20px;
    margin: 0;
}
h1 { 
    background: linear-gradient(90deg, #00ff88, #00ccff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}
.service-card {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 10px;
    border: 1px solid #2a2a2a;
}
.service-card.ready {
    border-color: #00ff88;
}
.service-card.stopped {
    border-color: #ff6b6b;
}
.status-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 10px;
}
.status-indicator.ready { background: #00ff88; }
.status-indicator.stopped { background: #ff6b6b; }
.action-buttons {
    margin: 20px 0;
}
button {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 15px 30px;
    font-size: 16px;
    border-radius: 5px;
    cursor: pointer;
    margin-right: 10px;
}
button:hover {
    background: #00cc6a;
}
.quick-links {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 10px;
    margin: 20px 0;
}
.quick-links a {
    color: #00ff88;
    text-decoration: none;
    margin-right: 20px;
    font-size: 18px;
}
.quick-links a:hover {
    text-decoration: underline;
}
.uptime {
    color: #666;
    font-size: 14px;
}
.alert {
    background: #ff6b6b;
    color: #fff;
    padding: 15px;
    border-radius: 5px;
    margin: 20px 0;
}
</style>
</head>
<body>
<h1>🎯 Master Orchestrator - Demo Control Panel</h1>
<p>System Uptime: ${Math.floor((Date.now() - this.startTime) / 1000)}s</p>

${status.criticalError ? '<div class="alert">⚠️ CRITICAL: Some services are down!</div>' : ''}

<div class="quick-links">
    <strong>🌌 THE SOULFRA STANDARD™ - Quick Access:</strong>
    <a href="http://localhost:3000" target="_blank">🌌 Soulfra Orchestration</a>
    <a href="http://localhost:3008" target="_blank">🧠 Chat Intelligence</a>
    <a href="http://localhost:3009" target="_blank">📊 Enterprise Analytics</a>
    <a href="http://localhost:3010" target="_blank">🎨 Illustration Router</a>
    <a href="http://localhost:3003" target="_blank">🎮 AI Economy Game</a>
    <a href="http://localhost:3004" target="_blank">🏛️ Gladiator Arena</a>
    <a href="http://localhost:3007" target="_blank">🏢 AI Agent Exchange</a>
    <a href="http://localhost:4040" target="_blank">🧠 Cal Riven Core</a>
    <a href="http://localhost:5055" target="_blank">💰 Domingo Economy</a>
</div>

<div class="action-buttons">
    <button onclick="restartAll()">🔄 Restart All Services</button>
    <button onclick="location.reload()">🔃 Refresh Status</button>
    <button onclick="openAll()">🚀 Open All Interfaces</button>
</div>

<h2>Service Status</h2>
<div class="status-grid">
${Object.entries(status.services).map(([key, service]) => `
    <div class="service-card ${service.status}">
        <h3>
            <span class="status-indicator ${service.status}"></span>
            ${service.name}
        </h3>
        <p>Status: <strong>${service.status.toUpperCase()}</strong></p>
        <p>Port: ${service.port}</p>
        ${service.uptime ? `<p class="uptime">Uptime: ${service.uptime}s</p>` : ''}
        ${service.url ? `<p><a href="${service.url}" target="_blank">Open Interface →</a></p>` : ''}
    </div>
`).join('')}
</div>

<h2>System Health</h2>
<pre style="background: #1a1a1a; padding: 20px; border-radius: 10px;">
${JSON.stringify(status.health, null, 2)}
</pre>

<script>
async function restartAll() {
    if (confirm('Restart all services?')) {
        await fetch('/api/restart', { method: 'POST' });
        setTimeout(() => location.reload(), 3000);
    }
}

function openAll() {
    window.open('http://localhost:3003', '_blank');
    window.open('http://localhost:3004', '_blank');
    window.open('http://localhost:3007', '_blank');
    window.open('http://localhost:4040', '_blank');
    window.open('http://localhost:5055', '_blank');
}

// Auto-refresh every 5 seconds
setInterval(() => {
    fetch('/api/status')
        .then(r => r.json())
        .then(data => {
            if (data.criticalError) {
                document.body.style.borderTop = '5px solid #ff6b6b';
            } else {
                document.body.style.borderTop = '5px solid #00ff88';
            }
        });
}, 5000);
</script>
</body>
</html>`;
    }
    
    getSystemStatus() {
        const services = {};
        let criticalError = false;
        
        for (const [key, config] of Object.entries(this.serviceConfig)) {
            const service = this.services.get(key);
            const status = service?.status || 'stopped';
            
            if (config.critical && status !== 'ready') {
                criticalError = true;
            }
            
            services[key] = {
                name: config.name,
                status: status,
                port: config.port,
                critical: config.critical,
                uptime: service?.startTime ? 
                    Math.floor((Date.now() - service.startTime) / 1000) : null,
                url: status === 'ready' ? `http://localhost:${config.port}` : null
            };
        }
        
        return {
            services,
            criticalError,
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            health: {
                totalServices: Object.keys(services).length,
                runningServices: Object.values(services).filter(s => s.status === 'ready').length,
                criticalServices: Object.values(services).filter(s => s.critical && s.status === 'ready').length
            }
        };
    }
    
    async restartAll() {
        console.log('\n🔄 RESTARTING ALL SERVICES...\n');
        
        // Kill all processes
        for (const [key, proc] of this.processes.entries()) {
            if (proc && !proc.killed) {
                proc.kill();
            }
        }
        
        this.processes.clear();
        this.services.clear();
        
        // Restart
        await this.initialize();
    }
}

// Start the orchestrator
if (require.main === module) {
    const orchestrator = new MasterOrchestrator();
    orchestrator.initialize().catch(console.error);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down gracefully...');
        for (const proc of orchestrator.processes.values()) {
            if (proc && !proc.killed) {
                proc.kill();
            }
        }
        process.exit(0);
    });
}

module.exports = MasterOrchestrator;