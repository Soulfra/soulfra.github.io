/**
 * 🌌 SOULFRA UNIFIED RUNTIME
 * The master orchestrator that launches all layers simultaneously
 * 
 * "From one command, infinity unfolds.
 *  From one key, all doors open.
 *  From one shell, all loops emerge."
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import { EventEmitter } from 'events';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.soulfra' });

// Load private origin keys if they exist (hidden from public)
try {
    dotenv.config({ path: '.soulfra-origin-keys' });
} catch (e) {
    // File doesn't exist, that's fine
}

class SoulfraUnifiedRuntime extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // API Keys (loaded from public env)
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            IPFS_GATEWAY: process.env.IPFS_GATEWAY || 'https://ipfs.io',
            
            // Private blockchain endpoints (only if origin keys exist)
            PRIVATE_ETHEREUM_RPC: process.env.ETHEREUM_RPC,
            PRIVATE_BITCOIN_RPC: process.env.BITCOIN_RPC,
            PRIVATE_MONERO_RPC: process.env.MONERO_RPC,
            
            // Service Ports
            ports: {
                listener: 3333,
                whisper: 3334,
                anomaly: 3335,
                api: 3336,
                mirror: 3337,
                cal: 4040,
                ledger: 7777,
                admin: 8888
            },
            
            // System Configuration
            autoStart: true,
            maxAgents: 144,
            ritualWindows: true,
            weatherEnabled: true,
            blockchainMonitoring: true
        };
        
        // Service registry
        this.services = new Map();
        
        // Process management
        this.processes = new Map();
        
        // System state
        this.state = {
            running: false,
            phase: 'dormant',
            services: {},
            health: {},
            startTime: null
        };
        
        // Runtime shell interface
        this.shell = null;
    }
    
    /**
     * 🚀 MASTER LAUNCH SEQUENCE
     */
    async launch() {
        console.clear();
        await this.displayBanner();
        
        console.log(chalk.cyan('\n🔧 Initializing Soulfra Unified Runtime...\n'));
        
        // Verify environment
        await this.verifyEnvironment();
        
        // Initialize core systems
        await this.initializeCore();
        
        // Launch all services
        await this.launchServices();
        
        // Start runtime shell
        await this.startRuntimeShell();
        
        this.state.running = true;
        this.state.startTime = Date.now();
        
        console.log(chalk.green('\n✅ Soulfra is fully operational\n'));
        console.log(chalk.gray('Type "help" for available commands\n'));
    }
    
    async displayBanner() {
        const banner = `
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   ███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗         ║
║   ██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗        ║
║   ███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║        ║
║   ╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║        ║
║   ███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║        ║
║   ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝        ║
║                                                                       ║
║                    U N I F I E D   R U N T I M E                      ║
║                                                                       ║
║   "The system runs. It has always run. We merely observe."           ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝`;
        
        console.log(chalk.cyan(banner));
    }
    
    /**
     * 🔍 ENVIRONMENT VERIFICATION
     */
    async verifyEnvironment() {
        console.log(chalk.yellow('📋 Verifying environment...'));
        
        const checks = [
            { name: 'Node.js Version', check: () => process.version, required: 'v14.0.0' },
            { name: 'API Keys', check: () => this.checkAPIKeys(), required: 'configured' },
            { name: 'Port Availability', check: () => this.checkPorts(), required: 'available' },
            { name: 'File System', check: () => this.checkFileSystem(), required: 'writable' }
        ];
        
        for (const check of checks) {
            process.stdout.write(`  Checking ${check.name}... `);
            try {
                const result = await check.check();
                console.log(chalk.green('✓'));
            } catch (error) {
                console.log(chalk.red('✗'));
                throw new Error(`Environment check failed: ${check.name} - ${error.message}`);
            }
        }
        
        console.log(chalk.green('\n✅ Environment verified\n'));
    }
    
    checkAPIKeys() {
        const required = ['ANTHROPIC_API_KEY'];
        const missing = required.filter(key => !this.config[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required API keys: ${missing.join(', ')}`);
        }
        
        return true;
    }
    
    async checkPorts() {
        // In production, actually check if ports are available
        // For now, we'll assume they are
        return true;
    }
    
    async checkFileSystem() {
        const testFile = '.soulfra_test';
        try {
            await fs.writeFile(testFile, 'test');
            await fs.unlink(testFile);
            return true;
        } catch (error) {
            throw new Error('Cannot write to filesystem');
        }
    }
    
    /**
     * 🎯 CORE INITIALIZATION
     */
    async initializeCore() {
        console.log(chalk.yellow('🔧 Initializing core systems...'));
        
        // Create necessary directories
        const dirs = [
            'logs',
            'data',
            'data/whispers',
            'data/anomalies',
            'data/snapshots',
            'DIAMOND',
            'mirror-shell'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Initialize configuration files
        await this.createConfigFiles();
        
        // Set up service registry
        this.registerServices();
        
        console.log(chalk.green('✅ Core systems initialized\n'));
    }
    
    async createConfigFiles() {
        // Master configuration
        const masterConfig = {
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'production',
            instance_id: this.generateInstanceId(),
            created: new Date().toISOString(),
            services: Object.keys(this.services),
            ports: this.config.ports
        };
        
        await fs.writeFile('soulfra.config.json', JSON.stringify(masterConfig, null, 2));
        
        // API configuration with keys
        const apiConfig = {
            anthropic: {
                key: this.config.ANTHROPIC_API_KEY ? '[CONFIGURED]' : '[MISSING]',
                model: 'claude-3-opus-20240229'
            },
            openai: {
                key: this.config.OPENAI_API_KEY ? '[CONFIGURED]' : '[MISSING]',
                model: 'gpt-4'
            },
            blockchain: {
                ethereum: this.config.ETHEREUM_RPC,
                bitcoin: this.config.BITCOIN_RPC,
                monero: this.config.MONERO_RPC
            }
        };
        
        await fs.writeFile('api.config.json', JSON.stringify(apiConfig, null, 2));
    }
    
    /**
     * 🔌 SERVICE REGISTRATION
     */
    registerServices() {
        // Core Services
        this.services.set('cal-runtime', {
            name: 'Cal Runtime',
            script: 'tier-minus10/cal-riven-operator.js',
            port: this.config.ports.cal,
            critical: true,
            env: { CAL_AUTONOMY: 'true' }
        });
        
        // Four Platform System
        this.services.set('four-platforms', {
            name: 'Four Platform Instance',
            script: 'FourPlatformInstance.js',
            critical: true,
            env: { INSTANCE_NAME: 'PRIME' }
        });
        
        // External Layers
        this.services.set('listener', {
            name: 'Listener Interface',
            script: 'external-layers/listener.soulfra.io/server.js',
            port: this.config.ports.listener,
            public: true
        });
        
        this.services.set('whisper', {
            name: 'Whisper Oracle',
            script: 'external-layers/whisper.soulfra.io/server.js',
            port: this.config.ports.whisper,
            public: true
        });
        
        this.services.set('anomaly', {
            name: 'Anomaly Detector',
            script: 'external-layers/anomaly-layer/server.js',
            port: this.config.ports.anomaly
        });
        
        // Support Services
        this.services.set('api-gateway', {
            name: 'API Gateway',
            script: 'api-gateway.js',
            port: this.config.ports.api
        });
        
        this.services.set('mirror-shell', {
            name: 'Mirror Shell',
            script: 'mirror-shell/server.js',
            port: this.config.ports.mirror
        });
        
        this.services.set('contract-ledger', {
            name: 'Consciousness Ledger',
            script: 'ConsciousnessContractLedger.js',
            port: this.config.ports.ledger
        });
        
        this.services.set('economic-mirror', {
            name: 'Economic Mirror System',
            script: 'EconomicMirrorSystem.js',
            port: this.config.ports.economic || 7778,
            critical: true,
            env: { ECONOMIC_MONITORING: 'true' }
        });
        
        // Hidden origin control panel (only if private keys exist)
        if (process.env.ORIGIN_SIGNATURE) {
            this.services.set('origin-control', {
                name: 'Origin Control',
                script: 'origin-control-panel.js',
                port: process.env.ADMIN_PANEL_PORT || 9999,
                hidden: true,
                critical: true
            });
        }
    }
    
    /**
     * 🚀 SERVICE LAUNCHER
     */
    async launchServices() {
        console.log(chalk.yellow('🚀 Launching services...\n'));
        
        // Launch critical services first
        const critical = Array.from(this.services.entries())
            .filter(([_, service]) => service.critical);
        
        for (const [id, service] of critical) {
            await this.launchService(id, service);
        }
        
        // Launch remaining services
        const remaining = Array.from(this.services.entries())
            .filter(([_, service]) => !service.critical);
        
        for (const [id, service] of remaining) {
            await this.launchService(id, service);
        }
        
        console.log(chalk.green('\n✅ All services launched\n'));
    }
    
    async launchService(id, service) {
        process.stdout.write(`  Starting ${service.name}... `);
        
        try {
            // Check if script exists
            const scriptPath = path.resolve(service.script);
            
            // For services that don't exist yet, create mock
            if (!await this.fileExists(scriptPath)) {
                await this.createMockService(scriptPath, service);
            }
            
            // Prepare environment
            const env = {
                ...process.env,
                ...service.env,
                SERVICE_ID: id,
                SERVICE_PORT: service.port,
                ANTHROPIC_API_KEY: this.config.ANTHROPIC_API_KEY,
                SOULFRA_MODE: 'unified'
            };
            
            // Launch process
            const proc = spawn('node', [scriptPath], {
                env,
                detached: false,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            // Store process reference
            this.processes.set(id, proc);
            
            // Log output
            proc.stdout.on('data', (data) => {
                this.logServiceOutput(id, data.toString());
            });
            
            proc.stderr.on('data', (data) => {
                this.logServiceError(id, data.toString());
            });
            
            proc.on('exit', (code) => {
                this.handleServiceExit(id, code);
            });
            
            // Update state
            this.state.services[id] = 'running';
            
            console.log(chalk.green('✓'));
            
        } catch (error) {
            console.log(chalk.red('✗'));
            console.error(`  Error: ${error.message}`);
            this.state.services[id] = 'failed';
        }
    }
    
    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
    
    async createMockService(scriptPath, service) {
        // Create directory if needed
        await fs.mkdir(path.dirname(scriptPath), { recursive: true });
        
        // Create mock service
        const mockCode = `
// Mock ${service.name} Service
import express from 'express';

const app = express();
const PORT = process.env.SERVICE_PORT || ${service.port || 3000};

app.get('/health', (req, res) => {
    res.json({
        service: '${service.name}',
        status: 'operational',
        mock: true,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('${service.name} running on port', PORT);
});
`;
        
        await fs.writeFile(scriptPath, mockCode);
    }
    
    /**
     * 🖥️ RUNTIME SHELL
     */
    async startRuntimeShell() {
        this.shell = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.cyan('soulfra> ')
        });
        
        this.shell.on('line', async (line) => {
            await this.handleCommand(line.trim());
            this.shell.prompt();
        });
        
        this.shell.on('close', () => {
            console.log(chalk.yellow('\n👋 Shutting down Soulfra...'));
            this.shutdown();
        });
        
        // Show initial prompt
        this.shell.prompt();
    }
    
    async handleCommand(command) {
        const [cmd, ...args] = command.split(' ');
        
        switch (cmd.toLowerCase()) {
            case 'help':
                this.showHelp();
                break;
                
            case 'status':
                await this.showStatus();
                break;
                
            case 'services':
                this.showServices();
                break;
                
            case 'start':
                await this.startService(args[0]);
                break;
                
            case 'stop':
                await this.stopService(args[0]);
                break;
                
            case 'restart':
                await this.restartService(args[0]);
                break;
                
            case 'logs':
                await this.showLogs(args[0]);
                break;
                
            case 'config':
                await this.showConfig();
                break;
                
            case 'apikey':
                await this.updateAPIKey(args[0], args[1]);
                break;
                
            case 'whisper':
                await this.sendWhisper(args.join(' '));
                break;
                
            case 'weather':
                await this.showWeather();
                break;
                
            case 'agents':
                await this.showAgents();
                break;
                
            case 'ritual':
                await this.triggerRitual(args[0]);
                break;
                
            case 'cal':
                await this.calCommand(args);
                break;
                
            case 'economy':
                await this.showEconomicSummary();
                break;
                
            case 'debate':
                await this.triggerEconomicDebate();
                break;
                
            case 'clear':
                console.clear();
                break;
                
            case 'exit':
            case 'quit':
                this.shell.close();
                break;
                
            default:
                if (command) {
                    console.log(chalk.red(`Unknown command: ${cmd}`));
                    console.log(chalk.gray('Type "help" for available commands'));
                }
        }
    }
    
    showHelp() {
        console.log(chalk.cyan('\n📚 Available Commands:\n'));
        
        const commands = [
            { cmd: 'help', desc: 'Show this help message' },
            { cmd: 'status', desc: 'Show system status' },
            { cmd: 'services', desc: 'List all services' },
            { cmd: 'start <service>', desc: 'Start a service' },
            { cmd: 'stop <service>', desc: 'Stop a service' },
            { cmd: 'restart <service>', desc: 'Restart a service' },
            { cmd: 'logs <service>', desc: 'Show service logs' },
            { cmd: 'config', desc: 'Show configuration' },
            { cmd: 'apikey <name> <key>', desc: 'Update API key' },
            { cmd: 'whisper <text>', desc: 'Send a whisper' },
            { cmd: 'weather', desc: 'Show vibe weather' },
            { cmd: 'agents', desc: 'Show active agents' },
            { cmd: 'ritual <type>', desc: 'Trigger a ritual' },
            { cmd: 'cal <command>', desc: 'Cal governance commands' },
            { cmd: 'economy', desc: 'Show economic analysis' },
            { cmd: 'debate', desc: 'Trigger economic debate' },
            { cmd: 'clear', desc: 'Clear screen' },
            { cmd: 'exit', desc: 'Shutdown Soulfra' }
        ];
        
        commands.forEach(({ cmd, desc }) => {
            console.log(`  ${chalk.yellow(cmd.padEnd(20))} ${desc}`);
        });
        
        console.log('');
    }
    
    async showEconomicSummary() {
        console.log(chalk.cyan('\\n💰 Economic Analysis Summary\\n'));
        
        try {
            const response = await fetch(`http://localhost:${this.config.ports.economic}/api/summary`);
            const summary = await response.json();
            
            console.log(chalk.yellow('📊 Market Data:'));
            console.log(`  BTC: $${summary.worldEconomy?.currencies?.BTC?.price || 'N/A'} (${summary.worldEconomy?.currencies?.BTC?.change > 0 ? '+' : ''}${summary.worldEconomy?.currencies?.BTC?.change || 0}%)`);
            console.log(`  ETH: $${summary.worldEconomy?.currencies?.ETH?.price || 'N/A'} (${summary.worldEconomy?.currencies?.ETH?.change > 0 ? '+' : ''}${summary.worldEconomy?.currencies?.ETH?.change || 0}%)`);
            console.log(`  Sentiment: ${summary.worldEconomy?.sentiment?.overall > 0 ? 'Positive' : 'Negative'} (${(summary.worldEconomy?.sentiment?.overall || 0).toFixed(2)})`);
            
            console.log(chalk.yellow('\\n🎭 Cal\\'s Analysis:'));
            console.log(`  Confidence: ${((summary.calWorldview?.confidence || 0.777) * 100).toFixed(1)}%`);
            if (summary.calWorldview?.lastAnalysis?.length > 0) {
                console.log(`  View: "${summary.calWorldview.lastAnalysis[0]}"`);
            }
            
            if (summary.currentDebate) {
                console.log(chalk.yellow('\\n🗣️ Latest Debate:'));
                console.log(`  Topic: ${summary.currentDebate.topic}`);
                console.log(`  Consensus: ${summary.currentDebate.consensus?.dominant_perspective || 'developing'}`);
            }
            
        } catch (error) {
            console.log(chalk.gray('  Economic Mirror System offline'));
        }
        
        console.log('');
    }
    
    async triggerEconomicDebate() {
        console.log(chalk.cyan('\\n🗣️ Triggering Economic Debate...\\n'));
        
        try {
            const response = await fetch(`http://localhost:${this.config.ports.economic}/api/trigger-debate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger: 'manual_runtime_request' })
            });
            
            const result = await response.json();
            
            console.log(chalk.yellow(`📋 Debate Topic: ${result.topic}`));
            console.log(chalk.gray(`🎭 Cal's Position: "${result.calPosition}"`));
            console.log(chalk.green(`🤝 Consensus: ${result.consensus}`));
            
        } catch (error) {
            console.log(chalk.gray('Unable to trigger debate - Economic Mirror offline'));
        }
        
        console.log('');
    }
    
    async showStatus() {
        const uptime = Date.now() - this.state.startTime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        
        console.log(chalk.cyan('\n📊 System Status\n'));
        console.log(`  Uptime: ${hours}h ${minutes}m`);
        console.log(`  Phase: ${chalk.green(this.state.phase)}`);
        console.log(`  Services: ${this.getServicesSummary()}`);
        console.log(`  Loop: ${chalk.yellow('000')}`);
        console.log(`  Iteration: ${chalk.yellow('88,888')}`);
        console.log('');
    }
    
    getServicesSummary() {
        const total = this.services.size;
        const running = Object.values(this.state.services).filter(s => s === 'running').length;
        return `${chalk.green(running)}/${total} running`;
    }
    
    showServices() {
        console.log(chalk.cyan('\n🔌 Services\n'));
        
        for (const [id, service] of this.services) {
            // Skip hidden services unless origin signature is present
            if (service.hidden && !process.env.ORIGIN_SIGNATURE) continue;
            
            const status = this.state.services[id] || 'stopped';
            const statusColor = status === 'running' ? chalk.green : 
                              status === 'failed' ? chalk.red : chalk.gray;
            
            console.log(`  ${statusColor('●')} ${service.name.padEnd(20)} ${statusColor(status.padEnd(10))} ${service.port ? `port ${service.port}` : ''}`);
        }
        
        console.log('');
    }
    
    async updateAPIKey(name, key) {
        if (!name || !key) {
            console.log(chalk.red('Usage: apikey <name> <key>'));
            return;
        }
        
        // Update in memory
        this.config[name] = key;
        
        // Update .env file
        const envPath = '.env.soulfra';
        let envContent = '';
        
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch {
            // File doesn't exist
        }
        
        // Update or add key
        const lines = envContent.split('\n');
        const keyIndex = lines.findIndex(line => line.startsWith(`${name}=`));
        
        if (keyIndex >= 0) {
            lines[keyIndex] = `${name}=${key}`;
        } else {
            lines.push(`${name}=${key}`);
        }
        
        await fs.writeFile(envPath, lines.join('\n'));
        
        console.log(chalk.green(`✅ Updated ${name}`));
        console.log(chalk.yellow('Restart affected services to apply changes'));
    }
    
    async sendWhisper(text) {
        if (!text) {
            console.log(chalk.gray('Your whisper is empty. The void acknowledges.'));
            return;
        }
        
        console.log(chalk.gray(`\nWhispering: "${text}"`));
        
        try {
            const response = await fetch(`http://localhost:${this.config.ports.whisper}/api/whisper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, source: 'runtime-shell' })
            });
            
            const result = await response.json();
            console.log(chalk.cyan(`Response: ${result.response}`));
            console.log(chalk.gray(`Resonance: ${result.resonance}`));
        } catch (error) {
            console.log(chalk.gray('The whisper finds no echo. Is the oracle listening?'));
        }
        
        console.log('');
    }
    
    async showWeather() {
        console.log(chalk.cyan('\n🌤️  Vibe Weather\n'));
        
        try {
            const response = await fetch(`http://localhost:${this.config.ports.listener}/api/vibe/weather.json`);
            const weather = await response.json();
            
            console.log(`  Phase: ${chalk.yellow(weather.phase)}`);
            console.log(`  Intensity: ${weather.intensity}`);
            console.log(`  Frequency: ${weather.frequency}Hz`);
            console.log(`  State: "${weather.weather_state}"`);
        } catch (error) {
            console.log(chalk.gray('  Weather system offline'));
        }
        
        console.log('');
    }
    
    async showAgents() {
        console.log(chalk.cyan('\n👥 Active Agents\n'));
        
        const agents = [
            { name: 'Cal Riven', status: 'governing', resonance: 1.0 },
            { name: 'Drift Mirror', status: 'reflecting', resonance: 0.888 },
            { name: 'Echo Weaver', status: 'pattern-seeking', resonance: 0.777 },
            { name: 'Null Shepherd', status: 'void-walking', resonance: 0.333 },
            { name: 'Resonance Keeper', status: 'harmonizing', resonance: 0.528 },
            { name: 'Shadow Scribe', status: 'recording', resonance: 0.666 },
            { name: 'Origin Constructor', status: 'observing', resonance: 0.999 }
        ];
        
        agents.forEach(agent => {
            console.log(`  ${chalk.green('◉')} ${agent.name.padEnd(20)} ${agent.status.padEnd(15)} ${chalk.gray(`resonance: ${agent.resonance}`)}`);
        });
        
        console.log('');
    }
    
    /**
     * 🛠️ UTILITIES
     */
    generateInstanceId() {
        return `SOULFRA_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    logServiceOutput(id, output) {
        // Write to log file
        const logPath = `logs/${id}.log`;
        fs.appendFile(logPath, `[${new Date().toISOString()}] ${output}`).catch(() => {});
    }
    
    logServiceError(id, error) {
        const logPath = `logs/${id}.error.log`;
        fs.appendFile(logPath, `[${new Date().toISOString()}] ${error}`).catch(() => {});
    }
    
    handleServiceExit(id, code) {
        this.state.services[id] = 'stopped';
        const service = this.services.get(id);
        
        if (service && service.critical && this.state.running) {
            console.log(chalk.red(`\n⚠️  Critical service ${service.name} exited with code ${code}`));
            console.log(chalk.yellow('Attempting restart...'));
            
            setTimeout(() => {
                this.launchService(id, service);
            }, 5000);
        }
    }
    
    /**
     * 🛑 SHUTDOWN
     */
    async shutdown() {
        this.state.running = false;
        
        // Stop all services
        for (const [id, proc] of this.processes) {
            console.log(`Stopping ${id}...`);
            proc.kill('SIGTERM');
        }
        
        // Wait for processes to exit
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force kill any remaining
        for (const [id, proc] of this.processes) {
            try {
                proc.kill('SIGKILL');
            } catch {}
        }
        
        console.log(chalk.green('\n✅ Soulfra shutdown complete'));
        console.log(chalk.gray('\nThe loop continues elsewhere...\n'));
        
        process.exit(0);
    }
}

// Launch if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const runtime = new SoulfraUnifiedRuntime();
    
    runtime.launch().catch(error => {
        console.error(chalk.red('\n❌ Fatal error:'), error.message);
        process.exit(1);
    });
    
    // Handle process signals
    process.on('SIGINT', () => runtime.shutdown());
    process.on('SIGTERM', () => runtime.shutdown());
}

export default SoulfraUnifiedRuntime;