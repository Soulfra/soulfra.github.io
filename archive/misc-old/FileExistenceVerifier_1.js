#!/usr/bin/env node
/**
 * FileExistenceVerifier.js
 * Verifies and creates all required folders based on path-map.json
 * Eliminates "No such file or directory" errors across the Soulfra kernel
 */

const fs = require('fs');
const path = require('path');

class FileExistenceVerifier {
    constructor(rootPath = __dirname) {
        this.rootPath = rootPath;
        this.pathMapFile = path.join(rootPath, 'path-map.json');
        this.pathMap = null;
        this.results = {
            timestamp: new Date().toISOString(),
            status: 'unknown',
            folders_checked: 0,
            folders_created: 0,
            folders_existing: 0,
            folders_failed: 0,
            details: {},
            errors: []
        };
    }

    async initialize() {
        console.log('🔍 Soulfra File Existence Verifier');
        console.log('====================================');
        
        try {
            // Load path map
            await this.loadPathMap();
            
            // Verify and create required folders
            await this.verifyRequiredFolders();
            await this.verifyNestedFolders();
            
            // Generate report
            this.generateReport();
            
            return this.results;
            
        } catch (error) {
            this.results.status = 'error';
            this.results.errors.push(error.message);
            console.error('💀 Verification failed:', error.message);
            throw error;
        }
    }

    async loadPathMap() {
        try {
            if (!fs.existsSync(this.pathMapFile)) {
                throw new Error(`Path map not found: ${this.pathMapFile}`);
            }
            
            const pathMapData = fs.readFileSync(this.pathMapFile, 'utf8');
            this.pathMap = JSON.parse(pathMapData);
            
            console.log(`✅ Loaded path map v${this.pathMap._version || '1.0.0'}`);
            
        } catch (error) {
            throw new Error(`Failed to load path map: ${error.message}`);
        }
    }

    loadPathMapSync() {
        try {
            if (!fs.existsSync(this.pathMapFile)) {
                console.warn(`Path map not found: ${this.pathMapFile}, using defaults`);
                this.pathMap = this.getDefaultPathMap();
                return;
            }
            
            const pathMapData = fs.readFileSync(this.pathMapFile, 'utf8');
            this.pathMap = JSON.parse(pathMapData);
            
        } catch (error) {
            console.warn(`Failed to load path map: ${error.message}, using defaults`);
            this.pathMap = this.getDefaultPathMap();
        }
    }

    getDefaultPathMap() {
        return {
            core: {
                agents: "agents",
                logs: "logs",
                memory: "memory",
                config: "config",
                runtime: "runtime",
                cache: "cache",
                loop: "loop",
                "mirror-shell": "mirror-shell"
            },
            required_for_startup: [
                "logs", "memory", "config", "agents", "loop", "runtime", "cache", "mirror-shell"
            ]
        };
    }

    async verifyRequiredFolders() {
        console.log('\n📁 Verifying required startup folders...');
        
        const required = this.pathMap.required_for_startup || [];
        
        for (const folderName of required) {
            await this.checkAndCreateFolder(folderName, 'required');
        }
    }

    async verifyNestedFolders() {
        console.log('\n📂 Verifying nested folder structure...');
        
        const nested = this.pathMap.auto_create_nested || [];
        
        for (const folderPath of nested) {
            await this.checkAndCreateFolder(folderPath, 'nested');
        }
    }

