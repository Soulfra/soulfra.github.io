#!/usr/bin/env node
/**
 * System Diagnostic Tool
 * Comprehensive check of Soulfra platform health and issues
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemDiagnostic {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            system: {},
            files: {},
            services: {},
            errors: [],
            warnings: [],
            recommendations: []
        };
    }
    
    async run() {
        console.log('🔍 Soulfra System Diagnostic');
        console.log('============================\n');
        
        await this.checkSystemInfo();
        await this.checkFileStructure();
        await this.checkDependencies();
        await this.checkServices();
        await this.checkDataIntegrity();
        await this.generateReport();
    }
    
    async checkSystemInfo() {
        console.log('📊 System Information:');
        
        this.results.system = {
            node_version: process.version,
            platform: process.platform,
            architecture: process.arch,
            memory: {
                total_mb: Math.round(require('os').totalmem() / 1024 / 1024),
                free_mb: Math.round(require('os').freemem() / 1024 / 1024)
            },
            cpu_count: require('os').cpus().length,
            uptime_hours: Math.round(require('os').uptime() / 3600)
        };
        
        console.log(`  Node.js: ${this.results.system.node_version}`);
        console.log(`  Platform: ${this.results.system.platform} (${this.results.system.architecture})`);
        console.log(`  Memory: ${this.results.system.memory.free_mb}MB free of ${this.results.system.memory.total_mb}MB`);
        console.log(`  CPUs: ${this.results.system.cpu_count}`);
    }
    
    async checkFileStructure() {
        console.log('\n📁 File Structure Check:');
        
        const requiredDirs = [
            'memory',
            'heartbeat',
            'logs',
            'pids',
            'config',
            'loop/active',
            'loop/staging',
            'agents/suggestions',
            'mirror-shell',
            'mirror-shell/components'
        ];
        
        const requiredFiles = [
            'unified-soulfra-server.js',
            'LocalLoopMemoryDaemon.js',
            'JSONCleanRenderDaemon.js',
            'LoopHeartbeatWatcher.js',
            'StartupBlessVerifier.js',
            'soulfra-production-launch.sh',
            'mirror-shell/index.html',
            'mirror-shell/debug.html',
            'mirror-shell/logs.html',
            'mirror-shell/status.html'
        ];
        
        // Check directories
        for (const dir of requiredDirs) {
            const exists = await this.checkPath(dir);
            if (!exists) {
                console.log(`  ❌ Missing directory: ${dir}`);
                this.results.errors.push(`Missing directory: ${dir}`);
            } else {
                console.log(`  ✓ ${dir}`);
            }
        }
        
        // Check files
        for (const file of requiredFiles) {
            const exists = await this.checkPath(file);
            if (!exists) {
                console.log(`  ❌ Missing file: ${file}`);
                this.results.errors.push(`Missing file: ${file}`);
            } else {
                const stats = await fs.stat(file);
                console.log(`  ✓ ${file} (${this.formatSize(stats.size)})`);
            }
        }
        
        this.results.files = {
            required_dirs: requiredDirs.length,
            required_files: requiredFiles.length,
            missing: this.results.errors.filter(e => e.startsWith('Missing')).length
        };
    }
    
    async checkDependencies() {
        console.log('\n📦 Dependencies Check:');
        
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const deps = packageJson.dependencies || {};
            
            const criticalDeps = ['express', 'cors', 'ws', 'uuid'];
            
            for (const dep of criticalDeps) {
                if (deps[dep]) {
                    console.log(`  ✓ ${dep}: ${deps[dep]}`);
                } else {
                    console.log(`  ❌ Missing dependency: ${dep}`);
                    this.results.errors.push(`Missing dependency: ${dep}`);
                }
            }
            
            // Check if node_modules exists
            const modulesExist = await this.checkPath('node_modules');
            if (!modulesExist) {
                console.log('  ⚠️  node_modules not found - run npm install');
                this.results.warnings.push('node_modules not found - run npm install');
            }
            
        } catch (error) {
            console.log('  ❌ Could not read package.json');
            this.results.errors.push('Could not read package.json');
        }
    }
    
    async checkServices() {
        console.log('\n🔌 Service Status:');
        
        const ports = [
            { port: 7777, service: 'Unified Server' },
            { port: 8080, service: 'API Router' },
            { port: 9999, service: 'Mirror Shell' }
        ];
        
        for (const { port, service } of ports) {
            const inUse = await this.checkPort(port);
            if (inUse) {
                console.log(`  ✓ Port ${port} (${service}): IN USE`);
                this.results.services[service] = 'running';
            } else {
                console.log(`  ⚠️  Port ${port} (${service}): AVAILABLE`);
                this.results.services[service] = 'stopped';
            }
        }
        
        // Check process status
        try {
            const { stdout } = await execAsync('ps aux | grep -E "node.*soulfra|python.*9999" | grep -v grep');
            const processes = stdout.split('\n').filter(line => line.trim());
            console.log(`\n  Found ${processes.length} Soulfra processes running`);
            
            if (processes.length > 10) {
                this.results.warnings.push(`High number of processes detected: ${processes.length}`);
                console.log('  ⚠️  Warning: Many processes detected, possible duplicates');
            }
        } catch (error) {
            // No processes found
            console.log('  ℹ️  No Soulfra processes currently running');
        }
    }
    
    async checkDataIntegrity() {
        console.log('\n🔍 Data Integrity Check:');
        
        // Check memory state
        try {
            const statePath = 'memory/state.json';
            if (await this.checkPath(statePath)) {
                const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
                console.log(`  ✓ Memory state: ${state.loops?.length || 0} loops, ${state.whispers?.length || 0} whispers`);
                
                // Check for circular references
                const jsonString = JSON.stringify(state);
                console.log(`  ✓ No circular references detected`);
            } else {
                console.log('  ℹ️  No memory state file yet');
            }
        } catch (error) {
            console.log('  ❌ Error reading memory state:', error.message);
            this.results.errors.push(`Memory state error: ${error.message}`);
        }
        
        // Check blessing
        try {
            const blessingPath = 'blessing.json';
            if (await this.checkPath(blessingPath)) {
                const blessing = JSON.parse(await fs.readFile(blessingPath, 'utf8'));
                console.log(`  ✓ Blessing status: ${blessing.status}`);
                
                if (blessing.status !== 'blessed') {
                    this.results.warnings.push('System not blessed');
                }
            } else {
                console.log('  ⚠️  No blessing.json found');
                this.results.warnings.push('No blessing.json found');
            }
        } catch (error) {
            console.log('  ❌ Error reading blessing:', error.message);
        }
        
        // Check for duplicate processes
        const pidFiles = await this.getPidFiles();
        if (pidFiles.length > 0) {
            console.log(`\n  ℹ️  Found ${pidFiles.length} PID files:`);
            for (const pidFile of pidFiles) {
                const pid = await fs.readFile(pidFile, 'utf8');
                const running = await this.isProcessRunning(pid.trim());
                console.log(`    ${path.basename(pidFile)}: PID ${pid.trim()} ${running ? '(running)' : '(dead)'}`);
                
                if (!running) {
                    this.results.warnings.push(`Stale PID file: ${pidFile}`);
                }
            }
        }
    }
    
    async generateReport() {
        console.log('\n📋 Diagnostic Summary:');
        console.log('====================');
        
        // Generate recommendations
        if (this.results.errors.length > 0) {
            this.results.recommendations.push('Fix critical errors before proceeding');
        }
        
        if (this.results.warnings.includes('node_modules not found - run npm install')) {
            this.results.recommendations.push('Run: npm install');
        }
        
        if (this.results.services['Unified Server'] === 'stopped') {
            this.results.recommendations.push('Start services: ./soulfra-production-launch.sh');
        }
        
        if (this.results.warnings.some(w => w.includes('Stale PID'))) {
            this.results.recommendations.push('Clean stale PIDs: rm pids/*.pid');
        }
        
        // Display summary
        console.log(`\nErrors: ${this.results.errors.length}`);
        this.results.errors.forEach(e => console.log(`  ❌ ${e}`));
        
        console.log(`\nWarnings: ${this.results.warnings.length}`);
        this.results.warnings.forEach(w => console.log(`  ⚠️  ${w}`));
        
        console.log(`\nRecommendations:`);
        this.results.recommendations.forEach(r => console.log(`  → ${r}`));
        
        // Save report
        const reportPath = `logs/diagnostic_${Date.now()}.json`;
        await fs.mkdir('logs', { recursive: true });
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Full report saved to: ${reportPath}`);
        
        // Overall status
        if (this.results.errors.length === 0) {
            console.log('\n✅ System health: GOOD');
        } else if (this.results.errors.length < 5) {
            console.log('\n⚠️  System health: FAIR - Some issues need attention');
        } else {
            console.log('\n❌ System health: POOR - Critical issues detected');
        }
    }
    
    // Helper methods
    async checkPath(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async checkPort(port) {
        const net = require('net');
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => resolve(true));
            server.once('listening', () => {
                server.close();
                resolve(false);
            });
            server.listen(port);
        });
    }
    
    async getPidFiles() {
        try {
            const files = await fs.readdir('pids');
            return files.filter(f => f.endsWith('.pid')).map(f => path.join('pids', f));
        } catch {
            return [];
        }
    }
    
    async isProcessRunning(pid) {
        try {
            process.kill(parseInt(pid), 0);
            return true;
        } catch {
            return false;
        }
    }
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + 'B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
        return (bytes / 1024 / 1024).toFixed(1) + 'MB';
    }
}

// Run diagnostic
if (require.main === module) {
    const diagnostic = new SystemDiagnostic();
    diagnostic.run().catch(console.error);
}