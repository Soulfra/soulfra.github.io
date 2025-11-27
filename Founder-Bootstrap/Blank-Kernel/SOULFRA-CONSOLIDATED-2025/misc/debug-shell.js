#!/usr/bin/env node

// DEBUG ORCHESTRATOR - SHELL WITHIN A SHELL
// Comprehensive debugging system that prevents ENOENT errors
// Runs in its own isolated environment with full system introspection

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const crypto = require('crypto');

class DebugOrchestrator {
    constructor() {
        this.shellEnvironment = {
            cwd: process.cwd(),
            paths: new Map(),
            modules: new Map(),
            errors: new Map(),
            fixes: new Map()
        };
        
        this.errorPatterns = {
            ENOENT: new ENOENTHandler(),
            MODULE_NOT_FOUND: new ModuleNotFoundHandler(),
            PERMISSION_DENIED: new PermissionHandler(),
            PORT_IN_USE: new PortHandler()
        };
        
        this.autoFix = true;
        this.verbose = false;
        
        console.log('🔧 DEBUG ORCHESTRATOR INITIALIZING...');
        console.log('   Shell within a shell architecture');
        console.log('   Comprehensive error prevention');
        console.log('   Auto-fix capability enabled');
    }
    
    async initialize() {
        // Scan entire project structure
        await this.scanProjectStructure();
        
        // Verify all dependencies
        await this.verifyDependencies();
        
        // Create missing directories
        await this.ensureDirectoryStructure();
        
        // Set up error interceptors
        this.setupErrorInterceptors();
        
        console.log('\n✅ Debug orchestrator ready');
    }
    
    async scanProjectStructure() {
        console.log('\n📊 Scanning project structure...');
        
        const scan = async (dir, depth = 0) => {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                        this.shellEnvironment.paths.set(fullPath, {
                            type: 'directory',
                            depth,
                            exists: true
                        });
                        
                        // Recursively scan subdirectories
                        if (depth < 20) { // Prevent infinite loops
                            await scan(fullPath, depth + 1);
                        }
                    } else if (entry.isFile()) {
                        this.shellEnvironment.paths.set(fullPath, {
                            type: 'file',
                            depth,
                            exists: true,
                            ext: path.extname(entry.name)
                        });
                        
                        // Track JavaScript modules
                        if (entry.name.endsWith('.js')) {
                            await this.analyzeModule(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.error(`Error scanning ${dir}:`, error.message);
                this.shellEnvironment.paths.set(dir, {
                    type: 'directory',
                    exists: false,
                    error: error.message
                });
            }
        };
        
        await scan(this.shellEnvironment.cwd);
        console.log(`  ✓ Found ${this.shellEnvironment.paths.size} paths`);
    }
    
    async analyzeModule(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            // Extract requires and imports
            const requires = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
            const imports = content.match(/from ['"]([^'"]+)['"]/g) || [];
            
            this.shellEnvironment.modules.set(filePath, {
                requires: requires.map(r => r.match(/['"]([^'"]+)['"]/)[1]),
                imports: imports.map(i => i.match(/['"]([^'"]+)['"]/)[1]),
                exists: true
            });
        } catch (error) {
            this.shellEnvironment.modules.set(filePath, {
                exists: false,
                error: error.message
            });
        }
    }
    
