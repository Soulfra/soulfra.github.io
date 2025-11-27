#!/usr/bin/env node
/**
 * ValidationDaemon.js
 * Continuous validation of project structure against SOULFRA rules
 * Runs periodic checks and reports violations
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const RulesEnforcer = require('./RulesEnforcer');

class ValidationDaemon extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Fix path to point to actual project root (go up 2 levels from orchestrator dir)
        this.rootPath = options.rootPath || path.resolve(__dirname, '../..');
        this.rulesPath = options.rulesPath || path.join(this.rootPath, '.rules');
        this.interval = options.interval || 60000; // 1 minute default
        this.enabled = options.enabled !== false;
        
        this.enforcer = new RulesEnforcer({
            rulesPath: this.rulesPath,
            dryRun: true // Daemon only reports, doesn't fix
        });
        
        this.state = {
            running: false,
            lastCheck: null,
            totalViolations: 0,
            criticalViolations: 0,
            violationsByType: {},
            fileViolations: new Map(),
            directoryViolations: new Map()
        };
        
        this.timer = null;
        // Fix paths to write to .rules directory at root level
        this.violationsLog = path.join(this.rootPath, '.rules/violations.log');
        this.reportPath = path.join(this.rootPath, '.rules/validation-report.json');
    }
    
    async start() {
        if (this.state.running) {
            console.log('Validation daemon already running');
            return;
        }
        
        this.state.running = true;
        console.log(`🔍 Starting Validation Daemon (interval: ${this.interval}ms)`);
        
        // Initial validation
        await this.runValidation();
        
        // Schedule periodic validations
        this.timer = setInterval(async () => {
            await this.runValidation();
        }, this.interval);
        
        this.emit('started');
    }
    
    async stop() {
        if (!this.state.running) {
            return;
        }
        
        this.state.running = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Final report
        await this.generateReport();
        
        console.log('✅ Validation Daemon stopped');
        this.emit('stopped');
    }
    
    async runValidation() {
        console.log('🔍 Running validation check...');
        const startTime = Date.now();
        
        // Clear previous violations
        this.state.fileViolations.clear();
        this.state.directoryViolations.clear();
        this.state.totalViolations = 0;
        this.state.criticalViolations = 0;
        this.state.violationsByType = {};
        
        try {
            // Validate entire project structure
            await this.validateDirectory(this.rootPath);
            
            // Process results
            this.state.lastCheck = new Date().toISOString();
            const duration = Date.now() - startTime;
            
            // Log summary
            const summary = `Validation complete: ${this.state.totalViolations} violations found (${duration}ms)`;
            console.log(this.state.totalViolations > 0 ? `⚠️  ${summary}` : `✅ ${summary}`);
            
            // Write detailed log
            await this.writeViolationsLog();
            
            // Generate report
            await this.generateReport();
            
            // Emit events for violations
            if (this.state.totalViolations > 0) {
                this.emit('violations-found', {
                    total: this.state.totalViolations,
                    critical: this.state.criticalViolations,
                    byType: this.state.violationsByType
                });
            }
            
        } catch (error) {
            console.error('Validation error:', error);
            this.emit('error', error);
        }
    }
    
    async validateDirectory(dirPath, depth = 0) {
        // Skip ignored directories
        if (this.shouldIgnore(dirPath)) {
            return;
        }
        
        // Validate directory itself
        const dirViolations = await this.enforcer.checkDirectoryNaming(dirPath);
        if (dirViolations.length > 0) {
            this.state.directoryViolations.set(dirPath, dirViolations);
            this.processViolations(dirViolations, 'directory');
        }
        
        // Read directory contents
        let entries;
        try {
            entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        } catch (error) {
            console.error(`Cannot read directory ${dirPath}:`, error.message);
            return;
        }
        
        // Process each entry
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (this.shouldIgnore(fullPath)) {
                continue;
            }
            
            if (entry.isDirectory()) {
                // Check depth limit
                if (depth < 10) { // Prevent infinite recursion
                    await this.validateDirectory(fullPath, depth + 1);
                }
            } else if (entry.isFile()) {
                await this.validateFile(fullPath);
            }
        }
    }
    
    async validateFile(filePath) {
        const violations = [];
        
        try {
            // Run all validation checks
            const checks = await Promise.all([
                this.enforcer.checkFileNaming(filePath),
                this.enforcer.checkFileStructure(filePath),
                this.enforcer.checkCodeStyle(filePath),
                this.enforcer.checkSecurity(filePath)
            ]);
            
            violations.push(...checks.flat());
            
            if (violations.length > 0) {
                this.state.fileViolations.set(filePath, violations);
                this.processViolations(violations, 'file');
            }
            
        } catch (error) {
            console.error(`Error validating ${filePath}:`, error.message);
        }
        
        return violations;
    }
    
    processViolations(violations, type) {
        for (const violation of violations) {
            this.state.totalViolations++;
            
            // Track by severity
            if (violation.severity === 'critical') {
                this.state.criticalViolations++;
            }
            
            // Track by type
            const violationType = violation.rule || 'unknown';
            if (!this.state.violationsByType[violationType]) {
                this.state.violationsByType[violationType] = 0;
            }
            this.state.violationsByType[violationType]++;
            
            // Emit specific violation
            this.emit('violation-found', violation);
        }
    }
    
    async writeViolationsLog() {
        const logContent = [];
        
        logContent.push(`SOULFRA Rules Validation Report`);
        logContent.push(`Generated: ${this.state.lastCheck}`);
        logContent.push(`Total Violations: ${this.state.totalViolations}`);
        logContent.push(`Critical Violations: ${this.state.criticalViolations}`);
        logContent.push('');
        
        // Directory violations
        if (this.state.directoryViolations.size > 0) {
            logContent.push('=== DIRECTORY VIOLATIONS ===');
            for (const [dir, violations] of this.state.directoryViolations) {
                logContent.push(`\nDirectory: ${dir}`);
                for (const v of violations) {
                    logContent.push(`  - ${v.rule}`);
                    if (v.suggestion) logContent.push(`    Suggestion: ${v.suggestion}`);
                    if (v.autoFixable) logContent.push(`    ✅ Auto-fixable`);
                }
            }
            logContent.push('');
        }
        
        // File violations
        if (this.state.fileViolations.size > 0) {
            logContent.push('=== FILE VIOLATIONS ===');
            for (const [file, violations] of this.state.fileViolations) {
                logContent.push(`\nFile: ${file}`);
                for (const v of violations) {
                    logContent.push(`  - ${v.rule}`);
                    if (v.line) logContent.push(`    Line: ${v.line}`);
                    if (v.suggestion) logContent.push(`    Suggestion: ${v.suggestion}`);
                    if (v.autoFixable) logContent.push(`    ✅ Auto-fixable`);
                }
            }
        }
        
        // Summary by type
        logContent.push('');
        logContent.push('=== SUMMARY BY VIOLATION TYPE ===');
        for (const [type, count] of Object.entries(this.state.violationsByType)) {
            logContent.push(`${type}: ${count}`);
        }
        
        // Write to log file
        try {
            await fs.promises.writeFile(this.violationsLog, logContent.join('\n'));
        } catch (error) {
            console.error('Failed to write violations log:', error);
        }
    }
    
    async generateReport() {
        const report = {
            timestamp: this.state.lastCheck,
            summary: {
                totalViolations: this.state.totalViolations,
                criticalViolations: this.state.criticalViolations,
                filesWithViolations: this.state.fileViolations.size,
                directoriesWithViolations: this.state.directoryViolations.size
            },
            violationsByType: this.state.violationsByType,
            topViolations: this.getTopViolations(),
            criticalFiles: this.getCriticalFiles(),
            trends: this.calculateTrends()
        };
        
        try {
            await fs.promises.writeFile(
                this.reportPath,
                JSON.stringify(report, null, 2)
            );
        } catch (error) {
            console.error('Failed to write validation report:', error);
        }
        
        return report;
    }
    
    getTopViolations() {
        const violationCounts = {};
        
        // Count all violations
        for (const violations of this.state.fileViolations.values()) {
            for (const v of violations) {
                const key = v.rule || 'unknown';
                violationCounts[key] = (violationCounts[key] || 0) + 1;
            }
        }
        
        // Sort and get top 10
        return Object.entries(violationCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([rule, count]) => ({ rule, count }));
    }
    
    getCriticalFiles() {
        const critical = [];
        
        for (const [file, violations] of this.state.fileViolations) {
            const criticalCount = violations.filter(v => v.severity === 'critical').length;
            if (criticalCount > 0) {
                critical.push({
                    file,
                    criticalViolations: criticalCount,
                    totalViolations: violations.length
                });
            }
        }
        
        return critical.sort((a, b) => b.criticalViolations - a.criticalViolations);
    }
    
    calculateTrends() {
        // In a real implementation, this would compare with historical data
        return {
            improving: false,
            newViolations: this.state.totalViolations,
            fixedViolations: 0,
            trendsAvailable: false
        };
    }
    
    shouldIgnore(filePath) {
        const ignorePaths = [
            '.git',
            'node_modules',
            '.rules/orchestrator', // Don't validate ourselves
            'logs',
            'temp',
            'dist',
            'build',
            '.next',
            '__pycache__',
            'coverage',
            '.nyc_output'
        ];
        
        // Also ignore files
        const ignoreFiles = [
            '.DS_Store',
            'Thumbs.db',
            '*.log',
            '*.tmp'
        ];
        
        const normalizedPath = filePath.replace(/\\/g, '/');
        
        // Check path patterns
        for (const ignore of ignorePaths) {
            if (normalizedPath.includes(ignore)) {
                return true;
            }
        }
        
        // Check file patterns
        const fileName = path.basename(filePath);
        for (const pattern of ignoreFiles) {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                if (regex.test(fileName)) {
                    return true;
                }
            } else if (fileName === pattern) {
                return true;
            }
        }
        
        return false;
    }
    
    getStatus() {
        return {
            running: this.state.running,
            lastCheck: this.state.lastCheck,
            totalViolations: this.state.totalViolations,
            criticalViolations: this.state.criticalViolations,
            violationsByType: { ...this.state.violationsByType }
        };
    }
    
    async getViolationsForFile(filePath) {
        return this.state.fileViolations.get(filePath) || [];
    }
    
    async getViolationsForDirectory(dirPath) {
        return this.state.directoryViolations.get(dirPath) || [];
    }
}

module.exports = ValidationDaemon;

// CLI execution
if (require.main === module) {
    const daemon = new ValidationDaemon({
        interval: process.argv.includes('--fast') ? 10000 : 60000
    });
    
    daemon.on('started', () => {
        console.log('Validation daemon is running...');
    });
    
    daemon.on('violations-found', (summary) => {
        console.log(`\n⚠️  Violations detected:`);
        console.log(`   Total: ${summary.total}`);
        console.log(`   Critical: ${summary.critical}`);
    });
    
    daemon.on('error', (error) => {
        console.error('Daemon error:', error);
    });
    
    daemon.start();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down validation daemon...');
        await daemon.stop();
        process.exit(0);
    });
}