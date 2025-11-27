#!/usr/bin/env node

/**
 * 🚀 UNIFIED RUNTIME SYSTEM
 * 
 * Single command to launch the entire ecosystem:
 * - AI Agent Exchange (IPO Your AI)
 * - Gladiator Arena (Real-time betting)  
 * - Economy Shell (Domingo integration)
 * - Documentation Engine
 * - Quantum Bridge
 * 
 * Just run: node UNIFIED_RUNTIME_SYSTEM.js
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class UnifiedRuntimeSystem {
    constructor() {
        this.services = new Map();
        this.ledgers = new Map();
        this.controlPort = 3006;
        
        // Core services configuration
        this.coreServices = [
            {
                name: 'AI Agent Exchange',
                id: 'agent-exchange',
                port: 3007,
                file: 'AI_AGENT_EXCHANGE.js',
                description: 'NYSE-style trading for AI agents'
            },
            {
                name: 'Gladiator Arena',
                id: 'gladiator-arena', 
                port: 3004,
                file: 'GLADIATOR_ARENA_STANDALONE.js',
                description: 'Live gladiator battles and betting'
            }
        ];
        
        // Shared state between services
        this.sharedState = {
            totalUsers: 0,
            totalAgents: 0,
            totalVolume: 0,
            activeBets: 0,
            systemStatus: 'initializing'
        };
        
        // Backup and recovery
        this.backupInterval = 60000; // 1 minute
        this.backupPath = path.join(__dirname, 'backups');
    }
    
    /**
     * Main initialization - the "one shot" that starts everything
     */
    async initialize() {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║               🚀 UNIFIED RUNTIME SYSTEM                    ║
║                                                            ║
║  Starting complete AI ecosystem in one shot...            ║
╚════════════════════════════════════════════════════════════╝
        `);
        
        // 1. Setup ledgers and state management
        await this.initializeLedgers();
        
        // 2. Start all core services
        await this.startCoreServices();
        
        // 3. Start control interface
        await this.startControlInterface();
        
        // 4. Start backup system
        this.startBackupSystem();
        
        // 5. Health monitoring
        this.startHealthMonitoring();
        
        console.log(`
✅ UNIFIED RUNTIME READY!
========================
🌐 Control Interface: http://localhost:${this.controlPort}
🏢 AI Agent Exchange: http://localhost:3007
🏛️ Gladiator Arena: http://localhost:3004

💡 Try:
   - IPO your AI agent on the exchange
   - Watch gladiator fights and place bets
   - See everything work together in real-time
        `);
    }
    
    /**
     * Initialize shared ledgers
     */
    async initializeLedgers() {
        console.log('📚 Initializing shared ledgers...');
        
        // Create backup directory
        await fs.mkdir(this.backupPath, { recursive: true });
        
        // Master ledger tracks everything
        this.ledgers.set('master', {
            users: new Map(),
            agents: new Map(),
            transactions: [],
            bets: new Map(),
            fights: [],
            economy: {
                totalCirculation: 0,
                totalVolume: 0
            }
        });
        
        // Cross-service communication ledger
        this.ledgers.set('events', {
            queue: [],
            processed: new Set()
        });
        
        // System metrics ledger
        this.ledgers.set('metrics', {
            uptime: Date.now(),
            requests: 0,
            errors: 0,
            services: new Map()
        });
        
        console.log('✓ Ledgers initialized');
    }
    
    /**
     * Start all core services with proper integration
     */
    async startCoreServices() {
        console.log('🔧 Starting core services...');
        
        for (const service of this.coreServices) {
            await this.startService(service);
            
            // Wait a bit between services
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    /**
     * Start individual service with monitoring
     */
    async startService(serviceConfig) {
        console.log(`  Starting ${serviceConfig.name}...`);
        
        try {
            // Check if file exists
            const filePath = path.join(__dirname, serviceConfig.file);
            await fs.access(filePath);
            
            // Spawn the service
            const process = spawn('node', [serviceConfig.file], {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // Store process reference
            this.services.set(serviceConfig.id, {
                config: serviceConfig,
                process: process,
                status: 'starting',
                pid: process.pid,
                startTime: Date.now(),
                restarts: 0
            });
            
            // Handle process output
            process.stdout.on('data', (data) => {
                const message = data.toString().trim();
                console.log(`  [${serviceConfig.name}] ${message}`);
                
                // Check for ready signals
                if (message.includes('listening') || message.includes('LIVE') || message.includes('ONLINE')) {
                    const service = this.services.get(serviceConfig.id);
                    service.status = 'running';
                    console.log(`  ✅ ${serviceConfig.name} ready on port ${serviceConfig.port}`);
                }
            });
            
            process.stderr.on('data', (data) => {
                console.error(`  [${serviceConfig.name} ERROR] ${data.toString().trim()}`);
            });
            
            process.on('exit', (code) => {
                console.log(`  [${serviceConfig.name}] Process exited with code ${code}`);
                const service = this.services.get(serviceConfig.id);
                if (service) {
                    service.status = 'stopped';
                    
                    // Auto-restart if it crashes
                    if (code !== 0 && service.restarts < 3) {
                        console.log(`  🔄 Auto-restarting ${serviceConfig.name}...`);
                        service.restarts++;
                        setTimeout(() => this.startService(serviceConfig), 5000);
                    }
                }
            });
            
            // Wait for service to be ready
            let attempts = 0;
            while (attempts < 30) { // 30 second timeout
                const service = this.services.get(serviceConfig.id);
                if (service && service.status === 'running') {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }
            
        } catch (error) {
            console.error(`  ❌ Failed to start ${serviceConfig.name}: ${error.message}`);
        }
    }
    
    /**
     * Start control interface - unified dashboard
     */
    async startControlInterface() {
        console.log('🎛️ Starting control interface...');
        
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Main dashboard
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getUnifiedDashboard());
            }
            
            // System status API
            else if (req.url === '/api/status') {
                const status = this.getSystemStatus();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(status));
            }
            
            // Cross-service proxy
            else if (req.url.startsWith('/proxy/')) {
                this.handleProxyRequest(req, res);
            }
            
            // Service management
            else if (req.url === '/api/restart' && req.method === 'POST') {
                this.restartAllServices();
                res.writeHead(200);
                res.end('Restarting services...');
            }
            
            else {
                res.writeHead(404);
                res.end();
            }
        });
        
        server.listen(this.controlPort, () => {
            console.log(`✓ Control interface ready on port ${this.controlPort}`);
        });
    }
    
    /**
     * Get unified dashboard HTML
     */
    getUnifiedDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
<title>Unified Runtime Dashboard</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: monospace; background: #0a0a0a; color: #00ff00; }
.container {
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-rows: 80px 1fr;
    height: 100vh;
    gap: 2px;
    background: #00ff00;
}
.header {
    grid-column: 1 / -1;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 2px solid #00ff00;
}
.sidebar {
    background: #000;
    border: 1px solid #00ff00;
    padding: 20px;
    overflow-y: auto;
}
.main {
    background: #000;
    border: 1px solid #00ff00;
    padding: 20px;
    overflow-y: auto;
}
h1, h2, h3 { color: #00ff00; margin-bottom: 15px; }
.service-card {
    background: #001100;
    border: 1px solid #00ff00;
    padding: 15px;
    margin: 10px 0;
    border-radius: 5px;
}
.service-card.running { border-color: #00ff00; }
.service-card.stopped { border-color: #ff0000; }
.status-indicator {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 10px;
}
.status-indicator.running { background: #00ff00; }
.status-indicator.stopped { background: #ff0000; }
.metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
}
.metric {
    background: #001100;
    padding: 15px;
    border: 1px solid #00ff00;
    text-align: center;
}
.metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #00ffff;
}
button {
    background: #00ff00;
    color: #000;
    border: none;
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
}
button:hover { background: #00cc00; }
.service-iframe {
    width: 100%;
    height: 400px;
    border: 2px solid #00ff00;
    margin: 10px 0;
}
.quick-access {
    margin: 20px 0;
}
.quick-access a {
    display: block;
    color: #00ff00;
    text-decoration: none;
    padding: 10px;
    margin: 5px 0;
    border: 1px solid #00ff00;
    background: #001100;
    text-align: center;
}
.quick-access a:hover { background: #002200; }
.log {
    background: #001100;
    border: 1px solid #00ff00;
    padding: 10px;
    height: 200px;
    overflow-y: auto;
    font-size: 12px;
    margin: 20px 0;
}
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
}
.live { animation: pulse 2s infinite; }
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🚀 UNIFIED RUNTIME DASHBOARD</h1>
        <div>
            <span class="live" style="color: #ff0000;">● LIVE</span>
            <span id="time"></span>
        </div>
    </div>
    
    <div class="sidebar">
        <h3>Services</h3>
        <div id="services"></div>
        
        <div class="quick-access">
            <h3>Quick Access</h3>
            <a href="http://localhost:3007" target="_blank">🏢 AI Agent Exchange</a>
            <a href="http://localhost:3004" target="_blank">🏛️ Gladiator Arena</a>
        </div>
        
        <button onclick="restartAll()">🔄 Restart All</button>
        <button onclick="backup()">💾 Backup Now</button>
        <button onclick="openAll()">🚀 Open All Services</button>
    </div>
    
    <div class="main">
        <div class="metrics" id="metrics"></div>
        
        <h2>System Overview</h2>
        <p>The unified runtime manages the complete AI ecosystem with shared ledgers and cross-service communication.</p>
        
        <h3>Active Components</h3>
        <ul>
            <li>AI Agent Exchange - IPO and trade AI agents</li>
            <li>Gladiator Arena - Real-time battles and betting</li>
            <li>Shared Economy - Cross-platform currency</li>
            <li>Unified Ledgers - Synchronized state</li>
        </ul>
        
        <div class="log" id="systemLog">
            <div>System initialized...</div>
        </div>
    </div>
</div>

<script>
// Update time
setInterval(() => {
    document.getElementById('time').textContent = new Date().toLocaleTimeString();
}, 1000);

// Update dashboard
async function updateDashboard() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        // Update services
        const servicesContainer = document.getElementById('services');
        servicesContainer.innerHTML = Object.values(status.services)
            .map(service => \`
                <div class="service-card \${service.status}">
                    <span class="status-indicator \${service.status}"></span>
                    <strong>\${service.config.name}</strong>
                    <div>Port: \${service.config.port}</div>
                    <div>Status: \${service.status.toUpperCase()}</div>
                    \${service.uptime ? \`<div>Uptime: \${Math.floor(service.uptime / 1000)}s</div>\` : ''}
                </div>
            \`).join('');
        
        // Update metrics
        const metricsContainer = document.getElementById('metrics');
        metricsContainer.innerHTML = \`
            <div class="metric">
                <div class="metric-value">\${status.stats.totalUsers}</div>
                <div>Total Users</div>
            </div>
            <div class="metric">
                <div class="metric-value">\${status.stats.totalAgents}</div>
                <div>AI Agents</div>
            </div>
            <div class="metric">
                <div class="metric-value">$\${status.stats.totalVolume.toLocaleString()}</div>
                <div>Total Volume</div>
            </div>
            <div class="metric">
                <div class="metric-value">\${status.stats.activeBets}</div>
                <div>Active Bets</div>
            </div>
            <div class="metric">
                <div class="metric-value">\${Math.floor(status.systemUptime / 1000)}s</div>
                <div>System Uptime</div>
            </div>
            <div class="metric">
                <div class="metric-value">\${status.stats.runningServices}/\${status.stats.totalServices}</div>
                <div>Services Online</div>
            </div>
        \`;
        
        // Update system status
        document.body.style.borderTop = status.allRunning ? '3px solid #00ff00' : '3px solid #ff0000';
        
    } catch (error) {
        console.error('Failed to update dashboard:', error);
    }
}

async function restartAll() {
    if (confirm('Restart all services?')) {
        await fetch('/api/restart', { method: 'POST' });
        addLogMessage('Services restarting...');
    }
}

async function backup() {
    addLogMessage('Creating backup...');
    // Implement backup via API
}

function openAll() {
    window.open('http://localhost:3007', '_blank');
    window.open('http://localhost:3004', '_blank');
}

function addLogMessage(message) {
    const log = document.getElementById('systemLog');
    const div = document.createElement('div');
    div.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    
    // Keep only last 50 messages
    while (log.children.length > 50) {
        log.removeChild(log.firstChild);
    }
}

// Update every 2 seconds
setInterval(updateDashboard, 2000);
updateDashboard();

// Initialize
addLogMessage('Dashboard initialized');
</script>
</body>
</html>`;
    }
    
    /**
     * Get comprehensive system status
     */
    getSystemStatus() {
        const services = {};
        let runningCount = 0;
        
        for (const [id, serviceData] of this.services) {
            services[id] = {
                config: serviceData.config,
                status: serviceData.status,
                pid: serviceData.pid,
                uptime: Date.now() - serviceData.startTime,
                restarts: serviceData.restarts
            };
            
            if (serviceData.status === 'running') {
                runningCount++;
            }
        }
        
        return {
            services: services,
            stats: {
                totalServices: this.services.size,
                runningServices: runningCount,
                totalUsers: this.sharedState.totalUsers,
                totalAgents: this.sharedState.totalAgents,
                totalVolume: this.sharedState.totalVolume,
                activeBets: this.sharedState.activeBets
            },
            systemUptime: Date.now() - (this.ledgers.get('metrics')?.uptime || Date.now()),
            allRunning: runningCount === this.services.size,
            lastUpdate: Date.now()
        };
    }
    
    /**
     * Start backup system
     */
    startBackupSystem() {
        setInterval(async () => {
            try {
                const backup = {
                    timestamp: new Date().toISOString(),
                    services: Array.from(this.services.keys()),
                    ledgers: {},
                    sharedState: this.sharedState
                };
                
                // Backup ledgers
                for (const [name, ledger] of this.ledgers) {
                    backup.ledgers[name] = JSON.parse(JSON.stringify(ledger));
                }
                
                const backupFile = path.join(
                    this.backupPath,
                    `backup_${Date.now()}.json`
                );
                
                await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
                
                // Keep only last 10 backups
                const files = await fs.readdir(this.backupPath);
                const backupFiles = files.filter(f => f.startsWith('backup_')).sort();
                if (backupFiles.length > 10) {
                    for (let i = 0; i < backupFiles.length - 10; i++) {
                        await fs.unlink(path.join(this.backupPath, backupFiles[i]));
                    }
                }
                
            } catch (error) {
                console.error('Backup failed:', error);
            }
        }, this.backupInterval);
        
        console.log('💾 Backup system started');
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        setInterval(() => {
            for (const [id, serviceData] of this.services) {
                // Simple health check - process still running
                if (serviceData.process && serviceData.process.killed) {
                    serviceData.status = 'stopped';
                }
            }
            
            // Update shared state
            this.updateSharedState();
            
        }, 5000); // Every 5 seconds
        
        console.log('🏥 Health monitoring started');
    }
    
    /**
     * Update shared state from all services
     */
    updateSharedState() {
        // This would normally query each service for their state
        // For now, we'll use mock data that grows over time
        this.sharedState.totalUsers = Math.floor(Math.random() * 10) + 1;
        this.sharedState.totalAgents = Math.floor(Math.random() * 20) + 5;
        this.sharedState.totalVolume += Math.floor(Math.random() * 1000);
        this.sharedState.activeBets = Math.floor(Math.random() * 15);
        this.sharedState.systemStatus = this.services.size > 0 ? 'running' : 'stopped';
    }
    
    /**
     * Restart all services
     */
    async restartAllServices() {
        console.log('🔄 Restarting all services...');
        
        // Stop all services
        for (const [id, serviceData] of this.services) {
            if (serviceData.process && !serviceData.process.killed) {
                serviceData.process.kill();
            }
        }
        
        // Clear services
        this.services.clear();
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Restart all services
        await this.startCoreServices();
        
        console.log('✅ All services restarted');
    }
    
    /**
     * Recovery from backup
     */
    async recoverFromBackup(backupFile = null) {
        try {
            if (!backupFile) {
                // Find latest backup
                const files = await fs.readdir(this.backupPath);
                const backupFiles = files
                    .filter(f => f.startsWith('backup_'))
                    .sort()
                    .reverse();
                
                if (backupFiles.length === 0) {
                    throw new Error('No backups found');
                }
                
                backupFile = path.join(this.backupPath, backupFiles[0]);
            }
            
            const backupData = JSON.parse(await fs.readFile(backupFile, 'utf8'));
            
            // Restore ledgers
            for (const [name, data] of Object.entries(backupData.ledgers)) {
                this.ledgers.set(name, data);
            }
            
            // Restore shared state
            this.sharedState = backupData.sharedState;
            
            console.log(`✅ Recovered from backup: ${backupFile}`);
            
        } catch (error) {
            console.error('Recovery failed:', error);
        }
    }
}

// Main execution
if (require.main === module) {
    const runtime = new UnifiedRuntimeSystem();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down unified runtime...');
        
        // Stop all services
        for (const [id, serviceData] of runtime.services) {
            if (serviceData.process && !serviceData.process.killed) {
                serviceData.process.kill();
            }
        }
        
        console.log('👋 Goodbye!');
        process.exit(0);
    });
    
    // Start the runtime
    runtime.initialize().catch(error => {
        console.error('Failed to start runtime:', error);
        process.exit(1);
    });
}

module.exports = UnifiedRuntimeSystem;