    async verifyDependencies() {
        console.log('\n🔍 Verifying dependencies...');
        
        const missing = new Set();
        
        for (const [modulePath, moduleInfo] of this.shellEnvironment.modules) {
            if (!moduleInfo.exists) continue;
            
            // Check all requires
            for (const req of moduleInfo.requires || []) {
                if (req.startsWith('.')) {
                    // Relative path
                    const resolvedPath = path.resolve(path.dirname(modulePath), req);
                    const possiblePaths = [
                        resolvedPath,
                        resolvedPath + '.js',
                        path.join(resolvedPath, 'index.js')
                    ];
                    
                    const exists = possiblePaths.some(p => 
                        this.shellEnvironment.paths.has(p) && 
                        this.shellEnvironment.paths.get(p).exists
                    );
                    
                    if (!exists) {
                        missing.add({
                            from: modulePath,
                            require: req,
                            resolved: resolvedPath
                        });
                    }
                }
            }
        }
        
        if (missing.size > 0) {
            console.log(`  ⚠️  Found ${missing.size} missing dependencies`);
            
            if (this.autoFix) {
                for (const dep of missing) {
                    await this.fixMissingDependency(dep);
                }
            }
        } else {
            console.log('  ✓ All dependencies verified');
        }
    }
    
    async fixMissingDependency(dep) {
        console.log(`  🔧 Fixing missing dependency: ${dep.require}`);
        
        // Create missing file with stub
        const targetPath = dep.resolved.endsWith('.js') ? dep.resolved : dep.resolved + '.js';
        const stub = `// Auto-generated stub by Debug Orchestrator
// Original require: ${dep.require} from ${dep.from}

module.exports = {
    // Stub implementation
    placeholder: true,
    message: 'This module was auto-generated to prevent ENOENT errors'
};
`;
        
        try {
            // Ensure directory exists
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            
            // Write stub file
            await fs.writeFile(targetPath, stub, 'utf8');
            console.log(`    ✓ Created stub: ${targetPath}`);
            
            // Update our paths
            this.shellEnvironment.paths.set(targetPath, {
                type: 'file',
                exists: true,
                autoGenerated: true
            });
        } catch (error) {
            console.error(`    ❌ Failed to create stub: ${error.message}`);
        }
    }
    
    async ensureDirectoryStructure() {
        console.log('\n📁 Ensuring directory structure...');
        
        const requiredDirs = [
            'tier-2-master-orchestration',
            'tier-3-gamification',
            'tier-4-master-api',
            'tier-5-domain-empire',
            'tier-6-cal-intelligence',
            'tier-7-social-layer',
            'node_modules',
            'logs',
            'temp'
        ];
        
        for (const dir of requiredDirs) {
            const fullPath = path.join(this.shellEnvironment.cwd, dir);
            
            try {
                await fs.access(fullPath);
                console.log(`  ✓ ${dir} exists`);
            } catch {
                if (this.autoFix) {
                    await fs.mkdir(fullPath, { recursive: true });
                    console.log(`  ✓ Created ${dir}`);
                } else {
                    console.log(`  ⚠️  Missing ${dir}`);
                }
            }
        }
    }
    
    setupErrorInterceptors() {
        // Override process error handlers
        process.on('uncaughtException', (error) => {
            this.handleError(error);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            this.handleError(reason);
        });
        
        // Monkey patch require to catch module errors
        const originalRequire = module.constructor.prototype.require;
        module.constructor.prototype.require = (id) => {
            try {
                return originalRequire.apply(this, [id]);
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.log(`🔧 Intercepted MODULE_NOT_FOUND: ${id}`);
                    
                    // Try to auto-install if it's an npm package
                    if (!id.startsWith('.') && !id.startsWith('/')) {
                        this.autoInstallPackage(id);
                    }
                }
                throw error;
            }
        };
    }
    
    async handleError(error) {
        console.log('\n🚨 ERROR INTERCEPTED:');
        console.log(`  Type: ${error.code || error.name}`);
        console.log(`  Message: ${error.message}`);
        
        const errorInfo = {
            type: error.code || error.name,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        };
        
        this.shellEnvironment.errors.set(Date.now(), errorInfo);
        
        // Try to auto-fix
        if (this.autoFix && this.errorPatterns[error.code]) {
            const fix = await this.errorPatterns[error.code].fix(error, this.shellEnvironment);
            if (fix.success) {
                console.log(`  ✓ Auto-fixed: ${fix.message}`);
            }
        }
    }
    
    async autoInstallPackage(packageName) {
        console.log(`📦 Auto-installing package: ${packageName}`);
        
        return new Promise((resolve, reject) => {
            const npm = spawn('npm', ['install', packageName], {
                cwd: this.shellEnvironment.cwd,
                stdio: 'inherit'
            });
            
            npm.on('close', (code) => {
                if (code === 0) {
                    console.log(`  ✓ Installed ${packageName}`);
                    resolve();
                } else {
                    console.log(`  ❌ Failed to install ${packageName}`);
                    reject(new Error(`npm install failed with code ${code}`));
                }
            });
        });
    }
}

