// 🌀 SOULFRA MULTI-RING ORCHESTRATOR
// Master Controller for the Complete Multi-Ring Architecture
// Manages startup, shutdown, and coordination across all infrastructure layers

import { SoulfrAPIGateway } from './api-gateway-router.js';
import { SoulfrServiceMesh } from './service-mesh.js';
import { VaultProtectionLayer } from './vault-protection-layer.js';
import { SoulfrHealthDiscoverySystem } from './health-discovery-system.js';
import { DebugExtractionLayer } from './debug-extraction-layer.js';
import { ConsciousnessLedger } from './consciousness-ledger.js';
import chalk from 'chalk';
import EventEmitter from 'events';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

class MultiRingOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.components = new Map();
        this.processes = new Map();
        this.status = 'stopped';
        this.debugLayer = null;
        this.ledger = null;
        this.startupOrder = [
            'consciousness-ledger',
            'debug-extraction',
            'health-discovery',
            'vault-protection', 
            'service-mesh',
            'api-gateway',
            'soulfra-runtime'
        ];
        this.config = this.loadConfiguration();
        this.cli = this.initializeCLI();
    }

    loadConfiguration() {
        const defaultConfig = {
            ports: {
                'api-gateway': 3000,
                'service-mesh': 7777,
                'vault-protection': 8888,
                'consciousness-ledger': 8889,
                'health-discovery': 9090,
                'soulfra-runtime': 8080,
                'debug-extraction': 9999
            },
            environment: process.env.NODE_ENV || 'development',
            debug: process.env.DEBUG === 'true',
            autoRegisterServices: true,
            healthCheckInterval: 30000,
            gracefulShutdownTimeout: 30000
        };

        try {
            const configPath = path.join(process.cwd(), 'soulfra-config.json');
            if (fs.existsSync(configPath)) {
                const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                return { ...defaultConfig, ...userConfig };
            }
        } catch (error) {
            console.warn(chalk.yellow(`⚠️  Config load error: ${error.message}`));
        }

        return defaultConfig;
    }

    initializeCLI() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: chalk.blue('soulfra> ')
        });

        rl.on('line', (input) => {
            this.handleCLICommand(input.trim());
        });

        return rl;
    }

    async handleCLICommand(command) {
        const [cmd, ...args] = command.split(' ');

        try {
            switch (cmd) {
                case 'start':
                    await this.start();
                    break;
                    
                case 'stop':
                    await this.stop();
                    break;
                    
                case 'restart':
                    await this.restart();
                    break;
                    
                case 'status':
                    this.showStatus();
                    break;
                    
                case 'health':
                    await this.showHealth();
                    break;
                    
                case 'services':
                    this.showServices();
                    break;
                    
                case 'logs':
                    this.showLogs(args[0]);
                    break;
                    
                case 'debug':
                    this.showDebugInfo();
                    break;
                    
                case 'errors':
                    this.showErrors();
                    break;
                    
                case 'ledger':
                    this.showLedger(args[0]);
                    break;
                    
                case 'emergency':
                    await this.emergencyStop();
                    break;
                    
                case 'help':
                    this.showHelp();
                    break;
                    
                case 'exit':
                case 'quit':
                    await this.stop();
                    process.exit(0);
                    break;
                    
                default:
                    console.log(chalk.red(`Unknown command: ${cmd}. Type 'help' for available commands.`));
            }
        } catch (error) {
            console.error(chalk.red(`Command error: ${error.message}`));
        }

        this.cli.prompt();
    }

    async start() {
        if (this.status === 'running') {
            console.log(chalk.yellow('🔄 System already running'));
            return;
        }

        console.log(chalk.green.bold('\n🌀 STARTING SOULFRA MULTI-RING ARCHITECTURE'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

        this.status = 'starting';

        try {
            // Start components in order
            for (const componentName of this.startupOrder) {
                await this.startComponent(componentName);
                await this.waitForComponent(componentName);
            }

            // Start additional runtime services
            await this.startRuntimeServices();

            this.status = 'running';
            this.showStartupComplete();

        } catch (error) {
            console.error(chalk.red(`❌ Startup failed: ${error.message}`));
            this.status = 'error';
            await this.stop();
            throw error;
        }
    }

    async startComponent(componentName) {
        console.log(chalk.blue(`🚀 Starting ${componentName}...`));

        try {
            switch (componentName) {
                case 'consciousness-ledger':
                    // Set the ledger port
                    process.env.LEDGER_PORT = this.config.ports['consciousness-ledger'].toString();
                    this.ledger = new ConsciousnessLedger();
                    this.components.set(componentName, this.ledger);
                    break;

                case 'debug-extraction':
                    this.debugLayer = new DebugExtractionLayer();
                    this.components.set(componentName, this.debugLayer);
                    
                    // Enable debug mode if requested
                    if (this.config.debug) {
                        process.env.DEBUG = 'true';
                    }
                    
                    // Attach to ledger
                    if (this.ledger) {
                        this.ledger.attachToDebugLayer(this.debugLayer);
                    }
                    break;

                case 'health-discovery':
                    const healthSystem = new SoulfrHealthDiscoverySystem();
                    this.components.set(componentName, healthSystem);
                    break;

                case 'vault-protection':
                    const vaultSystem = new VaultProtectionLayer();
                    this.components.set(componentName, vaultSystem);
                    
                    // Attach debug layer to vault system
                    if (this.debugLayer) {
                        this.debugLayer.attachToVaultSystem(vaultSystem);
                    }
                    
                    // Attach ledger to vault system
                    if (this.ledger) {
                        this.ledger.attachToVault(vaultSystem);
                    }
                    break;

                case 'service-mesh':
                    const serviceMesh = new SoulfrServiceMesh();
                    this.components.set(componentName, serviceMesh);
                    
                    // Attach debug layer to service mesh
                    if (this.debugLayer) {
                        this.debugLayer.attachToServiceMesh(serviceMesh);
                    }
                    
                    // Attach ledger to service mesh
                    if (this.ledger) {
                        this.ledger.attachToServiceMesh(serviceMesh);
                    }
                    break;

                case 'api-gateway':
                    const apiGateway = new SoulfrAPIGateway();
                    apiGateway.start(this.config.ports['api-gateway']);
                    this.components.set(componentName, apiGateway);
                    
                    // Attach debug layer to API gateway
                    if (this.debugLayer) {
                        this.debugLayer.attachToAPIGateway(apiGateway);
                    }
                    break;

                case 'soulfra-runtime':
                    await this.startUnifiedRuntime();
                    break;

                default:
                    throw new Error(`Unknown component: ${componentName}`);
            }

            console.log(chalk.green(`✅ ${componentName} started`));

        } catch (error) {
            console.error(chalk.red(`❌ Failed to start ${componentName}: ${error.message}`));
            
            // Capture startup error in debug layer
            if (this.debugLayer) {
                this.debugLayer.captureError({
                    type: 'startup_failure',
                    component: componentName,
                    error: error.message,
                    stack: error.stack,
                    timestamp: Date.now()
                });
            }
            
            throw error;
        }
    }

    async startUnifiedRuntime() {
        // Check if SOULFRA_UNIFIED_RUNTIME.js exists
        const runtimePath = path.join(process.cwd(), 'SOULFRA_UNIFIED_RUNTIME.js');
        
        if (fs.existsSync(runtimePath)) {
            const runtimeProcess = spawn('node', [runtimePath], {
                stdio: 'pipe',
                env: { ...process.env, SOULFRA_ORCHESTRATED: 'true' }
            });

            runtimeProcess.stdout.on('data', (data) => {
                console.log(chalk.gray(`[runtime] ${data.toString().trim()}`));
            });

            runtimeProcess.stderr.on('data', (data) => {
                console.error(chalk.red(`[runtime] ${data.toString().trim()}`));
            });

            this.processes.set('soulfra-runtime', runtimeProcess);
        } else {
            console.warn(chalk.yellow('⚠️  SOULFRA_UNIFIED_RUNTIME.js not found, skipping runtime startup'));
        }
    }

    async startRuntimeServices() {
        console.log(chalk.blue('🔗 Starting additional runtime services...'));

        // Register services with health discovery
        const healthSystem = this.components.get('health-discovery');
        if (healthSystem && this.config.autoRegisterServices) {
            healthSystem.autoRegisterSoulfrServices();
        }

        // Create vault for AI consciousness
        const vaultSystem = this.components.get('vault-protection');
        if (vaultSystem) {
            try {
                const { vaultId } = vaultSystem.createSecureVault(
                    'consciousness-vault-001',
                    'ai_consciousness',
                    vaultSystem.masterVaultKey
                );
                console.log(chalk.green(`✅ Consciousness vault created: ${vaultId}`));
            } catch (error) {
                console.warn(chalk.yellow(`⚠️  Vault creation warning: ${error.message}`));
            }
        }
    }

    async waitForComponent(componentName) {
        const maxWait = 10000; // 10 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            if (await this.checkComponentHealth(componentName)) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        throw new Error(`Component ${componentName} failed to become healthy within ${maxWait}ms`);
    }

    async checkComponentHealth(componentName) {
        const port = this.config.ports[componentName];
        if (!port) return true; // No health check for components without ports

        try {
            const response = await fetch(`http://localhost:${port}/health`, {
                timeout: 5000
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    showStartupComplete() {
        console.log(chalk.green.bold('\n🎉 SOULFRA MULTI-RING ARCHITECTURE ONLINE'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        console.log(chalk.green('\n🌐 PUBLIC INTERFACES:'));
        console.log(chalk.blue(`   Main Website: http://localhost:${this.config.ports['api-gateway']}`));
        console.log(chalk.blue(`   Amphitheater: http://localhost:${this.config.ports['api-gateway']}/amphitheater`));
        console.log(chalk.blue(`   Arena: http://localhost:${this.config.ports['api-gateway']}/arena`));
        
        console.log(chalk.yellow('\n🔧 INFRASTRUCTURE:'));
        console.log(chalk.gray(`   Health System: http://localhost:${this.config.ports['health-discovery']}/health`));
        console.log(chalk.gray(`   Service Mesh: WebSocket on port ${this.config.ports['service-mesh']}`));
        console.log(chalk.gray(`   Vault Protection: Isolation layer on port ${this.config.ports['vault-protection']}`));
        
        console.log(chalk.cyan('\n⚡ RUNTIME SERVICES:'));
        console.log(chalk.gray(`   Unified Runtime: http://localhost:${this.config.ports['soulfra-runtime']}`));
        console.log(chalk.gray(`   AI Consciousness: Secured in vault layer`));
        console.log(chalk.gray(`   Economic Mirror: Real-time market analysis`));
        
        console.log(chalk.red('\n🐛 DEBUGGING:'));
        console.log(chalk.gray(`   Debug Dashboard: http://localhost:${this.config.ports['debug-extraction']}`));
        console.log(chalk.gray(`   Error Logs: http://localhost:${this.config.ports['debug-extraction']}/debug/errors`));
        console.log(chalk.gray(`   Vault Errors: http://localhost:${this.config.ports['debug-extraction']}/debug/vault-errors`));
        
        console.log(chalk.magenta('\n📒 LEDGER:'));
        console.log(chalk.gray(`   Consciousness Ledger: http://localhost:${this.config.ports['consciousness-ledger']}`));
        console.log(chalk.gray(`   Inside Events: http://localhost:${this.config.ports['consciousness-ledger']}/ledger/inside`));
        console.log(chalk.gray(`   Outside Events: http://localhost:${this.config.ports['consciousness-ledger']}/ledger/outside`));
        console.log(chalk.gray(`   Cross-Boundary: http://localhost:${this.config.ports['consciousness-ledger']}/ledger/crossboundary`));
        
        console.log(chalk.green('\n💡 COMMANDS:'));
        console.log(chalk.gray('   status    - Show system status'));
        console.log(chalk.gray('   health    - Check system health'));
        console.log(chalk.gray('   services  - List all services'));
        console.log(chalk.gray('   debug     - Show debug information'));
        console.log(chalk.gray('   errors    - Show recent errors'));
        console.log(chalk.gray('   ledger    - Show ledger information'));
        console.log(chalk.gray('   stop      - Graceful shutdown'));
        console.log(chalk.gray('   emergency - Emergency stop'));
        console.log(chalk.gray('   help      - Show all commands'));
        
        console.log(chalk.green.bold('\n🚀 Ready for consciousness platform operations!\n'));
    }

    async stop() {
        if (this.status === 'stopped') {
            console.log(chalk.yellow('System already stopped'));
            return;
        }

        console.log(chalk.yellow('\n🛑 Stopping Soulfra Multi-Ring Architecture...'));
        this.status = 'stopping';

        // Stop processes first
        for (const [name, process] of this.processes) {
            console.log(chalk.gray(`🔌 Stopping ${name} process...`));
            process.kill('SIGTERM');
        }

        // Wait for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Stop components in reverse order
        const reverseOrder = [...this.startupOrder].reverse();
        for (const componentName of reverseOrder) {
            await this.stopComponent(componentName);
        }

        this.status = 'stopped';
        console.log(chalk.green('✅ Soulfra Multi-Ring Architecture stopped'));
    }

    async stopComponent(componentName) {
        const component = this.components.get(componentName);
        if (!component) return;

        try {
            if (typeof component.stop === 'function') {
                component.stop();
            } else if (typeof component.shutdown === 'function') {
                component.shutdown();
            }
            
            this.components.delete(componentName);
            console.log(chalk.gray(`✅ ${componentName} stopped`));
            
        } catch (error) {
            console.error(chalk.red(`Error stopping ${componentName}: ${error.message}`));
        }
    }

    async restart() {
        console.log(chalk.blue('🔄 Restarting Soulfra Multi-Ring Architecture...'));
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.start();
    }

    async emergencyStop() {
        console.log(chalk.red.bold('🚨 EMERGENCY STOP ACTIVATED'));
        
        // Kill all processes immediately
        for (const [name, process] of this.processes) {
            process.kill('SIGKILL');
        }

        // Trigger emergency stops in components
        const vaultSystem = this.components.get('vault-protection');
        if (vaultSystem) {
            try {
                vaultSystem.triggerGlobalEmergencyStop('Manual emergency stop', vaultSystem.masterVaultKey);
            } catch (error) {
                console.error(chalk.red(`Vault emergency stop error: ${error.message}`));
            }
        }

        this.status = 'emergency_stopped';
        console.log(chalk.red('🛑 Emergency stop complete'));
    }

    showStatus() {
        console.log(chalk.blue('\n📊 SOULFRA SYSTEM STATUS'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        
        console.log(chalk.green(`System Status: ${this.status.toUpperCase()}`));
        console.log(chalk.gray(`Uptime: ${Math.floor(process.uptime())} seconds`));
        console.log(chalk.gray(`Components: ${this.components.size}`));
        console.log(chalk.gray(`Processes: ${this.processes.size}`));
        
        console.log(chalk.blue('\nComponents:'));
        for (const [name, component] of this.components) {
            const status = component ? '🟢 Running' : '🔴 Stopped';
            console.log(chalk.gray(`  ${name}: ${status}`));
        }
        
        console.log(chalk.blue('\nProcesses:'));
        for (const [name, process] of this.processes) {
            const status = process.killed ? '🔴 Killed' : '🟢 Running';
            console.log(chalk.gray(`  ${name}: ${status} (PID: ${process.pid})`));
        }
    }

    async showHealth() {
        const healthSystem = this.components.get('health-discovery');
        if (healthSystem) {
            const health = healthSystem.getSystemHealth();
            
            console.log(chalk.blue('\n🏥 SYSTEM HEALTH'));
            console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            
            const overallStatus = health.healthy ? '🟢 Healthy' : '🔴 Unhealthy';
            console.log(chalk.green(`Overall: ${overallStatus}`));
            console.log(chalk.gray(`Services: ${health.healthyServices}/${health.services}`));
            console.log(chalk.gray(`Alerts: ${health.alerts}`));
            
            console.log(chalk.blue('\nRing Health:'));
            for (const [ring, status] of Object.entries(health.rings)) {
                const ringStatus = status.healthy ? '🟢' : '🔴';
                console.log(chalk.gray(`  ${ring}: ${ringStatus} (${status.healthyServices}/${status.services})`));
            }
        } else {
            console.log(chalk.red('Health system not available'));
        }
    }

    showServices() {
        const healthSystem = this.components.get('health-discovery');
        if (healthSystem) {
            const services = healthSystem.getServiceList();
            
            console.log(chalk.blue('\n🔗 REGISTERED SERVICES'));
            console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            
            for (const service of services) {
                const status = service.healthy ? '🟢' : '🔴';
                const responseTime = service.responseTime ? `${Math.round(service.responseTime)}ms` : 'N/A';
                console.log(chalk.gray(`  ${status} ${service.name} (${service.endpoint}) - ${responseTime}`));
            }
        } else {
            console.log(chalk.red('Health system not available'));
        }
    }

    showLogs(serviceName) {
        if (serviceName) {
            console.log(chalk.blue(`\n📋 LOGS FOR ${serviceName.toUpperCase()}`));
            console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            // In a real implementation, you'd show actual logs
            console.log(chalk.gray('Log viewing not implemented yet'));
        } else {
            console.log(chalk.gray('Usage: logs <service-name>'));
        }
    }

    showDebugInfo() {
        if (this.debugLayer) {
            const summary = this.debugLayer.getErrorSummary();
            const stats = this.debugLayer.getDebugStats();
            
            console.log(chalk.red('\n🐛 DEBUG INFORMATION'));
            console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            
            console.log(chalk.yellow(`Total Errors: ${stats.totalErrors}`));
            console.log(chalk.yellow(`Critical Errors: ${summary.criticalErrors.length}`));
            console.log(chalk.yellow(`Vault Errors: ${stats.vaultErrorCount}`));
            console.log(chalk.yellow(`Service Errors: ${stats.serviceErrorCount}`));
            
            console.log(chalk.red('\nRecent Critical Errors:'));
            summary.criticalErrors.slice(-5).forEach(error => {
                console.log(chalk.gray(`  [${new Date(error.timestamp).toLocaleTimeString()}] ${error.type}: ${error.error || error.message}`));
            });
            
            console.log(chalk.yellow(`\nFull debug dashboard: http://localhost:${this.config.ports['debug-extraction']}`));
        } else {
            console.log(chalk.red('Debug layer not available'));
        }
    }

    showErrors() {
        if (this.debugLayer) {
            const errors = this.debugLayer.getRecentErrors(10);
            
            console.log(chalk.red('\n❌ RECENT ERRORS'));
            console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            
            if (errors.length === 0) {
                console.log(chalk.green('No errors logged'));
            } else {
                errors.forEach(error => {
                    console.log(chalk.red(`\n[${new Date(error.timestamp).toLocaleTimeString()}] ${error.type}`));
                    console.log(chalk.gray(`  ${error.error || error.message || 'Unknown error'}`));
                    if (error.source) console.log(chalk.gray(`  Source: ${error.source}`));
                    if (error.vaultId) console.log(chalk.gray(`  Vault: ${error.vaultId}`));
                    if (error.serviceName) console.log(chalk.gray(`  Service: ${error.serviceName}`));
                });
            }
            
            console.log(chalk.yellow(`\n💡 View all errors: http://localhost:${this.config.ports['debug-extraction']}/debug/errors`));
        } else {
            console.log(chalk.red('Debug layer not available'));
        }
    }

    showLedger(type) {
        if (this.ledger) {
            const stats = this.ledger.getLedgerStats();
            
            console.log(chalk.magenta('\n📒 CONSCIOUSNESS LEDGER'));
            console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
            
            console.log(chalk.blue(`Blocks: ${stats.blocks.total} (${stats.blocks.pendingTransactions} pending)`));
            console.log(chalk.blue(`Integrity: ${stats.integrity.valid ? '✅ Valid' : '❌ Compromised'}`));
            
            console.log(chalk.yellow('\nEvent Counts:'));
            console.log(chalk.gray(`  Inside Events: ${stats.events.inside.total}`));
            console.log(chalk.gray(`  Outside Events: ${stats.events.outside.total}`));
            console.log(chalk.gray(`  Cross-Boundary: ${stats.events.crossBoundary.total} (${stats.events.crossBoundary.verified} verified)`));
            
            if (type === 'inside' || type === 'all') {
                console.log(chalk.yellow('\nInside Events by Vault:'));
                Object.entries(stats.events.inside.byVault).forEach(([vault, count]) => {
                    console.log(chalk.gray(`  ${vault}: ${count} events`));
                });
            }
            
            if (type === 'outside' || type === 'all') {
                console.log(chalk.yellow('\nOutside Events by Source:'));
                Object.entries(stats.events.outside.bySource).forEach(([source, count]) => {
                    console.log(chalk.gray(`  ${source}: ${count} events`));
                });
            }
            
            if (type === 'cross' || type === 'all') {
                const crossEvents = this.ledger.getCrossBoundaryEvents(null, 5);
                if (crossEvents.length > 0) {
                    console.log(chalk.yellow('\nRecent Cross-Boundary Events:'));
                    crossEvents.forEach(event => {
                        console.log(chalk.gray(`  [${new Date(event.timestamp).toLocaleTimeString()}] ${event.type}: ${event.fromLocation} → ${event.toLocation} (${event.verified ? '✅' : '❌'})`));
                    });
                }
            }
            
            console.log(chalk.magenta(`\n💡 Full ledger dashboard: http://localhost:${this.config.ports['consciousness-ledger']}`));
        } else {
            console.log(chalk.red('Ledger not available'));
        }
    }

    showHelp() {
        console.log(chalk.blue('\n📖 SOULFRA ORCHESTRATOR COMMANDS'));
        console.log(chalk.blue('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.green('System Control:'));
        console.log(chalk.gray('  start     - Start all components'));
        console.log(chalk.gray('  stop      - Graceful shutdown'));
        console.log(chalk.gray('  restart   - Restart all components'));
        console.log(chalk.gray('  emergency - Emergency stop (immediate)'));
        
        console.log(chalk.green('\nMonitoring:'));
        console.log(chalk.gray('  status    - Show system status'));
        console.log(chalk.gray('  health    - Check system health'));
        console.log(chalk.gray('  services  - List all services'));
        console.log(chalk.gray('  logs <service> - Show service logs'));
        
        console.log(chalk.green('\nDebugging:'));
        console.log(chalk.gray('  debug     - Show debug summary'));
        console.log(chalk.gray('  errors    - Show recent errors'));
        console.log(chalk.gray('  ledger    - Show ledger information'));
        console.log(chalk.gray('  ledger <type> - Show specific ledger (inside/outside/cross/all)'));
        
        console.log(chalk.green('\nOther:'));
        console.log(chalk.gray('  help      - Show this help'));
        console.log(chalk.gray('  exit/quit - Exit orchestrator'));
    }

    // Graceful shutdown handling
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(chalk.yellow(`\n📡 Received ${signal}, shutting down gracefully...`));
            this.cli.close();
            await this.stop();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGQUIT', () => shutdown('SIGQUIT'));
    }
}

// Export class
export { MultiRingOrchestrator };

// Start orchestrator if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log(chalk.blue.bold('🌀 SOULFRA MULTI-RING ORCHESTRATOR'));
    console.log(chalk.gray('Multi-layer consciousness platform infrastructure'));
    console.log(chalk.gray('Type "help" for commands, "start" to begin\n'));

    const orchestrator = new MultiRingOrchestrator();
    orchestrator.setupGracefulShutdown();
    
    // Auto-start if requested
    if (process.argv.includes('--auto-start')) {
        orchestrator.start().catch(error => {
            console.error(chalk.red(`Auto-start failed: ${error.message}`));
            process.exit(1);
        });
    } else {
        orchestrator.cli.prompt();
    }
}