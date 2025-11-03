#!/usr/bin/env node

/**
 * backup-verifier.js
 * Confirms backup integrity and completeness
 * Ensures all files needed to restart the kernel are present
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class BackupVerifier {
    constructor(backupPath) {
        this.backupPath = backupPath || path.join(__dirname, '../../vault/temp_restore');
        this.logsPath = path.join(__dirname, '../../vault/logs');
        this.verificationResults = {
            timestamp: Date.now(),
            path: this.backupPath,
            checks: {},
            issues: [],
            score: 0,
            status: 'pending'
        };
    }
    
    /**
     * Core files required for kernel restart
     */
    getCoreFiles() {
        return [
            'cal-riven-operator.js',
            'blessing.json',
            'soul-chain.sig',
            'build-mirror.sh',
            'entry.html'
        ];
    }
    
    /**
     * Core directories required
     */
    getCoreDirectories() {
        return [
            'vault/config',
            'vault/logs',
            'api',
            'runtime'
        ];
    }
    
    /**
     * Optional but recommended files
     */
    getOptionalFiles() {
        return [
            'CLAUDE.md',
            'README.md',
            'mirror-launch-loop.js',
            'platform-launch-seed.json'
        ];
    }
    
    /**
     * Files that should NOT be in backup
     */
    getExcludedFiles() {
        return [
            '.DS_Store',
            'node_modules',
            '*.log',
            '*.tmp',
            '.git'
        ];
    }
    
    /**
     * Run complete verification
     */
    async runVerification() {
        console.log('🔍 Starting backup verification...');
        console.log(`📁 Verifying: ${this.backupPath}\n`);
        
        // Check if backup path exists
        if (!fs.existsSync(this.backupPath)) {
            this.verificationResults.status = 'failed';
            this.verificationResults.error = 'Backup path does not exist';
            return this.verificationResults;
        }
        
        // Run all checks
        await this.checkCoreFiles();
        await this.checkCoreDirectories();
        await this.checkOptionalFiles();
        await this.checkFileIntegrity();
        await this.checkForJunkFiles();
        await this.checkConfigConsistency();
        await this.calculateVerificationScore();
        
        // Determine final status
        this.determineFinalStatus();
        
        // Save results
        await this.saveVerificationResults();
        
        return this.verificationResults;
    }
    
    /**
     * Check for core files
     */
    async checkCoreFiles() {
        console.log('📋 Checking core files...');
        const coreFiles = this.getCoreFiles();
        const results = {};
        
        for (const file of coreFiles) {
            const filePath = path.join(this.backupPath, file);
            const exists = fs.existsSync(filePath);
            
            results[file] = {
                exists: exists,
                required: true
            };
            
            if (exists) {
                const stats = fs.statSync(filePath);
                results[file].size = stats.size;
                results[file].modified = stats.mtime;
                results[file].hash = await this.hashFile(filePath);
                console.log(`  ✅ ${file} (${this.formatBytes(stats.size)})`);
            } else {
                console.log(`  ❌ ${file} (MISSING)`);
                this.verificationResults.issues.push({
                    type: 'missing_core_file',
                    file: file,
                    severity: 'critical'
                });
            }
        }
        
        this.verificationResults.checks.coreFiles = results;
    }
    
    /**
     * Check for core directories
     */
    async checkCoreDirectories() {
        console.log('\n📁 Checking core directories...');
        const coreDirs = this.getCoreDirectories();
        const results = {};
        
        for (const dir of coreDirs) {
            const dirPath = path.join(this.backupPath, dir);
            const exists = fs.existsSync(dirPath);
            
            results[dir] = {
                exists: exists,
                required: true
            };
            
            if (exists && fs.statSync(dirPath).isDirectory()) {
                const fileCount = this.countFiles(dirPath);
                const totalSize = this.getDirectorySize(dirPath);
                
                results[dir].fileCount = fileCount;
                results[dir].totalSize = totalSize;
                
                console.log(`  ✅ ${dir} (${fileCount} files, ${this.formatBytes(totalSize)})`);
            } else {
                console.log(`  ❌ ${dir} (MISSING)`);
                this.verificationResults.issues.push({
                    type: 'missing_core_directory',
                    directory: dir,
                    severity: 'critical'
                });
            }
        }
        
        this.verificationResults.checks.coreDirectories = results;
    }
    
    /**
     * Check optional files
     */
    async checkOptionalFiles() {
        console.log('\n📄 Checking optional files...');
        const optionalFiles = this.getOptionalFiles();
        const results = {};
        
        for (const file of optionalFiles) {
            const filePath = path.join(this.backupPath, file);
            const exists = fs.existsSync(filePath);
            
            results[file] = {
                exists: exists,
                required: false
            };
            
            if (exists) {
                const stats = fs.statSync(filePath);
                results[file].size = stats.size;
                console.log(`  ✅ ${file} (${this.formatBytes(stats.size)})`);
            } else {
                console.log(`  ⚠️  ${file} (optional, not found)`);
            }
        }
        
        this.verificationResults.checks.optionalFiles = results;
    }
    
    /**
     * Check file integrity
     */
    async checkFileIntegrity() {
        console.log('\n🔒 Checking file integrity...');
        
        // Check blessing.json structure
        const blessingPath = path.join(this.backupPath, 'blessing.json');
        if (fs.existsSync(blessingPath)) {
            try {
                const blessing = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
                if (blessing.status && blessing.can_propagate !== undefined) {
                    console.log('  ✅ blessing.json structure valid');
                    this.verificationResults.checks.blessingValid = true;
                } else {
                    console.log('  ⚠️  blessing.json missing required fields');
                    this.verificationResults.issues.push({
                        type: 'invalid_structure',
                        file: 'blessing.json',
                        severity: 'warning'
                    });
                }
            } catch (e) {
                console.log('  ❌ blessing.json is corrupted');
                this.verificationResults.issues.push({
                    type: 'corrupted_file',
                    file: 'blessing.json',
                    severity: 'critical',
                    error: e.message
                });
            }
        }
        
        // Check soul-chain.sig
        const soulChainPath = path.join(this.backupPath, 'soul-chain.sig');
        if (fs.existsSync(soulChainPath)) {
            const content = fs.readFileSync(soulChainPath, 'utf8').trim();
            if (content.startsWith('SOUL-CHAIN:')) {
                console.log('  ✅ soul-chain.sig format valid');
                this.verificationResults.checks.soulChainValid = true;
            } else {
                console.log('  ⚠️  soul-chain.sig format unexpected');
            }
        }
    }
    
    /**
     * Check for junk files
     */
    async checkForJunkFiles() {
        console.log('\n🗑️  Checking for excluded files...');
        const excludedPatterns = this.getExcludedFiles();
        const junkFiles = [];
        
        this.walkDirectory(this.backupPath, (filePath) => {
            const relative = path.relative(this.backupPath, filePath);
            
            for (const pattern of excludedPatterns) {
                if (pattern.includes('*')) {
                    // Simple wildcard matching
                    const regex = new RegExp(pattern.replace('*', '.*'));
                    if (regex.test(relative)) {
                        junkFiles.push(relative);
                    }
                } else if (relative.includes(pattern)) {
                    junkFiles.push(relative);
                }
            }
        });
        
        if (junkFiles.length > 0) {
            console.log(`  ⚠️  Found ${junkFiles.length} excluded files:`);
            junkFiles.slice(0, 5).forEach(file => {
                console.log(`     - ${file}`);
            });
            if (junkFiles.length > 5) {
                console.log(`     ... and ${junkFiles.length - 5} more`);
            }
            
            this.verificationResults.checks.junkFiles = junkFiles;
            this.verificationResults.issues.push({
                type: 'junk_files_present',
                count: junkFiles.length,
                severity: 'minor'
            });
        } else {
            console.log('  ✅ No excluded files found');
        }
    }
    
    /**
     * Check configuration consistency
     */
    async checkConfigConsistency() {
        console.log('\n⚙️  Checking configuration consistency...');
        
        const configPath = path.join(this.backupPath, 'vault/config');
        if (fs.existsSync(configPath)) {
            const configFiles = fs.readdirSync(configPath)
                .filter(f => f.endsWith('.json'));
            
            let validConfigs = 0;
            let invalidConfigs = 0;
            
            for (const configFile of configFiles) {
                const filePath = path.join(configPath, configFile);
                try {
                    JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    validConfigs++;
                } catch (e) {
                    invalidConfigs++;
                    this.verificationResults.issues.push({
                        type: 'invalid_config',
                        file: `vault/config/${configFile}`,
                        severity: 'warning',
                        error: e.message
                    });
                }
            }
            
            console.log(`  ✅ Valid configs: ${validConfigs}`);
            if (invalidConfigs > 0) {
                console.log(`  ❌ Invalid configs: ${invalidConfigs}`);
            }
            
            this.verificationResults.checks.configConsistency = {
                valid: validConfigs,
                invalid: invalidConfigs,
                total: configFiles.length
            };
        }
    }
    
    /**
     * Calculate verification score
     */
    async calculateVerificationScore() {
        let score = 100;
        
        // Deduct points for issues
        for (const issue of this.verificationResults.issues) {
            switch (issue.severity) {
                case 'critical':
                    score -= 25;
                    break;
                case 'warning':
                    score -= 10;
                    break;
                case 'minor':
                    score -= 5;
                    break;
            }
        }
        
        // Ensure score doesn't go below 0
        this.verificationResults.score = Math.max(0, score);
    }
    
    /**
     * Determine final status
     */
    determineFinalStatus() {
        const criticalIssues = this.verificationResults.issues
            .filter(i => i.severity === 'critical').length;
        
        if (criticalIssues > 0) {
            this.verificationResults.status = 'failed';
        } else if (this.verificationResults.score >= 90) {
            this.verificationResults.status = 'passed';
        } else if (this.verificationResults.score >= 70) {
            this.verificationResults.status = 'passed_with_warnings';
        } else {
            this.verificationResults.status = 'needs_attention';
        }
    }
    
    /**
     * Save verification results
     */
    async saveVerificationResults() {
        const outputPath = path.join(this.logsPath, 'backup-verification.json');
        
        // Ensure logs directory exists
        if (!fs.existsSync(this.logsPath)) {
            fs.mkdirSync(this.logsPath, { recursive: true });
        }
        
        fs.writeFileSync(
            outputPath,
            JSON.stringify(this.verificationResults, null, 2)
        );
        
        console.log(`\n📊 Verification results saved to: ${outputPath}`);
    }
    
    /**
     * Utility functions
     */
    
    async hashFile(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }
    
    countFiles(dirPath) {
        let count = 0;
        this.walkDirectory(dirPath, () => count++);
        return count;
    }
    
    getDirectorySize(dirPath) {
        let totalSize = 0;
        this.walkDirectory(dirPath, (filePath) => {
            totalSize += fs.statSync(filePath).size;
        });
        return totalSize;
    }
    
    walkDirectory(dirPath, callback) {
        if (!fs.existsSync(dirPath)) return;
        
        const files = fs.readdirSync(dirPath);
        
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                this.walkDirectory(filePath, callback);
            } else {
                callback(filePath);
            }
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Generate summary report
     */
    generateSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Status: ${this.verificationResults.status.toUpperCase()}`);
        console.log(`Score: ${this.verificationResults.score}/100`);
        console.log(`Issues: ${this.verificationResults.issues.length}`);
        
        if (this.verificationResults.issues.length > 0) {
            console.log('\nIssues found:');
            const issueCounts = {};
            
            for (const issue of this.verificationResults.issues) {
                issueCounts[issue.severity] = (issueCounts[issue.severity] || 0) + 1;
            }
            
            for (const [severity, count] of Object.entries(issueCounts)) {
                console.log(`  ${severity}: ${count}`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (this.verificationResults.status === 'passed') {
            console.log('✅ Backup is complete and ready for kernel restart!');
        } else if (this.verificationResults.status === 'failed') {
            console.log('❌ Backup is incomplete and cannot restart the kernel.');
        } else {
            console.log('⚠️  Backup may work but has some issues to address.');
        }
    }
}

// Run verification if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const backupPath = args[0] || path.join(__dirname, '../../vault/temp_restore');
    
    const verifier = new BackupVerifier(backupPath);
    
    verifier.runVerification()
        .then(() => {
            verifier.generateSummary();
            process.exit(verifier.verificationResults.status === 'failed' ? 1 : 0);
        })
        .catch(error => {
            console.error('❌ Verification failed:', error.message);
            process.exit(1);
        });
}

module.exports = BackupVerifier;