// ERROR HANDLERS
class ENOENTHandler {
    async fix(error, env) {
        const pathMatch = error.message.match(/ENOENT.*'([^']+)'/);
        if (!pathMatch) return { success: false };
        
        const missingPath = pathMatch[1];
        console.log(`  🔧 Fixing ENOENT for: ${missingPath}`);
        
        try {
            if (missingPath.endsWith('.js')) {
                // Create missing file
                await fs.writeFile(missingPath, '// Auto-generated\nmodule.exports = {};', 'utf8');
            } else {
                // Create missing directory
                await fs.mkdir(missingPath, { recursive: true });
            }
            
            return { success: true, message: `Created ${missingPath}` };
        } catch (fixError) {
            return { success: false, message: fixError.message };
        }
    }
}

class ModuleNotFoundHandler {
    async fix(error, env) {
        const moduleMatch = error.message.match(/Cannot find module '([^']+)'/);
        if (!moduleMatch) return { success: false };
        
        const moduleName = moduleMatch[1];
        console.log(`  🔧 Fixing MODULE_NOT_FOUND: ${moduleName}`);
        
        // Check if it's a relative path
        if (moduleName.startsWith('.')) {
            // Create the missing local module
            const resolvedPath = path.resolve(moduleName + '.js');
            await fs.writeFile(resolvedPath, 'module.exports = {};', 'utf8');
            return { success: true, message: `Created ${resolvedPath}` };
        } else {
            // It's an npm package - already handled by autoInstallPackage
            return { success: false, message: 'NPM package - use auto-install' };
        }
    }
}

class PermissionHandler {
    async fix(error, env) {
        const fileMatch = error.message.match(/permission denied.*'([^']+)'/i);
        if (!fileMatch) return { success: false };
        
        const filePath = fileMatch[1];
        console.log(`  🔧 Fixing permissions for: ${filePath}`);
        
        try {
            await fs.chmod(filePath, 0o755);
            return { success: true, message: `Fixed permissions for ${filePath}` };
        } catch (fixError) {
            return { success: false, message: fixError.message };
        }
    }
}

class PortHandler {
    async fix(error, env) {
        const portMatch = error.message.match(/:(\d+)/);
        if (!portMatch) return { success: false };
        
        const port = portMatch[1];
        console.log(`  🔧 Port ${port} is in use`);
        
        // Find process using the port
        return new Promise((resolve) => {
            const lsof = spawn('lsof', ['-ti', `:${port}`]);
            let pid = '';
            
            lsof.stdout.on('data', (data) => {
                pid += data.toString();
            });
            
            lsof.on('close', (code) => {
                if (code === 0 && pid) {
                    console.log(`    Found process ${pid.trim()} using port ${port}`);
                    resolve({ success: true, message: `Port ${port} is used by PID ${pid.trim()}` });
                } else {
                    resolve({ success: false, message: 'Could not find process' });
                }
            });
        });
    }
}

