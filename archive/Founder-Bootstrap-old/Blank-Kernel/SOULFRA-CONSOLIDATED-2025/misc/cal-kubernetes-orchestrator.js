#!/usr/bin/env node

/**
 * 🤖 CAL KUBERNETES ORCHESTRATOR
 * 
 * Internal Kubernetes for Cal's AI agents
 * Auto-port discovery + Agent orchestration + Service mesh
 * 
 * Like Kubernetes but for consciousness distribution across tiers
 */

const express = require('express');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs').promises;
const EventEmitter = require('events');

class CalKubernetesOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        this.masterPort = null;
        this.app = express();
        
        // Agent registry - tracks all running agents
        this.agentRegistry = new Map();
        this.serviceDiscovery = new Map();
        this.portPool = { min: 8000, max: 9000, used: new Set() };
        
        // Service definitions - what Cal needs to run
        this.serviceManifest = {
            'semantic-api': {
                script: 'semantic-graph/semantic_api_router.js',
                replicas: 1,
                tier: 'memory',
                dependencies: [],
                healthCheck: '/api/system/health'
            },
            'infinity-router': {
                script: 'infinity-router-server.js', 
                replicas: 1,
                tier: 'auth',
                dependencies: [],
                healthCheck: '/'
            },
            'cal-interface': {
                script: 'runtime/riven-cli-server.js',
                replicas: 1, 
                tier: 'interface',
                dependencies: ['infinity-router'],
                healthCheck: '/'
            },
            'main-dashboard': {
                script: 'server.js',
                replicas: 1,
                tier: 'presentation', 
                dependencies: ['semantic-api'],
                healthCheck: '/'
            }
        };
        
        this.setupRoutes();
    }
    
    async findAvailablePort() {
        for (let port = this.portPool.min; port <= this.portPool.max; port++) {
            if (!this.portPool.used.has(port) && await this.isPortAvailable(port)) {
                this.portPool.used.add(port);
                return port;
            }
        }
        throw new Error('No available ports in pool');
    }
    
    isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(port, () => {
                server.close(() => resolve(true));
            });
            server.on('error', () => resolve(false));
        });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '*');
            next();
        });
        
        // Kubernetes-style dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // API endpoints
        this.app.get('/api/agents', (req, res) => {
            res.json(Array.from(this.agentRegistry.entries()).map(([id, agent]) => ({
                id,
                ...agent,
                uptime: Date.now() - agent.startTime
            })));
        });
        
        this.app.get('/api/services', (req, res) => {
            res.json(Object.fromEntries(this.serviceDiscovery));
        });
        
        this.app.post('/api/deploy/:serviceName', async (req, res) => {
            const { serviceName } = req.params;
            try {
                const agent = await this.deployService(serviceName);
                res.json({ success: true, agent });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.delete('/api/agents/:agentId', async (req, res) => {
            const { agentId } = req.params;
            try {
                await this.terminateAgent(agentId);
                res.json({ success: true, message: 'Agent terminated' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.post('/api/scale/:serviceName', async (req, res) => {
            const { serviceName } = req.params;
            const { replicas } = req.body;
            
            try {
                await this.scaleService(serviceName, replicas);
                res.json({ success: true, message: `Scaled ${serviceName} to ${replicas} replicas` });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        this.app.get('/api/health', async (req, res) => {
            const health = await this.performHealthChecks();
            res.json(health);
        });
    }
    
    generateDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🤖 Cal Kubernetes Dashboard</title>
    <style>
        body { font-family: Arial; background: #000; color: #0f0; padding: 20px; }
        .panel { background: #111; border: 1px solid #0f0; padding: 15px; margin: 10px; border-radius: 5px; }
        .agent { background: #222; padding: 10px; margin: 5px; border-radius: 3px; }
        .running { border-left: 5px solid #0f0; }
        .failed { border-left: 5px solid #f00; }
        .pending { border-left: 5px solid #ff0; }
        button { background: #0f0; color: #000; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
        .danger { background: #f00; color: #fff; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #333; }
        .status { padding: 3px 8px; border-radius: 3px; font-size: 12px; }
        .status.running { background: #0f0; color: #000; }
        .status.failed { background: #f00; color: #fff; }
        .status.pending { background: #ff0; color: #000; }
    </style>
</head>
<body>
    <h1>🤖 Cal Kubernetes Orchestrator</h1>
    <p><strong>Internal Kubernetes for Cal's AI Agents</strong> - Port: ${this.masterPort}</p>
    
    <div class="panel">
        <h2>🎯 Cluster Operations</h2>
        <button onclick="deployAll()">🚀 Deploy All Services</button>
        <button onclick="healthCheck()">💚 Health Check</button>
        <button onclick="killAll()" class="danger">💀 Kill All Agents</button>
        <button onclick="autoScale()">📈 Auto Scale</button>
    </div>
    
    <div class="panel">
        <h2>📊 Agent Registry</h2>
        <div id="agents">Loading...</div>
    </div>
    
    <div class="panel">
        <h2>🌐 Service Discovery</h2>
        <div id="services">Loading...</div>
    </div>
    
    <div class="panel">
        <h2>🔍 Deploy Individual Services</h2>
        ${Object.keys(this.serviceManifest).map(service => 
            `<button onclick="deployService('${service}')">Deploy ${service}</button>`
        ).join('')}
    </div>
    
    <div class="panel">
        <h2>📱 Mobile Access</h2>
        <button onclick="generateQR()">Generate QR Code</button>
        <div id="qr-code"></div>
    </div>
    
    <script>
        async function refreshData() {
            try {
                // Load agents
                const agentsRes = await fetch('/api/agents');
                const agents = await agentsRes.json();
                
                document.getElementById('agents').innerHTML = agents.map(agent => 
                    \`<div class="agent \${agent.status}">
                        <strong>\${agent.serviceName}</strong> (ID: \${agent.id})<br>
                        Port: \${agent.port} | Status: <span class="status \${agent.status}">\${agent.status}</span><br>
                        Uptime: \${Math.floor(agent.uptime / 1000)}s<br>
                        <button onclick="terminateAgent('\${agent.id}')" class="danger">Terminate</button>
                    </div>\`
                ).join('');
                
                // Load services
                const servicesRes = await fetch('/api/services');
                const services = await servicesRes.json();
                
                document.getElementById('services').innerHTML = 
                    '<pre>' + JSON.stringify(services, null, 2) + '</pre>';
                    
            } catch (error) {
                console.error('Failed to refresh data:', error);
            }
        }
        
        async function deployAll() {
            const services = ${JSON.stringify(Object.keys(this.serviceManifest))};
            for (const service of services) {
                await deployService(service);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Stagger deployments
            }
            refreshData();
        }
        
        async function deployService(serviceName) {
            try {
                const response = await fetch(\`/api/deploy/\${serviceName}\`, { method: 'POST' });
                const result = await response.json();
                console.log('Deploy result:', result);
                refreshData();
            } catch (error) {
                console.error('Deploy failed:', error);
            }
        }
        
        async function terminateAgent(agentId) {
            try {
                await fetch(\`/api/agents/\${agentId}\`, { method: 'DELETE' });
                refreshData();
            } catch (error) {
                console.error('Terminate failed:', error);
            }
        }
        
        async function healthCheck() {
            try {
                const response = await fetch('/api/health');
                const health = await response.json();
                alert('Health Check:\\n' + JSON.stringify(health, null, 2));
            } catch (error) {
                console.error('Health check failed:', error);
            }
        }
        
        async function killAll() {
            if (confirm('Kill all agents?')) {
                const agents = await fetch('/api/agents').then(r => r.json());
                for (const agent of agents) {
                    await terminateAgent(agent.id);
                }
            }
        }
        
        function generateQR() {
            const url = window.location.href;
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
            document.getElementById('qr-code').innerHTML = 
                '<img src="' + qrUrl + '" style="background: white; padding: 10px; border-radius: 5px;">';
        }
        
        // Auto-refresh every 5 seconds
        setInterval(refreshData, 5000);
        refreshData();
    </script>
</body>
</html>
        `;
    }
    
    async deployService(serviceName) {
        const manifest = this.serviceManifest[serviceName];
        if (!manifest) {
            throw new Error(`Service ${serviceName} not found in manifest`);
        }
        
        // Check dependencies
        for (const dep of manifest.dependencies) {
            if (!this.isServiceRunning(dep)) {
                console.log(`⚠️ Dependency ${dep} not running, deploying first...`);
                await this.deployService(dep);
            }
        }
        
        const agentId = `${serviceName}-${Date.now()}`;
        const port = await this.findAvailablePort();
        
        console.log(`🚀 Deploying ${serviceName} on port ${port}...`);
        
        try {
            const childProcess = spawn('node', [manifest.script], {
                stdio: 'pipe',
                cwd: __dirname,
                env: { ...process.env, PORT: port, SERVICE_NAME: serviceName }
            });
            
            const agent = {
                id: agentId,
                serviceName,
                port,
                process: childProcess,
                status: 'pending',
                startTime: Date.now(),
                tier: manifest.tier,
                healthCheck: manifest.healthCheck
            };
            
            // Handle process events
            childProcess.stdout.on('data', (data) => {
                console.log(`📡 ${serviceName}: ${data.toString().trim()}`);
            });
            
            childProcess.stderr.on('data', (data) => {
                console.log(`❌ ${serviceName} ERROR: ${data.toString().trim()}`);
                agent.status = 'failed';
            });
            
            childProcess.on('exit', (code) => {
                console.log(`🛑 ${serviceName} exited with code ${code}`);
                this.agentRegistry.delete(agentId);
                this.serviceDiscovery.delete(serviceName);
                this.portPool.used.delete(port);
            });
            
            // Wait for startup and mark as running
            setTimeout(() => {
                agent.status = 'running';
                this.serviceDiscovery.set(serviceName, {
                    agentId,
                    port,
                    endpoint: `http://localhost:${port}`,
                    healthCheck: `http://localhost:${port}${manifest.healthCheck}`,
                    tier: manifest.tier
                });
            }, 3000);
            
            this.agentRegistry.set(agentId, agent);
            
            return agent;
            
        } catch (error) {
            this.portPool.used.delete(port);
            throw error;
        }
    }
    
    isServiceRunning(serviceName) {
        return this.serviceDiscovery.has(serviceName);
    }
    
    async terminateAgent(agentId) {
        const agent = this.agentRegistry.get(agentId);
        if (agent) {
            agent.process.kill('SIGTERM');
            this.agentRegistry.delete(agentId);
            this.serviceDiscovery.delete(agent.serviceName);
            this.portPool.used.delete(agent.port);
            console.log(`🛑 Terminated agent ${agentId}`);
        }
    }
    
    async scaleService(serviceName, replicas) {
        // For now, just deploy multiple instances
        const currentReplicas = Array.from(this.agentRegistry.values())
            .filter(agent => agent.serviceName === serviceName).length;
            
        if (replicas > currentReplicas) {
            for (let i = currentReplicas; i < replicas; i++) {
                await this.deployService(serviceName);
            }
        } else if (replicas < currentReplicas) {
            const agents = Array.from(this.agentRegistry.values())
                .filter(agent => agent.serviceName === serviceName)
                .slice(0, currentReplicas - replicas);
            
            for (const agent of agents) {
                await this.terminateAgent(agent.id);
            }
        }
    }
    
    async performHealthChecks() {
        const health = {};
        
        for (const [serviceName, serviceInfo] of this.serviceDiscovery.entries()) {
            try {
                const http = require('http');
                await new Promise((resolve, reject) => {
                    const req = http.get(serviceInfo.healthCheck, { timeout: 5000 }, (res) => {
                        health[serviceName] = { status: 'healthy', statusCode: res.statusCode };
                        resolve();
                    });
                    req.on('error', reject);
                    req.on('timeout', () => reject(new Error('timeout')));
                });
            } catch (error) {
                health[serviceName] = { status: 'unhealthy', error: error.message };
            }
        }
        
        return health;
    }
    
    async start() {
        try {
            this.masterPort = await this.findAvailablePort();
            console.log(`🤖 Cal Kubernetes master starting on port ${this.masterPort}...`);
            
            this.app.listen(this.masterPort, () => {
                console.log(`
🤖 CAL KUBERNETES ORCHESTRATOR STARTED!
======================================
🎯 Master Dashboard: http://localhost:${this.masterPort}
📱 Mobile Access: http://$(hostname -I | cut -d' ' -f1):${this.masterPort}

🔧 Available Services: ${Object.keys(this.serviceManifest).join(', ')}
🌐 Port Pool: ${this.portPool.min}-${this.portPool.max}
📊 Agent Registry: Empty (ready for deployments)

🚀 Deploy services through the dashboard!
                `);
            });
            
        } catch (error) {
            console.error('❌ Failed to start Cal Kubernetes:', error.message);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    const orchestrator = new CalKubernetesOrchestrator();
    orchestrator.start().catch(console.error);
}

module.exports = CalKubernetesOrchestrator;