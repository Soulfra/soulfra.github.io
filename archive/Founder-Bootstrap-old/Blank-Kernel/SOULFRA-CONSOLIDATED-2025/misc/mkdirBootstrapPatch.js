#!/usr/bin/env node
/**
 * mkdirBootstrapPatch.js
 * Bootstrap patch for ensuring folder structure before any Soulfra operations
 * Eliminates startup race conditions and "No such file or directory" errors
 */

const fs = require('fs');
const path = require('path');

class MkdirBootstrapPatch {
    constructor(rootPath = __dirname) {
        this.rootPath = rootPath;
        this.pathMapFile = path.join(rootPath, 'path-map.json');
        this.pathMap = null;
        this.bootstrapped = false;
    }

    /**
     * Bootstrap all required folders synchronously
     * Use this at the start of any server/daemon initialization
     */
    bootstrapSync() {
        if (this.bootstrapped) {
            return { status: 'already_bootstrapped' };
        }

        console.log('🚀 Bootstrap: Ensuring folder structure...');
        
        try {
            // Load path map
            this.loadPathMapSync();
            
            // Create required folders
            const results = this.createRequiredFoldersSync();
            
            this.bootstrapped = true;
            console.log(`✅ Bootstrap complete: ${results.created} folders ensured`);
            
            return {
                status: 'success',
                created: results.created,
                existing: results.existing,
                failed: results.failed
            };
            
        } catch (error) {
            console.error('💀 Bootstrap failed:', error.message);
            throw error;
        }
    }

    /**
     * Async version for use in modern async/await contexts
     */
    async bootstrap() {
        return this.bootstrapSync();
    }

    loadPathMapSync() {
        try {
            if (!fs.existsSync(this.pathMapFile)) {
                // Fallback to minimal required structure
                this.pathMap = this.getMinimalPathMap();
                console.log('⚠️  Using minimal path map fallback');
                return;
            }
            
            const pathMapData = fs.readFileSync(this.pathMapFile, 'utf8');
            this.pathMap = JSON.parse(pathMapData);
            
        } catch (error) {
            // Fallback to minimal structure
            this.pathMap = this.getMinimalPathMap();
            console.log('⚠️  Path map error, using fallback');
        }
    }

    createRequiredFoldersSync() {
        const results = { created: 0, existing: 0, failed: 0 };
        
        // Get required folders list
        const requiredFolders = this.pathMap.required_for_startup || [];
        const nestedFolders = this.pathMap.auto_create_nested || [];
        
        // Combine and deduplicate
        const allFolders = [...new Set([...requiredFolders, ...nestedFolders])];
        
        for (const folderPath of allFolders) {
            const fullPath = path.join(this.rootPath, folderPath);
            
            if (fs.existsSync(fullPath)) {
                results.existing++;
                continue;
            }
            
            try {
                fs.mkdirSync(fullPath, { recursive: true });
                results.created++;
            } catch (error) {
                console.error(`Failed to create ${folderPath}:`, error.message);
                results.failed++;
            }
        }
        
        return results;
    }

    /**
     * Minimal fallback path map if main path-map.json is missing
     */
    getMinimalPathMap() {
        return {
            required_for_startup: [
                'logs',
                'memory',
                'pids',
                'config',
                'agents',
                'loop',
                'runtime',
                'cache'
            ],
            auto_create_nested: [
                'logs/system',
                'memory/state',
                'loop/active',
                'loop/staging',
                'agents/states',
                'config/platform'
            ]
        };
    }

    /**
     * Express.js middleware wrapper
     */
    static expressMiddleware(rootPath) {
        const patcher = new MkdirBootstrapPatch(rootPath);
        
        return (req, res, next) => {
            if (!patcher.bootstrapped) {
                try {
                    patcher.bootstrapSync();
                } catch (error) {
                    console.error('Bootstrap middleware failed:', error.message);
                    // Continue anyway - don't block the server
                }
            }
            next();
        };
    }

    /**
     * Direct integration for unified-soulfra-server.js
     */
    static integrateWithUnifiedServer(serverInstance, rootPath = __dirname) {
        const patcher = new MkdirBootstrapPatch(rootPath);
        
        console.log('🔧 Integrating mkdir bootstrap with unified server...');
        
        try {
            const result = patcher.bootstrapSync();
            console.log(`🎯 Server integration: ${result.created} folders created, ${result.existing} existing`);
            return result;
        } catch (error) {
            console.error('Server integration failed:', error.message);
            throw error;
        }
    }

    /**
     * Direct integration for SoulfraSelfLaunchController.js
     */
    static integrateWithLaunchController(controllerInstance, rootPath = __dirname) {
        const patcher = new MkdirBootstrapPatch(rootPath);
        
        console.log('🎮 Integrating mkdir bootstrap with launch controller...');
        
        try {
            const result = patcher.bootstrapSync();
            console.log(`🚀 Launch controller: ${result.created} folders prepared`);
            return result;
        } catch (error) {
            console.error('Launch controller integration failed:', error.message);
            throw error;
        }
    }

    /**
     * Shell script integration generator
     */
    static generateShellIntegration(scriptPath = 'install-soulfra-kit.sh') {
        return `
# mkdir Bootstrap Patch Integration for ${scriptPath}
echo "🚀 Bootstrap: Ensuring folder structure..."

# Create required directories
mkdir -p logs logs/system logs/agents logs/loops
mkdir -p memory memory/state memory/snapshots  
mkdir -p pids config config/platform config/tiers
mkdir -p agents agents/states agents/registry agents/suggestions
mkdir -p loop loop/active loop/staging loop/blessed
mkdir -p runtime runtime/engines runtime/scripts
mkdir -p cache vault vault/reflection
mkdir -p mirror-shell mirror-shell/components mirror-shell/assets

echo "✅ Bootstrap complete: Folder structure ensured"
`;
    }

    /**
     * One-liner for quick integration
     */
    static quickBootstrap(rootPath = __dirname) {
        return new MkdirBootstrapPatch(rootPath).bootstrapSync();
    }
}

// Export for use in other modules
module.exports = MkdirBootstrapPatch;

// CLI execution
if (require.main === module) {
    const patcher = new MkdirBootstrapPatch();
    
    try {
        const result = patcher.bootstrapSync();
        console.log('Bootstrap result:', result);
        process.exit(0);
    } catch (error) {
        console.error('Bootstrap failed:', error.message);
        process.exit(1);
    }
}