    async checkAndCreateFolder(folderPath, category = 'standard') {
        const fullPath = path.join(this.rootPath, folderPath);
        const exists = fs.existsSync(fullPath);
        
        this.results.folders_checked++;
        
        if (exists) {
            console.log(`  ✅ ${folderPath} - exists`);
            this.results.folders_existing++;
            this.results.details[folderPath] = {
                status: 'exists',
                category,
                path: fullPath
            };
        } else {
            try {
                // Create the folder with recursive option
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`  🆕 ${folderPath} - created`);
                this.results.folders_created++;
                this.results.details[folderPath] = {
                    status: 'created',
                    category,
                    path: fullPath
                };
            } catch (error) {
                console.log(`  ❌ ${folderPath} - failed: ${error.message}`);
                this.results.folders_failed++;
                this.results.details[folderPath] = {
                    status: 'failed',
                    category,
                    path: fullPath,
                    error: error.message
                };
                this.results.errors.push(`${folderPath}: ${error.message}`);
            }
        }
    }

    generateReport() {
        console.log('\n📊 Verification Summary');
        console.log('=======================');
        console.log(`Folders checked: ${this.results.folders_checked}`);
        console.log(`Already existing: ${this.results.folders_existing}`);
        console.log(`Created: ${this.results.folders_created}`);
        console.log(`Failed: ${this.results.folders_failed}`);
        
        if (this.results.folders_failed === 0) {
            this.results.status = 'success';
            console.log('\n🎉 All required folders verified/created successfully!');
        } else {
            this.results.status = 'partial';
            console.log('\n⚠️  Some folders could not be created. Check permissions.');
        }

        if (this.results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            this.results.errors.forEach(error => {
                console.log(`  - ${error}`);
            });
        }
    }

    // API endpoint compatible method
    getApiResponse() {
        const statusMap = {};
        
        // Map details to simple status format
        Object.keys(this.results.details).forEach(folderPath => {
            const detail = this.results.details[folderPath];
            const simplePath = path.basename(folderPath);
            
            if (detail.status === 'exists' || detail.status === 'created') {
                statusMap[simplePath] = 'ok';
            } else {
                statusMap[simplePath] = 'missing';
            }
        });

        return {
            timestamp: this.results.timestamp,
            status: this.results.status,
            summary: {
                checked: this.results.folders_checked,
                existing: this.results.folders_existing,
                created: this.results.folders_created,
                failed: this.results.folders_failed
            },
            folders: statusMap,
            errors: this.results.errors
        };
    }

    // Auto-repair functionality
    async autoRepair() {
        console.log('\n🔧 Running auto-repair...');
        
        const failed = Object.keys(this.results.details).filter(
            key => this.results.details[key].status === 'failed'
        );

        if (failed.length === 0) {
            console.log('No failed folders to repair.');
            return { repaired: 0 };
        }

        let repaired = 0;
        for (const folderPath of failed) {
            try {
                const fullPath = this.results.details[folderPath].path;
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`  🔧 Repaired: ${folderPath}`);
                this.results.details[folderPath].status = 'created';
                repaired++;
            } catch (error) {
                console.log(`  💀 Still failed: ${folderPath} - ${error.message}`);
            }
        }

        console.log(`\n✅ Auto-repair complete: ${repaired} folders fixed`);
        return { repaired };
    }

    // Check specific folder
    checkFolder(folderName) {
        const folderPath = this.resolveFolderPath(folderName);
        if (!folderPath) {
            return { status: 'unknown', error: 'Folder not in path map' };
        }

        const fullPath = path.join(this.rootPath, folderPath);
        const exists = fs.existsSync(fullPath);
        
        return {
            status: exists ? 'ok' : 'missing',
            path: folderPath,
            fullPath: fullPath
        };
    }

    resolveFolderPath(folderName) {
        // Check core folders
        if (this.pathMap.core[folderName]) {
            return this.pathMap.core[folderName];
        }
        
        // Check specialized folders
        if (this.pathMap.specialized[folderName]) {
            return this.pathMap.specialized[folderName];
        }
        
        // Check nested folders
        if (this.pathMap.nested[folderName]) {
            return this.pathMap.nested[folderName];
        }
        
        return null;
    }
}

// Export for use in other modules
module.exports = FileExistenceVerifier;

// CLI execution
if (require.main === module) {
    const verifier = new FileExistenceVerifier();
    
    verifier.initialize()
        .then(() => {
            console.log('\n✅ Verification complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💀 Verification failed:', error.message);
            process.exit(1);
        });
}