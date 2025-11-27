#!/usr/bin/env node

/**
 * Simple Service Launcher - Decentralized Service Management
 * 
 * Starts services individually and writes status to files for monitoring
 * Each service runs independently with its own error handling
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SimpleLauncher {
    constructor() {
        this.services = [
            {
                name: 'Infinity Router',
                script: 'infinity-router-server.js',
                port: 5050,
                essential: true
            },
            {
                name: 'Cal Interface', 
                script: 'runtime/riven-cli-server.js',
                port: 4040,
                essential: true
            },
            {
                name: 'Semantic API',
                script: 'semantic-graph/semantic_api_router.js', 
                port: 3666,
                essential: true
            },
            {
                name: 'Main Dashboard',
                script: 'server.js',
                port: 3000,
                essential: false
            }
        ];
        
        this.processes = new Map();
        this.statusFile = './launcher-status.json';
    }
    
    async startService(service) {
        return new Promise((resolve) => {
            console.log(`🚀 Starting ${service.name}...`);
            
            const childProcess = spawn('node', [service.script], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: __dirname,
                env: { ...process.env, SERVICE_NAME: service.name }
            });
            
            let hasStarted = false;
            const startTimeout = setTimeout(() => {
                if (!hasStarted) {
                    console.log(`⚠️  ${service.name}: Startup timeout`);
                    resolve(false);
                }
            }, 10000);
            
            childProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`📡 ${service.name}: ${output.trim()}`);
                
                // Look for startup indicators
                if (!hasStarted && (
                    output.includes('running') || 
                    output.includes('listening') ||
                    output.includes('started') ||
                    output.includes(`port ${service.port}`)
                )) {
                    hasStarted = true;
                    clearTimeout(startTimeout);
                    console.log(`✅ ${service.name} started successfully`);
                    resolve(true);
                }
            });
            
            childProcess.stderr.on('data', (data) => {
                const error = data.toString();
                console.log(`❌ ${service.name} ERROR: ${error.trim()}`);
                if (!hasStarted) {
                    clearTimeout(startTimeout);
                    resolve(false);
                }
            });
            
            childProcess.on('exit', (code) => {
                console.log(`🛑 ${service.name} exited with code ${code}`);
                this.processes.delete(service.name);
                this.updateStatus();
            });
            
            childProcess.on('error', (error) => {
                console.log(`❌ ${service.name} spawn error: ${error.message}`);
                if (!hasStarted) {
                    clearTimeout(startTimeout);
                    resolve(false);
                }
            });
            
            this.processes.set(service.name, {
                process: childProcess,
                service,
                startTime: new Date().toISOString(),
                status: 'starting'
            });
        });
    }
    
    async updateStatus() {
        const status = {
            timestamp: new Date().toISOString(),
            services: Array.from(this.processes.entries()).map(([name, proc]) => ({
                name,
                port: proc.service.port,
                status: proc.status,
                startTime: proc.startTime,
                pid: proc.process.pid
            }))
        };
        
        await fs.writeFile(this.statusFile, JSON.stringify(status, null, 2));
    }
    
    async startAll() {
        console.log('🚀 Simple Service Launcher Starting...');
        console.log(`📊 Launching ${this.services.length} services`);
        
        for (const service of this.services) {
            const started = await this.startService(service);
            
            if (started) {
                const proc = this.processes.get(service.name);
                if (proc) proc.status = 'running';
            } else {
                console.log(`❌ Failed to start ${service.name}`);
                if (service.essential) {
                    console.log(`⚠️  ${service.name} is essential - continuing anyway`);
                }
            }
            
            await this.updateStatus();
            
            // Wait between service starts
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n🎉 Service launch sequence complete!');
        console.log('📋 Check launcher-status.json for current status');
        console.log('🔍 Run "node health-monitor.js" to monitor health');
        
        // Generate initial status report
        await this.generateReport();
        
        // Keep process alive
        setInterval(() => {
            this.updateStatus();
        }, 30000);
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down services...');
            for (const [name, proc] of this.processes.entries()) {
                console.log(`🛑 Stopping ${name}...`);
                proc.process.kill('SIGTERM');
            }
            process.exit(0);
        });
    }
    
    async generateReport() {
        const processes = Array.from(this.processes.values());
        const running = processes.filter(p => p.status === 'running');
        
        const report = `# Soulfra Simple Launcher Status

## Services (${running.length}/${processes.length} running)

${processes.map(proc => {
    const emoji = proc.status === 'running' ? '✅' : '❌';
    return `- ${emoji} **${proc.service.name}** (port ${proc.service.port}): ${proc.status}`;
}).join('\n')}

## Quick Access
${running.map(proc => 
    `- [${proc.service.name}](http://localhost:${proc.service.port})`
).join('\n')}

## Next Steps
1. Run \`node health-monitor.js\` to start continuous monitoring
2. Check individual service logs above for any errors
3. Access services through the URLs listed above

---
Generated: ${new Date().toISOString()}`;

        await fs.writeFile('./launcher-report.md', report);
        console.log('📋 Launcher report: launcher-report.md');
    }
}

if (require.main === module) {
    const launcher = new SimpleLauncher();
    launcher.startAll().catch(console.error);
}

module.exports = SimpleLauncher;