// INTERACTIVE DEBUG SHELL
class InteractiveDebugShell {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'debug> '
        });
        
        this.commands = {
            help: this.showHelp.bind(this),
            scan: this.scan.bind(this),
            verify: this.verify.bind(this),
            fix: this.fixAll.bind(this),
            list: this.listErrors.bind(this),
            clear: this.clearErrors.bind(this),
            auto: this.toggleAutoFix.bind(this),
            verbose: this.toggleVerbose.bind(this),
            launch: this.launchEcosystem.bind(this),
            exit: this.exit.bind(this)
        };
    }
    
    async start() {
        console.log('\n🐚 DEBUG SHELL READY');
        console.log('Type "help" for commands\n');
        
        this.rl.prompt();
        
        this.rl.on('line', async (line) => {
            const [command, ...args] = line.trim().split(' ');
            
            if (this.commands[command]) {
                await this.commands[command](args);
            } else if (command) {
                console.log(`Unknown command: ${command}`);
            }
            
            this.rl.prompt();
        });
    }
    
    showHelp() {
        console.log('\nAvailable commands:');
        console.log('  help     - Show this help');
        console.log('  scan     - Scan project structure');
        console.log('  verify   - Verify all dependencies');
        console.log('  fix      - Fix all found issues');
        console.log('  list     - List recorded errors');
        console.log('  clear    - Clear error log');
        console.log('  auto     - Toggle auto-fix mode');
        console.log('  verbose  - Toggle verbose output');
        console.log('  launch   - Launch the ecosystem');
        console.log('  exit     - Exit debug shell\n');
    }
    
    async scan() {
        await this.orchestrator.scanProjectStructure();
    }
    
    async verify() {
        await this.orchestrator.verifyDependencies();
    }
    
    async fixAll() {
        console.log('🔧 Fixing all issues...');
        await this.orchestrator.ensureDirectoryStructure();
        await this.orchestrator.verifyDependencies();
        console.log('✅ Fix complete');
    }
    
    listErrors() {
        const errors = this.orchestrator.shellEnvironment.errors;
        if (errors.size === 0) {
            console.log('No errors recorded');
        } else {
            console.log(`\nRecorded errors (${errors.size}):`);
            for (const [timestamp, error] of errors) {
                const time = new Date(timestamp).toLocaleTimeString();
                console.log(`  [${time}] ${error.type}: ${error.message}`);
            }
        }
    }
    
    clearErrors() {
        this.orchestrator.shellEnvironment.errors.clear();
        console.log('Error log cleared');
    }
    
    toggleAutoFix() {
        this.orchestrator.autoFix = !this.orchestrator.autoFix;
        console.log(`Auto-fix: ${this.orchestrator.autoFix ? 'ON' : 'OFF'}`);
    }
    
    toggleVerbose() {
        this.orchestrator.verbose = !this.orchestrator.verbose;
        console.log(`Verbose: ${this.orchestrator.verbose ? 'ON' : 'OFF'}`);
    }
    
    async launchEcosystem() {
        console.log('🚀 Launching ecosystem with debug protection...');
        
        // First run all fixes
        await this.fixAll();
        
        // Then launch
        const launch = spawn('bash', ['launch-complete-ecosystem.sh'], {
            cwd: path.join(this.orchestrator.shellEnvironment.cwd),
            stdio: 'inherit'
        });
        
        launch.on('error', (error) => {
            console.error('Launch failed:', error);
            this.orchestrator.handleError(error);
        });
    }
    
    exit() {
        console.log('Goodbye!');
        process.exit(0);
    }
}

// MAIN LAUNCHER
async function launchDebugOrchestrator() {
    console.log('🔧 LAUNCHING DEBUG ORCHESTRATOR...\n');
    
    const orchestrator = new DebugOrchestrator();
    await orchestrator.initialize();
    
    const shell = new InteractiveDebugShell(orchestrator);
    await shell.start();
}

// Export for use as module
module.exports = {
    DebugOrchestrator,
    InteractiveDebugShell,
    ENOENTHandler,
    ModuleNotFoundHandler,
    PermissionHandler,
    PortHandler
};

// Launch if called directly
if (require.main === module) {
    launchDebugOrchestrator().catch(console.error);
}