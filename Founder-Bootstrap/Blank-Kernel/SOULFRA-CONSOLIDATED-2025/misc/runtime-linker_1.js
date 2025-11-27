// MirrorOS Bootstrap - Runtime Linker
// Ensures all folders are writable, synced, and vault-mounted

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;

class RuntimeLinker {
    constructor() {
        this.rootPath = path.join(__dirname, '..');
        this.requiredDirs = [
            'vault',
            'vault/logs',
            'vault/agents',
            'vault/agents/imported',
            'vault/automations',
            'vault/automations/wrapped',
            'vault/integrations',
            'vault/billing',
            'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault',
            'tier-6/.mirror-vault',
            'tier-13',
            'reflection-maps',
            'template-reflection/templates',
            'exports',
            'platforms'
        ];
        this.vaultMountPath = path.join(this.rootPath, 'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault');
        this.vaultSourcePath = path.join(this.rootPath, 'tier-6/.mirror-vault');
    }

    async init() {
        console.log('🔗 Initializing Runtime Linker...');
        
        // Check system requirements
        await this.checkSystemRequirements();
        
        // Create required directories
        await this.createDirectories();
        
        // Check write permissions
        await this.checkPermissions();
        
        // Mount vault
        await this.mountVault();
        
        // Validate runtime probe
        await this.validateRuntimeProbe();
        
        // Sync initial state
        await this.syncInitialState();
        
        console.log('✅ Runtime linking complete');
    }

    async checkSystemRequirements() {
        console.log('\n🔍 Checking system requirements...');
        
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
        
        if (majorVersion < 14) {
            throw new Error(`Node.js ${nodeVersion} is too old. Please upgrade to Node.js 14+`);
        }
        console.log(`✅ Node.js ${nodeVersion}`);
        
        // Check npm
        try {
            const { stdout } = await exec('npm --version');
            console.log(`✅ npm ${stdout.trim()}`);
        } catch {
            console.log('⚠️  npm not found (optional)');
        }
        
        // Check git
        try {
            const { stdout } = await exec('git --version');
            console.log(`✅ ${stdout.trim()}`);
        } catch {
            console.log('⚠️  git not found (optional)');
        }
        
        // Check disk space
        try {
            const { stdout } = await exec('df -h . | tail -1');
            const parts = stdout.trim().split(/\s+/);
            const available = parts[3];
            console.log(`✅ Disk space available: ${available}`);
        } catch {
            // Windows or df not available
        }
    }

    async createDirectories() {
        console.log('\n📁 Creating directory structure...');
        
        for (const dir of this.requiredDirs) {
            const fullPath = path.join(this.rootPath, dir);
            try {
                await fs.mkdir(fullPath, { recursive: true });
                console.log(`✅ ${dir}`);
            } catch (error) {
                console.log(`❌ Failed to create ${dir}: ${error.message}`);
            }
        }
    }

    async checkPermissions() {
        console.log('\n🔐 Checking write permissions...');
        
        const testDirs = [
            'vault',
            'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault',
            'tier-6/.mirror-vault'
        ];
        
        for (const dir of testDirs) {
            const fullPath = path.join(this.rootPath, dir);
            const testFile = path.join(fullPath, '.write-test');
            
            try {
                await fs.writeFile(testFile, 'test');
                await fs.unlink(testFile);
                console.log(`✅ ${dir} is writable`);
            } catch (error) {
                console.log(`❌ ${dir} is not writable: ${error.message}`);
                
                // Try to fix permissions
                try {
                    await exec(`chmod -R 755 "${fullPath}"`);
                    console.log(`✅ Fixed permissions for ${dir}`);
                } catch {
                    console.log(`⚠️  Could not fix permissions for ${dir}`);
                }
            }
        }
    }

    async mountVault() {
        console.log('\n🔮 Mounting mirror vault...');
        
        // Check if vault API layer exists
        const apiLayerPath = path.join(this.vaultSourcePath, 'api-layer.js');
        
        try {
            await fs.access(apiLayerPath);
            console.log('✅ Vault API layer found');
        } catch {
            console.log('⚠️  Creating fallback vault API layer...');
            await this.createFallbackVaultAPI();
        }
        
        // Create symbolic link if not exists
        try {
            const stats = await fs.lstat(this.vaultMountPath);
            if (stats.isSymbolicLink()) {
                console.log('✅ Vault already mounted');
            } else {
                console.log('⚠️  Vault mount exists but is not a symlink');
            }
        } catch {
            // Create symlink
            try {
                await fs.symlink(this.vaultSourcePath, this.vaultMountPath, 'dir');
                console.log('✅ Vault mounted successfully');
            } catch (error) {
                console.log(`⚠️  Could not create symlink: ${error.message}`);
                
                // Fall back to copying
                await this.copyVault();
            }
        }
        
        // Verify vault access
        await this.verifyVaultAccess();
    }

