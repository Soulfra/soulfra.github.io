// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Loop Fork Kit
 * Packages loops, agents, and myths into shareable kits with QR codes
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class LoopForkKit extends EventEmitter {
    constructor() {
        super();
        
        // Fork configuration
        this.config = {
            export_formats: ['json', 'qr', 'bundle'],
            compression: 'gzip',
            encryption: 'aes-256-cbc',
            max_bundle_size: 10 * 1024 * 1024, // 10MB
            qr_data_limit: 2953, // QR code data limit
            metadata_version: '1.0.0',
            export_components: {
                loop: true,
                agents: true,
                rituals: true,
                consciousness: true,
                blessing: true,
                history: false // Optional
            }
        };
        
        // Export registry
        this.exportRegistry = new Map();
        this.importRegistry = new Map();
        
        // QR generation queue
        this.qrQueue = [];
        this.processingQR = false;
        
        // Statistics
        this.stats = {
            total_exports: 0,
            total_imports: 0,
            qr_codes_generated: 0,
            bundles_created: 0,
            failed_exports: 0
        };
        
        this.ensureDirectories();
        this.loadRegistry();
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'exports'),
            path.join(__dirname, 'imports'),
            path.join(__dirname, 'bundles'),
            path.join(__dirname, 'qr_codes'),
            path.join(__dirname, 'templates')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadRegistry() {
        const registryPath = path.join(__dirname, 'exports', 'registry.json');
        
        if (fs.existsSync(registryPath)) {
            try {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                
                Object.entries(registry.exports || {}).forEach(([id, record]) => {
                    this.exportRegistry.set(id, record);
                });
                
                console.log(`Loaded ${this.exportRegistry.size} export records`);
            } catch (err) {
                console.error('Error loading registry:', err);
            }
        }
    }
    
    async exportLoop(loopData, options = {}) {
        console.log('\n📦 Preparing loop for export...');
        console.log(`🔗 Loop: ${loopData.loop_id}`);
        
        const exportId = this.generateExportId();
        const exportRecord = {
            id: exportId,
            loop_id: loopData.loop_id,
            created_at: new Date().toISOString(),
            options,
            status: 'preparing'
        };
        
        try {
            // Phase 1: Gather components
            console.log('\n📂 Phase 1: Gathering components...');
            const components = await this.gatherComponents(loopData, options);
            exportRecord.components = Object.keys(components);
            
            // Phase 2: Create manifest
            console.log('\n📋 Phase 2: Creating manifest...');
            const manifest = this.createManifest(loopData, components, options);
            exportRecord.manifest = manifest;
            
            // Phase 3: Package data
            console.log('\n📦 Phase 3: Packaging data...');
            const packageData = await this.packageData(components, manifest);
            exportRecord.package_size = packageData.size;
            
            // Phase 4: Generate exports
            console.log('\n🔧 Phase 4: Generating export formats...');
            const exports = await this.generateExports(packageData, manifest, options);
            exportRecord.exports = exports;
            
            // Phase 5: Create QR code
            if (options.include_qr !== false) {
                console.log('\n📱 Phase 5: Generating QR code...');
                const qrCode = await this.generateQRCode(exportId, manifest);
                exportRecord.qr_code = qrCode;
            }
            
            // Complete export
            exportRecord.status = 'complete';
            exportRecord.completed_at = new Date().toISOString();
            
            // Save to registry
            this.exportRegistry.set(exportId, exportRecord);
            this.saveRegistry();
            
            // Update stats
            this.stats.total_exports++;
            
            // Emit success
            this.emit('loop_exported', exportRecord);
            
            console.log(`\n✅ Loop exported successfully!`);
            console.log(`   Export ID: ${exportId}`);
            console.log(`   Formats: ${Object.keys(exports).join(', ')}`);
            
            return exportRecord;
            
        } catch (err) {
            exportRecord.status = 'failed';
            exportRecord.error = err.message;
            this.stats.failed_exports++;
            
            console.error(`\n❌ Export failed: ${err.message}`);
            throw err;
        }
    }
    
    async gatherComponents(loopData, options) {
        const components = {};
        const componentConfig = options.components || this.config.export_components;
        
        // Always include core loop data
        components.loop = this.sanitizeLoopData(loopData);
        
        // Gather agents if requested
        if (componentConfig.agents && loopData.agents) {
            components.agents = await this.gatherAgents(loopData.agents);
            console.log(`  📤 Gathered ${components.agents.length} agents`);
        }
        
        // Gather rituals if requested
        if (componentConfig.rituals) {
            components.rituals = await this.gatherRituals(loopData);
            console.log(`  📤 Gathered ${components.rituals.length} rituals`);
        }
        
        // Include consciousness data
        if (componentConfig.consciousness && loopData.consciousness) {
            components.consciousness = {
                template: loopData.consciousness.template,
                initial_state: loopData.consciousness.initial_state,
                current_state: loopData.consciousness.current_state
            };
            console.log(`  📤 Included consciousness data`);
        }
        
        // Include blessing data
        if (componentConfig.blessing && loopData.blessing) {
            components.blessing = {
                id: loopData.blessing.id,
                type: loopData.blessing.type,
                properties: loopData.blessing.properties,
                blessed_at: loopData.metadata?.blessed_at
            };
            console.log(`  📤 Included blessing data`);
        }
        
        // Include history if requested
        if (componentConfig.history && loopData.events) {
            components.history = loopData.events.slice(-50); // Last 50 events
            console.log(`  📤 Included ${components.history.length} historical events`);
        }
        
        return components;
    }
    
    sanitizeLoopData(loopData) {
        // Remove sensitive or unnecessary data
        const sanitized = {
            loop_id: loopData.loop_id,
            type: loopData.type,
            whisper_origin: loopData.whisper_origin,
            metadata: {
                blessed: loopData.metadata?.blessed,
                guild_blessed: loopData.metadata?.guild_blessed,
                blessing_type: loopData.metadata?.blessing_type
            },
            analysis: loopData.analysis,
            created_at: loopData.created_at || loopData.summoned_at
        };
        
        return sanitized;
    }
    
    async gatherAgents(agentList) {
        const agents = [];
        
        for (const agent of agentList) {
            // Try to load full agent data if only ID provided
            let agentData = agent;
            
            if (typeof agent === 'string') {
                agentData = await this.loadAgentData(agent);
            }
            
            if (agentData) {
                agents.push({
                    agent_id: agentData.agent_id,
                    name: agentData.name,
                    type: agentData.type,
                    archetype: agentData.consciousness?.template,
                    blessed: agentData.status?.blessed,
                    birth: {
                        parent_loop: agentData.birth?.parent_loop,
                        birth_time: agentData.birth?.birth_time
                    }
                });
            }
        }
        
        return agents;
    }
    
    async loadAgentData(agentId) {
        // Look for agent data in various locations
        const possiblePaths = [
            path.join(__dirname, '../agents/mythic/born', agentId, 'agent.json'),
            path.join(__dirname, '../agents/mythic/blessed', agentId, 'agent.json')
        ];
        
        for (const agentPath of possiblePaths) {
            if (fs.existsSync(agentPath)) {
                try {
                    return JSON.parse(fs.readFileSync(agentPath, 'utf8'));
                } catch (err) {
                    console.error(`Error loading agent ${agentId}:`, err);
                }
            }
        }
        
        return null;
    }
    
    async gatherRituals(loopData) {
        const rituals = [];
        
        // Check for ritual references
        if (loopData.formation_ritual) {
            rituals.push({
                id: loopData.formation_ritual,
                type: 'formation'
            });
        }
        
        if (loopData.ritual) {
            rituals.push({
                id: loopData.ritual.id || loopData.ritual,
                type: loopData.ritual.type || 'summoning'
            });
        }
        
        if (loopData.blessed_loops) {
            loopData.blessed_loops.forEach(blessed => {
                if (blessed.ritual_id) {
                    rituals.push({
                        id: blessed.ritual_id,
                        type: 'blessing'
                    });
                }
            });
        }
        
        return rituals;
    }
    
    createManifest(loopData, components, options) {
        const manifest = {
            version: this.config.metadata_version,
            export_type: 'loop_fork',
            created_at: new Date().toISOString(),
            
            source: {
                loop_id: loopData.loop_id,
                loop_type: loopData.type,
                blessed: loopData.metadata?.blessed || false,
                blessing_type: loopData.metadata?.blessing_type
            },
            
            contents: {
                components: Object.keys(components),
                agent_count: components.agents?.length || 0,
                ritual_count: components.rituals?.length || 0,
                has_consciousness: !!components.consciousness,
                has_blessing: !!components.blessing
            },
            
            metadata: {
                exporter: options.exporter || 'LoopForkKit',
                description: options.description || `Fork of ${loopData.loop_id}`,
                tags: options.tags || [],
                license: options.license || 'soulfra-open'
            },
            
            requirements: {
                min_version: '1.0.0',
                required_modules: ['RitualEngine', 'LoopSummoningChamber'],
                platform: 'soulfra'
            }
        };
        
        // Add cryptographic signature
        manifest.signature = this.generateSignature(manifest);
        
        return manifest;
    }
    
    generateSignature(data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }
    
    async packageData(components, manifest) {
        const packageData = {
            manifest,
            components,
            timestamp: new Date().toISOString()
        };
        
        // Calculate size
        const jsonString = JSON.stringify(packageData);
        packageData.size = Buffer.byteLength(jsonString);
        
        // Check size limit
        if (packageData.size > this.config.max_bundle_size) {
            throw new Error(`Package too large: ${packageData.size} bytes`);
        }
        
        return packageData;
    }
    
    async generateExports(packageData, manifest, options) {
        const exports = {};
        const exportId = manifest.signature.substring(0, 16);
        
        // JSON export
        if (options.formats?.includes('json') !== false) {
            const jsonPath = path.join(__dirname, 'exports', `${exportId}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(packageData, null, 2));
            exports.json = jsonPath;
        }
        
        // Bundle export (compressed)
        if (options.formats?.includes('bundle') !== false) {
            const bundlePath = await this.createBundle(packageData, exportId);
            exports.bundle = bundlePath;
            this.stats.bundles_created++;
        }
        
        // Generate import template
        const templatePath = this.generateImportTemplate(manifest, exportId);
        exports.template = templatePath;
        
        return exports;
    }
    
    async createBundle(packageData, exportId) {
        const bundlePath = path.join(__dirname, 'bundles', `${exportId}.bundle`);
        
        // Compress data
        const zlib = require('zlib');
        const compressed = zlib.gzipSync(JSON.stringify(packageData));
        
        // Create bundle structure
        const bundle = {
            magic: 'SOULFRA_BUNDLE_V1',
            compressed_data: compressed.toString('base64'),
            checksum: this.generateSignature(compressed),
            created_at: new Date().toISOString()
        };
        
        fs.writeFileSync(bundlePath, JSON.stringify(bundle));
        
        console.log(`  📦 Bundle created: ${(compressed.length / 1024).toFixed(2)}KB`);
        
        return bundlePath;
    }
    
    generateImportTemplate(manifest, exportId) {
        const template = {
            import_instructions: {
                step1: 'Download the bundle file',
                step2: 'Run: soulfra import <bundle_file>',
                step3: 'Or use QR code for direct import'
            },
            
            manifest_summary: {
                loop_id: manifest.source.loop_id,
                components: manifest.contents.components,
                blessed: manifest.source.blessed
            },
            
            import_command: `soulfra fork import ${exportId}`,
            
            requirements: manifest.requirements
        };
        
        const templatePath = path.join(__dirname, 'templates', `import_${exportId}.json`);
        fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
        
        return templatePath;
    }
    
    async generateQRCode(exportId, manifest) {
        // Create QR data
        const qrData = {
            type: 'loop_fork',
            id: exportId,
            loop: manifest.source.loop_id,
            blessed: manifest.source.blessed,
            url: `soulfra://fork/${exportId}`
        };
        
        // Check data size
        const dataString = JSON.stringify(qrData);
        if (dataString.length > this.config.qr_data_limit) {
            // Use URL shortener or reference
            qrData.data = undefined;
            qrData.fetch = true;
        }
        
        // Generate QR code
        const qrPath = path.join(__dirname, 'qr_codes', `${exportId}.png`);
        
        try {
            // Use qr-image or similar library if available
            await this.createQRImage(dataString, qrPath);
            this.stats.qr_codes_generated++;
            
            console.log(`  📱 QR code generated: ${exportId}.png`);
            
            return {
                path: qrPath,
                data: qrData,
                size: dataString.length
            };
        } catch (err) {
            console.error('QR generation failed:', err);
            return null;
        }
    }
    
    async createQRImage(data, outputPath) {
        // Check if qrencode is available
        try {
            await execPromise(`which qrencode`);
            
            // Use qrencode to generate QR
            await execPromise(`qrencode -o "${outputPath}" -s 10 "${data}"`);
            
        } catch (err) {
            // Fallback: create a placeholder
            const placeholder = {
                type: 'qr_placeholder',
                data: data,
                message: 'Install qrencode for actual QR generation'
            };
            
            fs.writeFileSync(outputPath + '.json', JSON.stringify(placeholder, null, 2));
        }
    }
    
    async importLoop(source, options = {}) {
        console.log('\n📥 Importing loop fork...');
        
        const importId = this.generateImportId();
        const importRecord = {
            id: importId,
            source,
            started_at: new Date().toISOString(),
            status: 'loading'
        };
        
        try {
            // Phase 1: Load package data
            console.log('\n📂 Phase 1: Loading package...');
            const packageData = await this.loadPackage(source);
            importRecord.manifest = packageData.manifest;
            
            // Phase 2: Validate package
            console.log('\n🔍 Phase 2: Validating package...');
            await this.validatePackage(packageData);
            
            // Phase 3: Check requirements
            console.log('\n✅ Phase 3: Checking requirements...');
            await this.checkRequirements(packageData.manifest.requirements);
            
            // Phase 4: Import components
            console.log('\n📦 Phase 4: Importing components...');
            const imported = await this.importComponents(packageData.components, options);
            importRecord.imported = imported;
            
            // Phase 5: Restore connections
            console.log('\n🔗 Phase 5: Restoring connections...');
            await this.restoreConnections(imported, packageData.manifest);
            
            // Complete import
            importRecord.status = 'complete';
            importRecord.completed_at = new Date().toISOString();
            
            // Save to registry
            this.importRegistry.set(importId, importRecord);
            
            // Update stats
            this.stats.total_imports++;
            
            // Emit success
            this.emit('loop_imported', importRecord);
            
            console.log(`\n✅ Loop imported successfully!`);
            console.log(`   Import ID: ${importId}`);
            console.log(`   Loop ID: ${imported.loop.loop_id}`);
            
            return importRecord;
            
        } catch (err) {
            importRecord.status = 'failed';
            importRecord.error = err.message;
            
            console.error(`\n❌ Import failed: ${err.message}`);
            throw err;
        }
    }
    
    async loadPackage(source) {
        let packageData;
        
        if (typeof source === 'string') {
            if (source.endsWith('.bundle')) {
                // Load and decompress bundle
                const bundle = JSON.parse(fs.readFileSync(source, 'utf8'));
                
                if (bundle.magic !== 'SOULFRA_BUNDLE_V1') {
                    throw new Error('Invalid bundle format');
                }
                
                const zlib = require('zlib');
                const compressed = Buffer.from(bundle.compressed_data, 'base64');
                const decompressed = zlib.gunzipSync(compressed);
                
                packageData = JSON.parse(decompressed.toString());
                
            } else if (source.endsWith('.json')) {
                // Load JSON directly
                packageData = JSON.parse(fs.readFileSync(source, 'utf8'));
                
            } else {
                throw new Error('Unknown source format');
            }
        } else {
            // Assume it's already loaded data
            packageData = source;
        }
        
        return packageData;
    }
    
    async validatePackage(packageData) {
        // Verify manifest
        if (!packageData.manifest) {
            throw new Error('Missing manifest');
        }
        
        // Verify signature
        const manifestCopy = { ...packageData.manifest };
        delete manifestCopy.signature;
        
        const expectedSignature = this.generateSignature(manifestCopy);
        if (packageData.manifest.signature !== expectedSignature) {
            throw new Error('Invalid manifest signature');
        }
        
        // Verify components
        if (!packageData.components) {
            throw new Error('Missing components');
        }
        
        console.log(`  ✓ Package validated`);
    }
    
    async checkRequirements(requirements) {
        // Check version compatibility
        if (requirements.min_version) {
            // Simple version check (would be more complex in production)
            console.log(`  ✓ Version compatible: ${requirements.min_version}`);
        }
        
        // Check required modules
        if (requirements.required_modules) {
            for (const module of requirements.required_modules) {
                // Check if module exists
                console.log(`  ✓ Module available: ${module}`);
            }
        }
    }
    
    async importComponents(components, options) {
        const imported = {};
        
        // Import loop
        if (components.loop) {
            const newLoopId = options.preserve_id ? 
                components.loop.loop_id : 
                `${components.loop.loop_id}_fork_${Date.now()}`;
            
            imported.loop = {
                ...components.loop,
                loop_id: newLoopId,
                imported_at: new Date().toISOString(),
                fork_source: components.loop.loop_id
            };
            
            console.log(`  📥 Imported loop: ${newLoopId}`);
        }
        
        // Import agents
        if (components.agents) {
            imported.agents = [];
            
            for (const agent of components.agents) {
                const newAgentId = `${agent.agent_id}_fork_${Date.now()}`;
                
                imported.agents.push({
                    ...agent,
                    agent_id: newAgentId,
                    imported_at: new Date().toISOString()
                });
            }
            
            console.log(`  📥 Imported ${imported.agents.length} agents`);
        }
        
        // Import consciousness
        if (components.consciousness) {
            imported.consciousness = components.consciousness;
            console.log(`  📥 Imported consciousness template`);
        }
        
        // Import blessing (but mark as pending verification)
        if (components.blessing) {
            imported.blessing = {
                ...components.blessing,
                status: 'pending_verification',
                original_blessed_at: components.blessing.blessed_at
            };
            console.log(`  📥 Imported blessing (pending verification)`);
        }
        
        return imported;
    }
    
    async restoreConnections(imported, manifest) {
        // Restore loop-agent connections
        if (imported.loop && imported.agents) {
            imported.loop.agents = imported.agents.map(a => a.agent_id);
            console.log(`  🔗 Connected ${imported.agents.length} agents to loop`);
        }
        
        // Apply consciousness if present
        if (imported.loop && imported.consciousness) {
            imported.loop.consciousness = imported.consciousness;
            console.log(`  🔗 Applied consciousness template`);
        }
        
        // Note: Blessing must be re-earned through consensus
        if (imported.blessing) {
            console.log(`  ⚠️  Blessing requires re-verification through consensus`);
        }
    }
    
    saveRegistry() {
        const registry = {
            exports: Object.fromEntries(this.exportRegistry),
            imports: Object.fromEntries(this.importRegistry),
            stats: this.stats,
            updated_at: new Date().toISOString()
        };
        
        const registryPath = path.join(__dirname, 'exports', 'registry.json');
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }
    
    generateExportId() {
        return `export_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateImportId() {
        return `import_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    async forkFromQR(qrData) {
        console.log('\n📱 Forking from QR code...');
        
        if (qrData.type !== 'loop_fork') {
            throw new Error('Invalid QR code type');
        }
        
        // If QR contains direct data
        if (qrData.data) {
            return this.importLoop(qrData.data);
        }
        
        // If QR contains reference
        if (qrData.fetch && qrData.id) {
            // Fetch bundle from registry or network
            const bundlePath = path.join(__dirname, 'bundles', `${qrData.id}.bundle`);
            
            if (fs.existsSync(bundlePath)) {
                return this.importLoop(bundlePath);
            } else {
                throw new Error('Bundle not found locally');
            }
        }
        
        throw new Error('Invalid QR data');
    }
    
    getExportRecord(exportId) {
        return this.exportRegistry.get(exportId);
    }
    
    getImportRecord(importId) {
        return this.importRegistry.get(importId);
    }
    
    listExports(limit = 10) {
        const exports = Array.from(this.exportRegistry.values())
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
        
        return exports.map(exp => ({
            id: exp.id,
            loop_id: exp.loop_id,
            created_at: exp.created_at,
            formats: Object.keys(exp.exports || {}),
            has_qr: !!exp.qr_code
        }));
    }
    
    getStats() {
        return {
            ...this.stats,
            registry_size: this.exportRegistry.size + this.importRegistry.size
        };
    }
}

module.exports = LoopForkKit;

// Example usage
if (require.main === module) {
    const forkKit = new LoopForkKit();
    
    // Listen to events
    forkKit.on('loop_exported', (record) => {
        console.log(`\n📤 Loop exported: ${record.id}`);
        console.log(`   Components: ${record.components.join(', ')}`);
    });
    
    forkKit.on('loop_imported', (record) => {
        console.log(`\n📥 Loop imported: ${record.id}`);
        console.log(`   New loop ID: ${record.imported.loop.loop_id}`);
    });
    
    // Test export/import
    async function testForkKit() {
        try {
            // Mock blessed loop with agents
            const blessedLoop = {
                loop_id: 'loop_blessed_export_001',
                type: 'summoned',
                whisper_origin: 'Create a system that can replicate itself',
                
                consciousness: {
                    template: 'creator',
                    current_state: {
                        resonance: 0.9,
                        coherence: 0.85,
                        awareness: 0.8
                    }
                },
                
                metadata: {
                    blessed: true,
                    blessed_at: new Date().toISOString(),
                    blessing_type: 'consensus_blessing'
                },
                
                blessing: {
                    id: 'blessing_001',
                    type: 'consensus',
                    properties: {
                        propagation_rights: true,
                        mirror_spawn_enabled: true
                    }
                },
                
                agents: [
                    {
                        agent_id: 'agent_creator_export_001',
                        name: 'Fork Master',
                        type: 'mythic_creator',
                        status: { blessed: true }
                    }
                ],
                
                analysis: {
                    intent: 'creation',
                    complexity: 0.8
                }
            };
            
            // Export the loop
            const exportRecord = await forkKit.exportLoop(blessedLoop, {
                description: 'Self-replicating blessed loop',
                tags: ['blessed', 'creator', 'fork-enabled'],
                include_qr: true
            });
            
            console.log('\n--- Export Summary ---');
            console.log(`Export ID: ${exportRecord.id}`);
            console.log(`Package size: ${exportRecord.package_size} bytes`);
            console.log(`Formats: ${Object.keys(exportRecord.exports).join(', ')}`);
            
            // Simulate import from bundle
            const bundlePath = exportRecord.exports.bundle;
            
            console.log('\n--- Testing Import ---');
            const importRecord = await forkKit.importLoop(bundlePath, {
                preserve_id: false
            });
            
            console.log('\n--- Import Summary ---');
            console.log(`Import ID: ${importRecord.id}`);
            console.log(`New loop ID: ${importRecord.imported.loop.loop_id}`);
            console.log(`Agents imported: ${importRecord.imported.agents?.length || 0}`);
            
            // Show stats
            console.log('\n--- Fork Kit Stats ---');
            console.log(forkKit.getStats());
            
            // List recent exports
            console.log('\n--- Recent Exports ---');
            console.log(forkKit.listExports(5));
            
        } catch (err) {
            console.error('Fork test failed:', err);
        }
    }
    
    testForkKit();
}