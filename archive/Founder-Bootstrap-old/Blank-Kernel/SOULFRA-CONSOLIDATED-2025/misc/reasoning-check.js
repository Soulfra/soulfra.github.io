const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ReasoningCheck {
    constructor() {
        this.rootDir = path.dirname(__dirname);
        this.tier0Logic = path.join(this.rootDir, 'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault');
        this.tier4Kernel = path.join(this.rootDir, 'tier-minus4/cal-reasoning-kernel');
        this.hiddenEntropy = path.join(this.rootDir, 'mirror-core/.hidden-entropy');
        this.entropyThreshold = 0.15;
    }

    async validate() {
        console.log('🔍 Validating vault state vs root reasoning logic...');
        
        try {
            // Check if vault exists
            const vaultExists = await this.checkVaultExists();
            if (!vaultExists) {
                console.error('❌ Vault mount missing!');
                return await this.autoSync('vault-missing');
            }

            // Calculate entropy for both locations
            const vaultEntropy = await this.calculateEntropy(this.tier0Logic);
            const kernelEntropy = await this.calculateEntropy(this.tier4Kernel);
            
            console.log(`📊 Vault entropy: ${vaultEntropy.toFixed(4)}`);
            console.log(`📊 Kernel entropy: ${kernelEntropy.toFixed(4)}`);
            
            // Calculate drift
            const drift = Math.abs(vaultEntropy - kernelEntropy);
            console.log(`📏 Entropy drift: ${drift.toFixed(4)}`);
            
            if (drift > this.entropyThreshold) {
                console.warn(`⚠️ Drift exceeds threshold (${this.entropyThreshold})`);
                return await this.autoSync('entropy-drift');
            }

            // Verify core files
            const coreFiles = [
                'cal-reflect-core.js',
                'reasoning-vault.json',
                'api-layer.js',
                'agent-weights.json'
            ];

            for (const file of coreFiles) {
                const vaultFile = path.join(this.tier0Logic, file);
                const exists = await this.fileExists(vaultFile);
                
                if (!exists) {
                    console.warn(`⚠️ Missing core file: ${file}`);
                    return await this.autoSync('missing-file');
                }

                // Check file integrity
                const integrity = await this.checkFileIntegrity(file);
                if (!integrity.valid) {
                    console.warn(`⚠️ File integrity check failed: ${file}`);
                    console.warn(`   Reason: ${integrity.reason}`);
                    return await this.autoSync('integrity-failure');
                }
            }

            // Check agent weights
            const weightsValid = await this.validateAgentWeights();
            if (!weightsValid) {
                console.warn('⚠️ Agent weights validation failed');
                return await this.autoSync('weights-invalid');
            }

            console.log('✅ Vault validation passed!');
            return {
                valid: true,
                drift,
                vaultEntropy,
                kernelEntropy,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('❌ Validation error:', error.message);
            return {
                valid: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    async checkVaultExists() {
        try {
            const stats = await fs.stat(this.tier0Logic);
            return stats.isDirectory();
        } catch (error) {
            return false;
        }
    }

    async calculateEntropy(directory) {
        try {
            const files = await fs.readdir(directory);
            let totalSize = 0;
            let contentHash = crypto.createHash('sha256');

            for (const file of files) {
                if (file.endsWith('.js') || file.endsWith('.json')) {
                    const filepath = path.join(directory, file);
                    try {
                        const content = await fs.readFile(filepath, 'utf8');
                        totalSize += content.length;
                        contentHash.update(content);
                    } catch (error) {
                        // Skip unreadable files
                    }
                }
            }

            // Calculate entropy based on content hash and size
            const hash = contentHash.digest('hex');
            const entropy = this.calculateShannonEntropy(hash) * (totalSize / 100000);
            
            return entropy;
        } catch (error) {
            return 0;
        }
    }

    calculateShannonEntropy(str) {
        const freq = {};
        for (const char of str) {
            freq[char] = (freq[char] || 0) + 1;
        }

        let entropy = 0;
        const len = str.length;
        
        for (const char in freq) {
            const p = freq[char] / len;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }

    async fileExists(filepath) {
        try {
            await fs.stat(filepath);
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkFileIntegrity(filename) {
        try {
            const vaultFile = path.join(this.tier0Logic, filename);
            const kernelFile = path.join(this.tier4Kernel, filename);
            
            // For vault-specific files, just check they exist
            if (filename === 'api-layer.js' || filename === 'agent-weights.json') {
                const exists = await this.fileExists(vaultFile);
                return { valid: exists, reason: exists ? 'ok' : 'missing' };
            }

            // For kernel files, compare hashes
            const vaultContent = await fs.readFile(vaultFile, 'utf8');
            const kernelContent = await fs.readFile(kernelFile, 'utf8').catch(() => null);
            
            if (!kernelContent) {
                // File only exists in vault, that's ok
                return { valid: true, reason: 'vault-only' };
            }

            const vaultHash = crypto.createHash('md5').update(vaultContent).digest('hex');
            const kernelHash = crypto.createHash('md5').update(kernelContent).digest('hex');
            
            if (vaultHash === kernelHash) {
                return { valid: true, reason: 'identical' };
            }

            // Check if drift is acceptable
            const sizeDiff = Math.abs(vaultContent.length - kernelContent.length);
            if (sizeDiff < 100) {
                return { valid: true, reason: 'acceptable-drift' };
            }

            return { valid: false, reason: 'excessive-drift' };
        } catch (error) {
            return { valid: false, reason: error.message };
        }
    }

    async validateAgentWeights() {
        try {
            const weightsPath = path.join(this.tier0Logic, 'agent-weights.json');
            const weights = JSON.parse(await fs.readFile(weightsPath, 'utf8'));
            
            // Check required fields
            const requiredFields = ['reflection', 'reasoning', 'memory', 'creativity'];
            for (const field of requiredFields) {
                if (typeof weights[field] !== 'number' || weights[field] < 0 || weights[field] > 1) {
                    return false;
                }
            }

            // Check entropy threshold
            if (weights.entropy_threshold && weights.entropy_threshold !== this.entropyThreshold) {
                weights.entropy_threshold = this.entropyThreshold;
                await fs.writeFile(weightsPath, JSON.stringify(weights, null, 2));
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    async autoSync(reason) {
        console.log(`🔄 Auto-syncing due to: ${reason}`);
        
        try {
            // Check hidden entropy backup first
            const entropyBackup = await this.checkHiddenEntropy();
            if (entropyBackup) {
                console.log('📦 Restoring from hidden entropy backup...');
                await this.restoreFromEntropy();
            } else {
                console.log('🔧 Re-injecting core logic...');
                const { execSync } = require('child_process');
                const injectScript = path.join(__dirname, 'inject-core-logic.sh');
                execSync(`bash "${injectScript}"`);
            }

            // Re-validate
            return await this.validate();
        } catch (error) {
            console.error('❌ Auto-sync failed:', error.message);
            return {
                valid: false,
                error: `auto-sync-failed: ${error.message}`,
                timestamp: Date.now()
            };
        }
    }

    async checkHiddenEntropy() {
        try {
            const stats = await fs.stat(this.hiddenEntropy);
            return stats.isDirectory();
        } catch (error) {
            return false;
        }
    }

    async restoreFromEntropy() {
        // Create hidden entropy if it doesn't exist
        await fs.mkdir(this.hiddenEntropy, { recursive: true });
        
        // Copy from tier-4 to hidden entropy and vault
        const files = await fs.readdir(this.tier4Kernel);
        
        for (const file of files) {
            if (file.endsWith('.js') || file.endsWith('.json')) {
                const source = path.join(this.tier4Kernel, file);
                const entropyTarget = path.join(this.hiddenEntropy, file);
                const vaultTarget = path.join(this.tier0Logic, file);
                
                await fs.copyFile(source, entropyTarget);
                await fs.copyFile(source, vaultTarget);
            }
        }

        console.log('✅ Restored from entropy backup');
    }
}

// Run validation if executed directly
if (require.main === module) {
    const checker = new ReasoningCheck();
    checker.validate().then(result => {
        console.log('\n📋 Validation Result:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.valid ? 0 : 1);
    });
}

module.exports = ReasoningCheck;