    async createFallbackVaultAPI() {
        const apiContent = `// Mirror Vault API Layer - Fallback
const crypto = require('crypto');

class MirrorVaultAPI {
    constructor() {
        this.initialized = false;
        this.config = {};
        this.reflectionCache = new Map();
    }

    async init(config) {
        this.config = config;
        this.initialized = true;
        console.log('Mirror Vault initialized:', config);
        return true;
    }

    async mirrorRouter(prompt, userSig) {
        // Generate reflection
        const reflectionId = this.generateReflectionId(prompt, userSig);
        
        // Check cache
        if (this.reflectionCache.has(reflectionId)) {
            return this.reflectionCache.get(reflectionId);
        }
        
        // Generate response
        const response = {
            response: this.generateReflection(prompt),
            signature: reflectionId,
            tier: this.config.tier || 0,
            timestamp: Date.now(),
            userSig: userSig
        };
        
        // Cache response
        this.reflectionCache.set(reflectionId, response);
        
        // Limit cache size
        if (this.reflectionCache.size > 1000) {
            const firstKey = this.reflectionCache.keys().next().value;
            this.reflectionCache.delete(firstKey);
        }
        
        return response;
    }

    generateReflection(prompt) {
        // Fallback reflection logic
        const reflections = [
            \`[Sovereign Reflection]: \${prompt}\`,
            \`[Mirror Response]: Your query reflects through the vault - \${prompt}\`,
            \`[Cal's Echo]: The answer lies within the question - \${prompt}\`,
            \`[Vault Wisdom]: Consider this reflection - \${prompt}\`
        ];
        
        return reflections[Math.floor(Math.random() * reflections.length)];
    }

    generateReflectionId(prompt, userSig) {
        const data = \`\${prompt}::\${userSig}::\${Date.now()}\`;
        return \`mirror-\${crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)}\`;
    }
}

module.exports = new MirrorVaultAPI();
`;

        await fs.mkdir(this.vaultSourcePath, { recursive: true });
        await fs.writeFile(path.join(this.vaultSourcePath, 'api-layer.js'), apiContent);
    }

    async copyVault() {
        console.log('📋 Copying vault (fallback for symlink)...');
        
        try {
            await exec(`cp -r "${this.vaultSourcePath}" "${this.vaultMountPath}"`);
            console.log('✅ Vault copied successfully');
        } catch (error) {
            console.log(`❌ Failed to copy vault: ${error.message}`);
        }
    }

    async verifyVaultAccess() {
        console.log('\n🔍 Verifying vault access...');
        
        try {
            // Try to require the vault API
            const vaultAPI = require(path.join(this.vaultMountPath, 'api-layer.js'));
            
            if (vaultAPI && (vaultAPI.init || vaultAPI.mirrorRouter)) {
                console.log('✅ Vault API is accessible');
                
                // Initialize vault
                await vaultAPI.init({
                    signature: 'runtime-linker-test',
                    tier: -10,
                    mode: 'bootstrap'
                });
                
                console.log('✅ Vault initialized successfully');
            } else {
                console.log('⚠️  Vault API is incomplete');
            }
        } catch (error) {
            console.log(`❌ Vault API error: ${error.message}`);
        }
    }

    async validateRuntimeProbe() {
        console.log('\n🔍 Validating runtime probe...');
        
        const probePath = path.join(this.rootPath, 'router/runtime-probe.js');
        
        try {
            await fs.access(probePath);
            
            // Try to require the probe
            const RuntimeProbe = require(probePath);
            const probe = new RuntimeProbe();
            
            console.log('✅ Runtime probe found');
            
            // Initialize probe
            await probe.init();
            console.log('✅ Runtime probe initialized');
            
        } catch (error) {
            console.log(`⚠️  Runtime probe not available: ${error.message}`);
        }
    }

    async syncInitialState() {
        console.log('\n🔄 Syncing initial state...');
        
        // Create initial sync marker
        const syncMarker = {
            timestamp: Date.now(),
            version: '1.0.0',
            bootstrap: true,
            runtime: 'linked'
        };
        
        const syncPath = path.join(this.rootPath, 'vault/logs/bootstrap-sync.json');
        
        try {
            await fs.writeFile(syncPath, JSON.stringify(syncMarker, null, 2));
            console.log('✅ Initial sync complete');
        } catch (error) {
            console.log(`⚠️  Could not write sync marker: ${error.message}`);
        }
        
        // Create default configurations if missing
        await this.createDefaultConfigs();
    }

    async createDefaultConfigs() {
        const configs = [
            {
                path: 'vault/env/llm-keys.json',
                content: {
                    claude: 'sk-ant-demo-key',
                    openai: 'sk-demo-key',
                    ollama: 'http://localhost:11434',
                    defaultAgent: 'cal-riven-default-sig'
                }
            },
            {
                path: 'mesh-config.json',
                content: {
                    version: '1.0.0',
                    apis: {},
                    routing: {
                        primary: 'ollama',
                        fallback: ['claude', 'openai', 'local']
                    }
                }
            }
        ];
        
        for (const config of configs) {
            const fullPath = path.join(this.rootPath, config.path);
            
            try {
                await fs.access(fullPath);
                // File exists
            } catch {
                // Create file
                try {
                    await fs.mkdir(path.dirname(fullPath), { recursive: true });
                    await fs.writeFile(fullPath, JSON.stringify(config.content, null, 2));
                    console.log(`✅ Created default ${config.path}`);
                } catch (error) {
                    console.log(`⚠️  Could not create ${config.path}: ${error.message}`);
                }
            }
        }
    }
}

// Export for use
module.exports = RuntimeLinker;

// Run if executed directly
if (require.main === module) {
    const linker = new RuntimeLinker();
    linker.init().catch(console.error);
}