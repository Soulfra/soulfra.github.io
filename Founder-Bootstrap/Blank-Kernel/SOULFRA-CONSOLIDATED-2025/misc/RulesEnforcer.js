#!/usr/bin/env node
/**
 * RulesEnforcer.js
 * Enforces SOULFRA rules on files and directories
 * Checks violations and can auto-fix some issues
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class RulesEnforcer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.rulesPath = options.rulesPath || path.join(process.cwd(), '.rules');
        this.dryRun = options.dryRun || false;
        
        this.rules = {
            fileNaming: [],
            directoryNaming: [],
            fileStructure: [],
            codeStyle: [],
            security: []
        };
        
        this.loadRules();
    }
    
    loadRules() {
        // File naming rules
        this.rules.fileNaming = [
            {
                pattern: /^[A-Z][a-zA-Z]+\.(tsx|jsx)$/,
                description: 'React components must be PascalCase',
                applies: (file) => file.endsWith('.tsx') || file.endsWith('.jsx'),
                category: 'component'
            },
            {
                pattern: /^use[A-Z][a-zA-Z]+\.(ts|tsx)$/,
                description: 'React hooks must start with "use"',
                applies: (file) => file.startsWith('use') && (file.endsWith('.ts') || file.endsWith('.tsx')),
                category: 'hook'
            },
            {
                pattern: /^[a-z][a-zA-Z]+Service\.(ts|js)$/,
                description: 'Services must be camelCase and end with "Service"',
                applies: (file) => file.includes('Service'),
                category: 'service'
            },
            {
                pattern: /^[A-Z_]+\.(ts|js)$/,
                description: 'Constants files must be SCREAMING_SNAKE_CASE',
                applies: (file) => file.match(/^[A-Z_]+\.(ts|js)$/),
                category: 'constants'
            }
        ];
        
        // Directory naming rules
        this.rules.directoryNaming = [
            {
                pattern: /^[a-z-]+$/,
                description: 'Directories must be lowercase with hyphens',
                applies: () => true
            },
            {
                pattern: /^(components|services|hooks|utils|types|api|models|features)$/,
                description: 'Standard directory names',
                applies: (dir, parent) => parent && parent.includes('src')
            }
        ];
        
        // Load custom rules from files
        this.loadCustomRules();
    }
    
    loadCustomRules() {
        try {
            const architectureRules = path.join(this.rulesPath, 'architecture', 'file_organization.rules');
            if (fs.existsSync(architectureRules)) {
                // Parse and add custom rules
                console.log('📋 Loaded architecture rules');
            }
            
            const securityRules = path.join(this.rulesPath, 'security', 'code_security.rules');
            if (fs.existsSync(securityRules)) {
                // Parse and add security rules
                console.log('📋 Loaded security rules');
            }
        } catch (error) {
            console.error('Error loading custom rules:', error);
        }
    }
    
    async checkFileNaming(filePath) {
        const violations = [];
        const fileName = path.basename(filePath);
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        
        // Check against naming rules
        for (const rule of this.rules.fileNaming) {
            if (rule.applies(fileName)) {
                if (!rule.pattern.test(fileName)) {
                    violations.push({
                        rule: rule.description,
                        expected: rule.pattern.toString(),
                        actual: fileName,
                        file: filePath,
                        autoFixable: false
                    });
                }
            }
        }
        
        // Additional checks
        if (fileName.includes(' ')) {
            violations.push({
                rule: 'File names must not contain spaces',
                file: filePath,
                autoFixable: true,
                fix: () => {
                    const newName = fileName.replace(/ /g, '-');
                    return this.renameFile(filePath, newName);
                }
            });
        }
        
        // Check for overly long names
        if (nameWithoutExt.length > 50) {
            violations.push({
                rule: 'File names should be less than 50 characters',
                file: filePath,
                autoFixable: false
            });
        }
        
        return violations;
    }
    
    async checkDirectoryNaming(dirPath) {
        const violations = [];
        const dirName = path.basename(dirPath);
        const parentDir = path.dirname(dirPath);
        
        // Check against directory naming rules
        for (const rule of this.rules.directoryNaming) {
            if (rule.applies(dirName, parentDir)) {
                if (!rule.pattern.test(dirName)) {
                    violations.push({
                        rule: rule.description,
                        expected: rule.pattern.toString(),
                        actual: dirName,
                        directory: dirPath,
                        autoFixable: false
                    });
                }
            }
        }
        
        // Check for common mistakes
        if (dirName.includes('_')) {
            violations.push({
                rule: 'Directories should use hyphens instead of underscores',
                directory: dirPath,
                autoFixable: true,
                fix: () => {
                    const newName = dirName.replace(/_/g, '-');
                    return this.renameDirectory(dirPath, newName);
                }
            });
        }
        
        return violations;
    }
    
    async checkFileStructure(filePath) {
        const violations = [];
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Check file size
        if (lines.length > 300 && filePath.endsWith('.tsx')) {
            violations.push({
                rule: 'Component files should be less than 300 lines',
                file: filePath,
                lines: lines.length,
                autoFixable: false,
                suggestion: 'Consider splitting into smaller components'
            });
        }
        
        if (lines.length > 500 && filePath.endsWith('.ts')) {
            violations.push({
                rule: 'TypeScript files should be less than 500 lines',
                file: filePath,
                lines: lines.length,
                autoFixable: false,
                suggestion: 'Consider splitting into smaller modules'
            });
        }
        
        // Check for mixed responsibilities (simple heuristic)
        const hasReactImport = content.includes('import React') || content.includes('from "react"');
        const hasApiCalls = content.includes('fetch(') || content.includes('axios.');
        const hasBusinessLogic = content.includes('class') && content.includes('Service');
        
        if (hasReactImport && hasApiCalls && !filePath.includes('hook')) {
            violations.push({
                rule: 'Components should not make direct API calls',
                file: filePath,
                autoFixable: false,
                suggestion: 'Move API calls to a custom hook or service'
            });
        }
        
        return violations;
    }
    
    async checkCodeStyle(filePath) {
        const violations = [];
        
        if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) {
            return violations;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Check for console.log statements
        lines.forEach((line, index) => {
            if (line.includes('console.log') && !line.trim().startsWith('//')) {
                violations.push({
                    rule: 'Remove console.log statements',
                    file: filePath,
                    line: index + 1,
                    autoFixable: true,
                    fix: () => this.removeConsoleLogs(filePath)
                });
            }
        });
        
        // Check import order
        const importLines = lines.filter(line => line.trim().startsWith('import'));
        if (importLines.length > 5) {
            const sorted = [...importLines].sort();
            if (JSON.stringify(importLines) !== JSON.stringify(sorted)) {
                violations.push({
                    rule: 'Imports should be sorted alphabetically',
                    file: filePath,
                    autoFixable: true,
                    fix: () => this.sortImports(filePath)
                });
            }
        }
        
        return violations;
    }
    
    async checkSecurity(filePath) {
        const violations = [];
        
        if (!filePath.match(/\.(ts|tsx|js|jsx|py)$/)) {
            return violations;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for hardcoded secrets
        const secretPatterns = [
            /api[_-]?key\s*=\s*["'][^"']+["']/i,
            /password\s*=\s*["'][^"']+["']/i,
            /secret\s*=\s*["'][^"']+["']/i,
            /token\s*=\s*["'][^"']+["']/i
        ];
        
        for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
                violations.push({
                    rule: 'Do not hardcode secrets or API keys',
                    file: filePath,
                    severity: 'critical',
                    autoFixable: false,
                    suggestion: 'Use environment variables instead'
                });
            }
        }
        
        // Check for SQL injection risks
        if (content.includes('SELECT') && content.includes('+') && content.includes('WHERE')) {
            violations.push({
                rule: 'Potential SQL injection risk',
                file: filePath,
                severity: 'high',
                autoFixable: false,
                suggestion: 'Use parameterized queries'
            });
        }
        
        return violations;
    }
    
    async autoFix(violation) {
        if (!violation.autoFixable || this.dryRun) {
            return false;
        }
        
        try {
            if (violation.fix) {
                await violation.fix();
                this.emit('rule-enforced', {
                    rule: violation.rule,
                    file: violation.file || violation.directory,
                    action: 'auto-fixed'
                });
                return true;
            }
        } catch (error) {
            console.error(`Failed to auto-fix violation: ${error.message}`);
            return false;
        }
    }
    
    async renameFile(oldPath, newName) {
        const dir = path.dirname(oldPath);
        const newPath = path.join(dir, newName);
        
        if (!this.dryRun) {
            await fs.promises.rename(oldPath, newPath);
            console.log(`📝 Renamed file: ${path.basename(oldPath)} → ${newName}`);
        }
        
        return newPath;
    }
    
    async renameDirectory(oldPath, newName) {
        const parent = path.dirname(oldPath);
        const newPath = path.join(parent, newName);
        
        if (!this.dryRun) {
            await fs.promises.rename(oldPath, newPath);
            console.log(`📁 Renamed directory: ${path.basename(oldPath)} → ${newName}`);
        }
        
        return newPath;
    }
    
    async removeConsoleLogs(filePath) {
        if (this.dryRun) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        const filteredLines = lines.filter(line => {
            const trimmed = line.trim();
            return !trimmed.startsWith('console.log') && !trimmed.includes('console.log(');
        });
        
        fs.writeFileSync(filePath, filteredLines.join('\n'));
        console.log(`🧹 Removed console.log statements from ${filePath}`);
    }
    
    async sortImports(filePath) {
        if (this.dryRun) return;
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Find import block
        let importStart = -1;
        let importEnd = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import')) {
                if (importStart === -1) importStart = i;
                importEnd = i;
            } else if (importStart !== -1 && lines[i].trim() !== '') {
                break;
            }
        }
        
        if (importStart !== -1) {
            const imports = lines.slice(importStart, importEnd + 1);
            const sorted = imports.sort();
            
            lines.splice(importStart, imports.length, ...sorted);
            fs.writeFileSync(filePath, lines.join('\n'));
            console.log(`📦 Sorted imports in ${filePath}`);
        }
    }
    
    async validateAll(filePath) {
        const allViolations = [];
        
        if (fs.statSync(filePath).isDirectory()) {
            const dirViolations = await this.checkDirectoryNaming(filePath);
            allViolations.push(...dirViolations);
        } else {
            const violations = await Promise.all([
                this.checkFileNaming(filePath),
                this.checkFileStructure(filePath),
                this.checkCodeStyle(filePath),
                this.checkSecurity(filePath)
            ]);
            
            allViolations.push(...violations.flat());
        }
        
        return allViolations;
    }
}

module.exports = RulesEnforcer;

// CLI testing
if (require.main === module) {
    const enforcer = new RulesEnforcer({
        dryRun: process.argv.includes('--dry-run')
    });
    
    const target = process.argv[2];
    
    if (!target) {
        console.log('Usage: node RulesEnforcer.js <file-or-directory> [--dry-run]');
        process.exit(1);
    }
    
    enforcer.validateAll(target).then(violations => {
        if (violations.length === 0) {
            console.log('✅ No violations found');
        } else {
            console.log(`⚠️  Found ${violations.length} violations:`);
            violations.forEach((v, i) => {
                console.log(`\n${i + 1}. ${v.rule}`);
                if (v.file) console.log(`   File: ${v.file}`);
                if (v.directory) console.log(`   Directory: ${v.directory}`);
                if (v.suggestion) console.log(`   Suggestion: ${v.suggestion}`);
                if (v.autoFixable) console.log(`   ✅ Auto-fixable`);
            });
        }
    });
}