#!/usr/bin/env node
/**
 * RulesOrchestrator.js
 * Main orchestration engine for SOULFRA rules enforcement
 * Automatically ensures all directories and files follow established rules
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const FileSystemWatcher = require('./FileSystemWatcher');
const RulesEnforcer = require('./RulesEnforcer');
const TemplateGenerator = require('./TemplateGenerator');
const ValidationDaemon = require('./ValidationDaemon');

class RulesOrchestrator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Fix path to point to actual project root (go up 2 levels from orchestrator dir)
        this.rootPath = options.rootPath || path.resolve(__dirname, '../..');
        this.rulesPath = options.rulesPath || path.join(this.rootPath, '.rules');
        this.enabled = options.enabled !== false;
        this.dryRun = options.dryRun || false;
        
        // Initialize components
        this.watcher = new FileSystemWatcher({
            rootPath: this.rootPath,
            ignorePatterns: [
                '**/node_modules/**',
                '**/.git/**',
                '**/.rules/**',
                '**/logs/**',
                '**/temp/**',
                '**/*.log'
            ]
        });
        
        this.enforcer = new RulesEnforcer({
            rulesPath: this.rulesPath,
            dryRun: this.dryRun
        });
        
        this.generator = new TemplateGenerator({
            rulesPath: this.rulesPath
        });
        
        this.validator = new ValidationDaemon({
            rootPath: this.rootPath,
            rulesPath: this.rulesPath,
            interval: 60000 // Validate every minute
        });
        
        this.stats = {
            directoriesCreated: 0,
            filesCreated: 0,
            rulesEnforced: 0,
            violationsFixed: 0,
            templateFilesGenerated: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎭 Initializing SOULFRA Rules Orchestrator...');
        
        try {
            // Load all rules
            await this.loadRules();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Start components
            if (this.enabled) {
                await this.start();
            }
            
            console.log('✅ Rules Orchestrator initialized successfully');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Rules Orchestrator:', error);
            this.emit('error', error);
        }
    }
    
    async loadRules() {
        console.log('📚 Loading SOULFRA rules...');
        
        const ruleCategories = [
            'architecture',
            'development',
            'security',
            'deployment',
            'monitoring'
        ];
        
        for (const category of ruleCategories) {
            const categoryPath = path.join(this.rulesPath, category);
            if (fs.existsSync(categoryPath)) {
                const files = fs.readdirSync(categoryPath)
                    .filter(f => f.endsWith('.rules') || f.endsWith('.md'));
                    
                console.log(`  📁 ${category}: ${files.length} rules found`);
            }
        }
    }
    
    setupEventHandlers() {
        // File system events
        this.watcher.on('directory-created', async (dirPath) => {
            console.log(`📁 New directory detected: ${dirPath}`);
            await this.handleNewDirectory(dirPath);
        });
        
        this.watcher.on('file-created', async (filePath) => {
            console.log(`📄 New file detected: ${filePath}`);
            await this.handleNewFile(filePath);
        });
        
        this.watcher.on('file-modified', async (filePath) => {
            // Only validate on modifications, don't generate new files
            await this.validateFile(filePath);
        });
        
        // Validation events
        this.validator.on('violation-found', async (violation) => {
            console.log(`⚠️  Rules violation: ${violation.message}`);
            await this.handleViolation(violation);
        });
        
        // Enforcer events
        this.enforcer.on('rule-enforced', (rule) => {
            this.stats.rulesEnforced++;
            this.emit('rule-enforced', rule);
        });
        
        // Generator events
        this.generator.on('file-generated', (filePath) => {
            this.stats.templateFilesGenerated++;
            this.emit('template-generated', filePath);
        });
    }
    
    async start() {
        console.log('🚀 Starting Rules Orchestrator...');
        
        // Start watching file system
        await this.watcher.start();
        
        // Start validation daemon
        await this.validator.start();
        
        // Initial scan to ensure existing structure complies
        await this.performInitialScan();
        
        console.log('✅ Rules Orchestrator is now active');
        this.emit('started');
    }
    
    async stop() {
        console.log('🛑 Stopping Rules Orchestrator...');
        
        await this.watcher.stop();
        await this.validator.stop();
        
        console.log('✅ Rules Orchestrator stopped');
        this.emit('stopped');
    }
    
    async handleNewDirectory(dirPath) {
        this.stats.directoriesCreated++;
        
        // Skip if in ignored path
        if (this.shouldIgnorePath(dirPath)) {
            return;
        }
        
        console.log(`🔧 Applying rules to new directory: ${dirPath}`);
        
        try {
            // 1. Check if directory follows naming conventions
            const violations = await this.enforcer.checkDirectoryNaming(dirPath);
            if (violations.length > 0) {
                console.log(`⚠️  Directory naming violations found`);
                // Log violations but don't rename automatically (too dangerous)
                violations.forEach(v => console.log(`   - ${v}`));
            }
            
            // 2. Generate required files based on directory type
            const requiredFiles = await this.generator.getRequiredFilesForDirectory(dirPath);
            
            for (const file of requiredFiles) {
                const filePath = path.join(dirPath, file.name);
                
                if (!fs.existsSync(filePath)) {
                    console.log(`📝 Generating required file: ${file.name}`);
                    
                    if (!this.dryRun) {
                        const content = await this.generator.generateFileContent(file.type, {
                            directory: dirPath,
                            projectName: path.basename(dirPath)
                        });
                        
                        fs.writeFileSync(filePath, content);
                        this.stats.templateFilesGenerated++;
                    }
                }
            }
            
            // 3. Create local rules file if needed
            const localRulesPath = path.join(dirPath, '.rules');
            if (!fs.existsSync(localRulesPath) && this.shouldHaveLocalRules(dirPath)) {
                console.log(`📋 Creating local rules for directory`);
                
                if (!this.dryRun) {
                    const localRules = await this.generator.generateLocalRules(dirPath);
                    fs.writeFileSync(localRulesPath, localRules);
                }
            }
            
            // 4. Update parent README if exists
            await this.updateParentReadme(dirPath);
            
            this.emit('directory-processed', {
                path: dirPath,
                filesGenerated: requiredFiles.length
            });
            
        } catch (error) {
            console.error(`❌ Error processing directory ${dirPath}:`, error);
            this.emit('error', error);
        }
    }
    
    async handleNewFile(filePath) {
        this.stats.filesCreated++;
        
        // Skip if in ignored path
        if (this.shouldIgnorePath(filePath)) {
            return;
        }
        
        console.log(`🔧 Applying rules to new file: ${filePath}`);
        
        try {
            // 1. Validate file name
            const namingViolations = await this.enforcer.checkFileNaming(filePath);
            if (namingViolations.length > 0) {
                console.log(`⚠️  File naming violations:`);
                namingViolations.forEach(v => console.log(`   - ${v}`));
            }
            
            // 2. Check file size
            const stats = fs.statSync(filePath);
            const sizeLimit = this.getFileSizeLimit(filePath);
            
            if (stats.size > sizeLimit) {
                console.log(`⚠️  File exceeds size limit: ${stats.size} bytes (limit: ${sizeLimit})`);
            }
            
            // 3. Apply file-specific rules
            await this.applyFileSpecificRules(filePath);
            
            // 4. Update indexes if needed
            await this.updateIndexes(filePath);
            
            this.emit('file-processed', {
                path: filePath
            });
            
        } catch (error) {
            console.error(`❌ Error processing file ${filePath}:`, error);
            this.emit('error', error);
        }
    }
    
    async validateFile(filePath) {
        try {
            const violations = await this.validator.validateFile(filePath);
            
            if (violations.length > 0) {
                console.log(`⚠️  Validation errors in ${filePath}:`);
                violations.forEach(v => console.log(`   - ${v.message}`));
                
                this.emit('validation-failed', {
                    file: filePath,
                    violations: violations
                });
            }
        } catch (error) {
            console.error(`❌ Error validating file ${filePath}:`, error);
        }
    }
    
    async handleViolation(violation) {
        this.stats.violationsFixed++;
        
        if (violation.autoFixable && !this.dryRun) {
            console.log(`🔧 Auto-fixing violation: ${violation.message}`);
            
            try {
                await this.enforcer.autoFix(violation);
                console.log(`✅ Violation fixed automatically`);
            } catch (error) {
                console.error(`❌ Failed to auto-fix violation:`, error);
            }
        } else {
            console.log(`📋 Manual fix required: ${violation.message}`);
            
            // Log to violations file for manual review
            const violationsLog = path.join(this.rulesPath, 'violations.log');
            const logEntry = `${new Date().toISOString()} - ${violation.file} - ${violation.message}\n`;
            
            fs.appendFileSync(violationsLog, logEntry);
        }
    }
    
    async performInitialScan() {
        console.log('🔍 Performing initial scan of existing structure...');
        
        const scanDir = async (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (this.shouldIgnorePath(fullPath)) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    // Check directory compliance
                    await this.validateDirectory(fullPath);
                    // Recurse
                    await scanDir(fullPath);
                } else {
                    // Validate file
                    await this.validateFile(fullPath);
                }
            }
        };
        
        await scanDir(this.rootPath);
        console.log('✅ Initial scan complete');
    }
    
    async validateDirectory(dirPath) {
        // Check if required files exist
        const requiredFiles = await this.generator.getRequiredFilesForDirectory(dirPath);
        const missingFiles = requiredFiles.filter(f => !fs.existsSync(path.join(dirPath, f.name)));
        
        if (missingFiles.length > 0) {
            console.log(`📁 ${dirPath} missing required files:`);
            missingFiles.forEach(f => console.log(`   - ${f.name}`));
            
            this.emit('missing-required-files', {
                directory: dirPath,
                missing: missingFiles
            });
        }
    }
    
    shouldIgnorePath(filePath) {
        const ignorePaths = [
            '.git',
            'node_modules',
            '.rules',
            'logs',
            'temp',
            'dist',
            'build',
            '.next',
            '__pycache__'
        ];
        
        return ignorePaths.some(ignore => filePath.includes(ignore));
    }
    
    shouldHaveLocalRules(dirPath) {
        // Directories that should have local rules
        const needsRules = [
            'src',
            'frontend',
            'backend',
            'api',
            'components',
            'services',
            'features'
        ];
        
        const dirName = path.basename(dirPath);
        return needsRules.includes(dirName);
    }
    
    getFileSizeLimit(filePath) {
        const ext = path.extname(filePath);
        
        const limits = {
            '.tsx': 200 * 80, // 200 lines * 80 chars average
            '.ts': 300 * 80,
            '.js': 300 * 80,
            '.py': 300 * 80,
            '.css': 500 * 80,
            '.json': 1000 * 80
        };
        
        return limits[ext] || 500 * 80; // Default 500 lines
    }
    
    async applyFileSpecificRules(filePath) {
        const ext = path.extname(filePath);
        const fileName = path.basename(filePath, ext);
        
        // React component files
        if (ext === '.tsx' && /^[A-Z]/.test(fileName)) {
            // Could add component-specific checks here
        }
        
        // Service files
        if (fileName.endsWith('Service') || fileName.endsWith('service')) {
            // Service-specific rules
        }
        
        // Hook files
        if (fileName.startsWith('use') && (ext === '.ts' || ext === '.tsx')) {
            // Hook-specific rules
        }
    }
    
    async updateParentReadme(dirPath) {
        const parentDir = path.dirname(dirPath);
        const readmePath = path.join(parentDir, 'README.md');
        
        if (fs.existsSync(readmePath)) {
            // Could update README with new subdirectory info
            console.log(`📝 Parent README exists, consider updating: ${readmePath}`);
        }
    }
    
    async updateIndexes(filePath) {
        const dir = path.dirname(filePath);
        const indexPath = path.join(dir, 'index.ts');
        
        // Only for TypeScript/JavaScript projects
        if (fs.existsSync(indexPath) && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
            console.log(`📝 Consider updating index: ${indexPath}`);
        }
    }
    
    getStatus() {
        return {
            enabled: this.enabled,
            dryRun: this.dryRun,
            stats: this.stats,
            watcher: this.watcher.getStatus(),
            validator: this.validator.getStatus()
        };
    }
}

// Export for use as module
module.exports = RulesOrchestrator;

// CLI execution
if (require.main === module) {
    const orchestrator = new RulesOrchestrator({
        dryRun: process.argv.includes('--dry-run'),
        enabled: !process.argv.includes('--disabled')
    });
    
    orchestrator.on('initialized', () => {
        console.log('Rules Orchestrator is running...');
    });
    
    orchestrator.on('error', (error) => {
        console.error('Orchestrator error:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down Rules Orchestrator...');
        await orchestrator.stop();
        process.exit(0);
    });
}