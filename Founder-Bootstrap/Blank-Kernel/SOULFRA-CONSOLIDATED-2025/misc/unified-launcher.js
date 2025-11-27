#!/usr/bin/env node

/**
 * 🚀 Soulfra Unified Launcher
 * 
 * Single command to launch complete emotional consciousness platform:
 * - All servers (3000, 3080, 4040, 3666)
 * - Emotional memory engine
 * - Verification systems
 * - QR pairing for mobile access
 * - Integrated dashboards
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const QRCode = require('qrcode');
const os = require('os');

class SoulfraunifiedLauncher {
    constructor() {
        this.identity = {
            name: 'Soulfra Unified Launcher',
            emoji: '🚀',
            role: 'System Orchestrator'
        };
        
        // Service definitions with proper paths
        this.services = {
            // Core servers
            main_server: {
                name: 'Main Dashboard Server',
                emoji: '🏠',
                script: this.findServerScript(['server.js', 'dashboard/server.js']),
                port: 3000,
                description: 'Primary dashboard hub',
                critical: true,
                startupTime: 3000
            },
            mirror_os: {
                name: 'MirrorOS Demo Server',
                emoji: '🪞',
                script: this.findServerScript(['mirror-os-demo/server.js']),
                port: 3080,
                description: 'Modular system with VibeGraph',
                critical: true,
                startupTime: 4000
            },
            riven_cli: {
                name: 'Riven CLI Server',
                emoji: '🤖',
                script: this.findServerScript(['runtime/riven-cli-server.js', 'tier-minus10/runtime/riven-cli-server.js']),
                port: 4040,
                description: 'Cal reflection interface',
                critical: true,
                startupTime: 3500
            },
            semantic_api: {
                name: 'Semantic API Router',
                emoji: '🌐',
                script: path.resolve(__dirname, 'semantic-graph/semantic_api_router.js'),
                port: 3666,
                description: 'Emotional memory API',
                critical: true,
                startupTime: 2000
            },
            infinity_router: {
                name: 'Infinity Router Server',
                emoji: '🌐',
                script: path.resolve(__dirname, 'infinity-router-server.js'),
                port: 5050,
                description: 'Trust bridge for Cal interface',
                critical: true,
                startupTime: 2000
            },
            
            // Background emotional memory services
            trigger_listener: {
                name: 'External Trigger Listener',
                emoji: '🔍',
                script: path.resolve(__dirname, 'semantic-graph/external_trigger_listener.js'),
                port: null,
                description: 'Anomaly detection engine',
                critical: false,
                startupTime: 1500
            },
            edge_writer: {
                name: 'Loop Edge Writer',
                emoji: '🕸️',
                script: path.resolve(__dirname, 'semantic-graph/loop_edge_writer.js'),
                port: null,
                description: 'Graph relationship generator',
                critical: false,
                startupTime: 1000
            }
        };
        
        this.processes = new Map();
        this.startupPhase = 'initializing';
        this.sessionToken = this.generateSessionToken();
        this.localIP = this.getLocalIP();
        this.systemStatus = {
            services_running: 0,
            emotional_memory_active: false,
            qr_code_ready: false,
            mobile_pairing_enabled: false
        };
    }
    
    findServerScript(possiblePaths) {
        for (const relPath of possiblePaths) {
            const fullPath = path.resolve(__dirname, '..', relPath);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
            
            // Also try from current directory
            const currentPath = path.resolve(__dirname, relPath);
            if (fs.existsSync(currentPath)) {
                return currentPath;
            }
        }
        
        // Return first path as fallback (will error if doesn't exist)
        return path.resolve(__dirname, '..', possiblePaths[0]);
    }
    
    async launch() {
        console.log(`${this.identity.emoji} Launching Soulfra Unified System...`);
        console.log('='.repeat(80));
        console.log('🧠 Emotional Consciousness Platform');
        console.log('🔗 Localhost CLI → Mobile QR Access');
        console.log('='.repeat(80));
        
        this.startupPhase = 'launching';
        
        try {
            // Phase 1: Start core servers
            await this.startCoreServers();
            
            // Phase 2: Start emotional memory services
            await this.startEmotionalMemoryServices();
            
            // Phase 3: Initialize mobile pairing
            await this.initializeMobilePairing();
            
            // Phase 4: Display unified dashboard
            await this.displayUnifiedDashboard();
            
            // Phase 5: Setup monitoring
            this.setupSystemMonitoring();
            
            this.startupPhase = 'operational';
            console.log(`\n🎉 Soulfra system fully operational!`);
            
        } catch (error) {
            console.error(`${this.identity.emoji} Launch failed:`, error.message);
            await this.shutdown();
        }
    }
    
    async startCoreServers() {
        console.log('\n📡 Phase 1: Starting Core Servers...');
        
        const coreServices = ['main_server', 'mirror_os', 'infinity_router', 'riven_cli', 'semantic_api'];
        
        for (const serviceId of coreServices) {
            const service = this.services[serviceId];
            
            if (!fs.existsSync(service.script)) {
                console.warn(`⚠️  ${service.emoji} ${service.name}: Script not found at ${service.script}`);
                if (service.critical) {
                    throw new Error(`Critical service ${service.name} script missing`);
                }
                continue;
            }
            
            console.log(`${service.emoji} Starting ${service.name}...`);
            
            try {
                await this.startService(serviceId);
                
                // Wait for startup
                await this.sleep(service.startupTime);
                
                // Verify if port-based service is running
                if (service.port) {
                    const isRunning = await this.checkServiceHealth(service.port);
                    if (isRunning) {
                        console.log(`✅ ${service.name} running on port ${service.port}`);
                        this.systemStatus.services_running++;
                    } else {
                        console.warn(`⚠️  ${service.name} started but not responding on port ${service.port}`);
                    }
                } else {
                    console.log(`✅ ${service.name} background process started`);
                    this.systemStatus.services_running++;
                }
                
            } catch (error) {
                console.error(`❌ Failed to start ${service.name}:`, error.message);
                if (service.critical) {
                    throw error;
                }
            }
        }
    }
    
    async startEmotionalMemoryServices() {
        console.log('\n🧠 Phase 2: Starting Emotional Memory Services...');
        
        const memoryServices = ['trigger_listener', 'edge_writer'];
        
        for (const serviceId of memoryServices) {
            const service = this.services[serviceId];
            
            console.log(`${service.emoji} Starting ${service.name}...`);
            
            try {
                await this.startService(serviceId);
                await this.sleep(service.startupTime);
                console.log(`✅ ${service.name} active`);
                this.systemStatus.services_running++;
            } catch (error) {
                console.warn(`⚠️  ${service.name} failed to start:`, error.message);
            }
        }
        
        this.systemStatus.emotional_memory_active = true;
        console.log('🧠 Emotional memory engine online');
    }
    
    async initializeMobilePairing() {
        console.log('\n📱 Phase 3: Initializing Mobile Pairing...');
        
        try {
            // Generate QR code for mobile access
            const mobileURL = `http://${this.localIP}:3000/mobile?token=${this.sessionToken}`;
            const qrCodeDataURL = await QRCode.toDataURL(mobileURL, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            // Save QR code for web display
            const qrCodeHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Mobile Pairing</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            text-align: center; 
            background: #1a1a1a; 
            color: #00ff00; 
            padding: 50px; 
        }
        .qr-container { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            display: inline-block; 
            margin: 20px; 
        }
        .status { 
            background: #2a2a2a; 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px; 
        }
    </style>
</head>
<body>
    <h1>📱 Soulfra Mobile Pairing</h1>
    <div class="qr-container">
        <img src="${qrCodeDataURL}" alt="Mobile Pairing QR Code" />
    </div>
    <div class="status">
        <h3>Scan QR Code with Your Phone</h3>
        <p>URL: <code>${mobileURL}</code></p>
        <p>Session: <code>${this.sessionToken}</code></p>
        <p>Status: <span id="status">🟡 Waiting for connection...</span></p>
    </div>
    <div class="status">
        <h3>🚀 Services Running</h3>
        <p>Main Dashboard: <a href="http://localhost:3000">localhost:3000</a></p>
        <p>MirrorOS: <a href="http://localhost:3080">localhost:3080</a></p>
        <p>Riven CLI: <a href="http://localhost:4040">localhost:4040</a></p>
        <p>Semantic API: <a href="http://localhost:3666">localhost:3666</a></p>
    </div>
</body>
</html>`;
            
            // Save QR code page
            const qrFilePath = path.resolve(__dirname, 'mobile-pairing.html');
            fs.writeFileSync(qrFilePath, qrCodeHTML);
            
            this.systemStatus.qr_code_ready = true;
            this.systemStatus.mobile_pairing_enabled = true;
            
            console.log('📱 Mobile pairing initialized');
            console.log(`   QR Code URL: ${mobileURL}`);
            console.log(`   QR Page: file://${qrFilePath}`);
            
        } catch (error) {
            console.warn('⚠️  Mobile pairing setup failed:', error.message);
        }
    }
    
    async displayUnifiedDashboard() {
        console.log('\n🎛️  Phase 4: Unified Dashboard Ready...');
        
        const dashboardInfo = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        🧠 SOULFRA UNIFIED SYSTEM                              ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  🏠 Main Dashboard:    http://localhost:3000                                  ║
║  🪞 MirrorOS Modules:  http://localhost:3080                                  ║
║  🤖 Cal Interface:     http://localhost:4040                                  ║
║  🌐 Emotional API:     http://localhost:3666                                  ║
║                                                                               ║
║  📱 Mobile Pairing:    file://${path.resolve(__dirname, 'mobile-pairing.html').padEnd(39)} ║
║  📊 System Health:     http://localhost:3666/api/system/health                ║
║  🔍 API Docs:          http://localhost:3666/                                 ║
║                                                                               ║
║  Session Token: ${this.sessionToken.padEnd(56)} ║
║  Local IP: ${this.localIP.padEnd(61)} ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  📊 Status: ${this.systemStatus.services_running} services running | 🧠 Memory: ${this.systemStatus.emotional_memory_active ? 'Active' : 'Inactive'} | 📱 Mobile: ${this.systemStatus.mobile_pairing_enabled ? 'Ready' : 'Disabled'}  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;
        
        console.log(dashboardInfo);
        
        // Display quick start instructions
        console.log('\n🚀 Quick Start:');
        console.log('  1. Open main dashboard: http://localhost:3000');
        console.log('  2. Scan QR code for mobile access');
        console.log('  3. Test emotional memory: http://localhost:3666/api/emotions/timeline');
        console.log('  4. Check system health: http://localhost:3666/api/system/health');
        
        // Try to open browser automatically
        try {
            const { exec } = require('child_process');
            const openCommand = process.platform === 'darwin' ? 'open' : 
                              process.platform === 'win32' ? 'start' : 'xdg-open';
            exec(`${openCommand} http://localhost:3000`);
            console.log('\n🌐 Opening main dashboard in browser...');
        } catch (error) {
            console.log('\n💡 Manually open: http://localhost:3000');
        }
    }
    
    setupSystemMonitoring() {
        console.log('\n🔍 Phase 5: System Monitoring Active...');
        
        // Monitor service health every 30 seconds
        setInterval(async () => {
            const healthCheck = await this.performHealthCheck();
            if (healthCheck.issues.length > 0) {
                console.log(`⚠️  Health issues detected: ${healthCheck.issues.join(', ')}`);
            }
        }, 30000);
        
        // Monitor emotional memory system every minute
        setInterval(async () => {
            try {
                const response = await this.makeHTTPRequest('localhost', 3666, '/api/system/health');
                if (response && response.data) {
                    const health = response.data;
                    if (health.overall_status === 'excellent') {
                        console.log('🧠 Emotional memory system: Excellent');
                    } else if (health.overall_status === 'concerning') {
                        console.log('⚠️  Emotional memory system needs attention');
                    }
                }
            } catch (error) {
                // Emotional memory API not responding
            }
        }, 60000);
        
        // Setup graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutdown signal received...');
            this.shutdown();
        });
        
        process.on('SIGTERM', () => {
            this.shutdown();
        });
    }
    
    async startService(serviceId) {
        const service = this.services[serviceId];
        
        const childProcess = spawn('node', [service.script], {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: path.dirname(service.script),
            env: { ...process.env, SERVICE_ID: serviceId }
        });
        
        this.processes.set(serviceId, childProcess);
        
        // Handle process output
        childProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output && !output.includes('listening') && !output.includes('started')) {
                console.log(`${service.emoji} ${service.name}: ${output.split('\n')[0]}`);
            }
        });
        
        childProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error) {
                console.error(`${service.emoji} ${service.name} ERROR: ${error}`);
            }
        });
        
        childProcess.on('close', (code) => {
            console.log(`${service.emoji} ${service.name} stopped (code ${code})`);
            this.processes.delete(serviceId);
        });
        
        return childProcess;
    }
    
    async checkServiceHealth(port) {
        try {
            const response = await this.makeHTTPRequest('localhost', port, '/');
            return response !== null;
        } catch (error) {
            return false;
        }
    }
    
    async performHealthCheck() {
        const issues = [];
        const serviceChecks = [];
        
        // Check each port-based service
        for (const [serviceId, service] of Object.entries(this.services)) {
            if (service.port) {
                const isHealthy = await this.checkServiceHealth(service.port);
                if (!isHealthy) {
                    issues.push(`${service.name} (port ${service.port})`);
                }
            }
        }
        
        return { issues, healthy: issues.length === 0 };
    }
    
    makeHTTPRequest(hostname, port, path) {
        return new Promise((resolve, reject) => {
            const options = { hostname, port, path, method: 'GET', timeout: 5000 };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        resolve(data);
                    }
                });
            });
            
            req.on('error', () => resolve(null));
            req.on('timeout', () => resolve(null));
            req.end();
        });
    }
    
    async shutdown() {
        console.log(`\n${this.identity.emoji} Shutting down Soulfra system...`);
        
        // Stop all processes
        for (const [serviceId, childProcess] of this.processes) {
            const service = this.services[serviceId];
            console.log(`${service.emoji} Stopping ${service.name}...`);
            childProcess.kill('SIGTERM');
        }
        
        // Give processes time to shutdown gracefully
        setTimeout(() => {
            console.log(`${this.identity.emoji} Soulfra shutdown complete.`);
            process.exit(0);
        }, 5000);
    }
    
    // Utility functions
    generateSessionToken() {
        return `soultoken_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    
    getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Add QRCode package check
function checkQRCodePackage() {
    try {
        require('qrcode');
        return true;
    } catch (error) {
        console.log('📦 Installing QRCode package...');
        const { execSync } = require('child_process');
        try {
            execSync('npm install qrcode', { stdio: 'inherit' });
            console.log('✅ QRCode package installed');
            return true;
        } catch (installError) {
            console.warn('⚠️  Could not install QRCode package. Mobile pairing will be limited.');
            return false;
        }
    }
}

// Run the unified launcher
if (require.main === module) {
    // Check dependencies
    if (!checkQRCodePackage()) {
        console.log('Continuing without QR code generation...');
    }
    
    const launcher = new SoulfraunifiedLauncher();
    launcher.launch().catch(error => {
        console.error('🚨 Launch failed:', error);
        process.exit(1);
    });
}

module.exports = SoulfraunifiedLauncher;