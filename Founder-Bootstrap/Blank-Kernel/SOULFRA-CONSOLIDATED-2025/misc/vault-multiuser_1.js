/**
 * Mirror Kernel Multi-User Vault System
 * Isolated vaults per Face ID with secure data separation
 */

const crypto = require('crypto');

class VaultMultiUser {
    constructor(options = {}) {
        this.encryptionAlgorithm = options.encryptionAlgorithm || 'aes-256-gcm';
        this.keyDerivation = options.keyDerivation || 'pbkdf2';
        this.iterations = options.iterations || 100000;
        
        // In-memory vault storage (replace with persistent storage)
        this.vaults = new Map();
        this.userVaultMappings = new Map();
        this.vaultMetadata = new Map();
        
        // Vault access tracking
        this.accessLog = new Map();
    }

    /**
     * Create new vault for authenticated user
     */
    async createVault(userId, biometricToken, vaultName, vaultData = {}) {
        try {
            // Verify biometric authentication
            const authValid = await this.verifyBiometricToken(userId, biometricToken);
            if (!authValid) {
                throw new Error('Biometric authentication failed');
            }

            // Generate unique vault ID
            const vaultId = this.generateVaultId(userId, vaultName);
            
            // Derive encryption key from biometric data
            const encryptionKey = await this.deriveVaultKey(userId, biometricToken, vaultId);
            
            // Encrypt vault data
            const encryptedData = await this.encryptVaultData(vaultData, encryptionKey);
            
            // Store vault
            this.vaults.set(vaultId, {
                id: vaultId,
                ownerId: userId,
                name: vaultName,
                data: encryptedData,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                accessCount: 0
            });

            // Update user vault mappings
            if (!this.userVaultMappings.has(userId)) {
                this.userVaultMappings.set(userId, new Set());
            }
            this.userVaultMappings.get(userId).add(vaultId);

            // Store metadata
            this.vaultMetadata.set(vaultId, {
                name: vaultName,
                ownerId: userId,
                createdAt: Date.now(),
                size: JSON.stringify(vaultData).length,
                encrypted: true,
                biometricProtected: true
            });

            this.logAccess(userId, vaultId, 'CREATE');

            return {
                success: true,
                vaultId: vaultId,
                name: vaultName,
                createdAt: Date.now()
            };

        } catch (error) {
            console.error('Vault creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Access vault with biometric authentication
     */
    async accessVault(userId, biometricToken, vaultId) {
        try {
            // Verify biometric authentication
            const authValid = await this.verifyBiometricToken(userId, biometricToken);
            if (!authValid) {
                throw new Error('Biometric authentication failed');
            }

            // Check vault ownership
            const vault = this.vaults.get(vaultId);
            if (!vault) {
                throw new Error('Vault not found');
            }

            if (vault.ownerId !== userId) {
                throw new Error('Access denied: Not vault owner');
            }

            // Derive decryption key
            const decryptionKey = await this.deriveVaultKey(userId, biometricToken, vaultId);
            
            // Decrypt vault data
            const decryptedData = await this.decryptVaultData(vault.data, decryptionKey);

            // Update access tracking
            vault.lastAccessed = Date.now();
            vault.accessCount++;
            this.vaults.set(vaultId, vault);

            this.logAccess(userId, vaultId, 'READ');

            return {
                success: true,
                vaultId: vaultId,
                name: vault.name,
                data: decryptedData,
                metadata: this.vaultMetadata.get(vaultId)
            };

        } catch (error) {
            console.error('Vault access failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update vault data
     */
    async updateVault(userId, biometricToken, vaultId, newData) {
        try {
            // Verify access first
            const accessResult = await this.accessVault(userId, biometricToken, vaultId);
            if (!accessResult.success) {
                return accessResult;
            }

            // Derive encryption key
            const encryptionKey = await this.deriveVaultKey(userId, biometricToken, vaultId);
            
            // Encrypt new data
            const encryptedData = await this.encryptVaultData(newData, encryptionKey);
            
            // Update vault
            const vault = this.vaults.get(vaultId);
            vault.data = encryptedData;
            vault.lastAccessed = Date.now();
            this.vaults.set(vaultId, vault);

            // Update metadata
            const metadata = this.vaultMetadata.get(vaultId);
            metadata.size = JSON.stringify(newData).length;
            this.vaultMetadata.set(vaultId, metadata);

            this.logAccess(userId, vaultId, 'UPDATE');

            return {
                success: true,
                vaultId: vaultId,
                updatedAt: Date.now()
            };

        } catch (error) {
            console.error('Vault update failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List user's vaults
     */
    async listUserVaults(userId, biometricToken) {
        try {
            // Verify biometric authentication
            const authValid = await this.verifyBiometricToken(userId, biometricToken);
            if (!authValid) {
                throw new Error('Biometric authentication failed');
            }

            const userVaults = this.userVaultMappings.get(userId) || new Set();
            const vaultList = [];

            for (const vaultId of userVaults) {
                const metadata = this.vaultMetadata.get(vaultId);
                const vault = this.vaults.get(vaultId);
                
                if (metadata && vault) {
                    vaultList.push({
                        id: vaultId,
                        name: metadata.name,
                        createdAt: metadata.createdAt,
                        lastAccessed: vault.lastAccessed,
                        accessCount: vault.accessCount,
                        size: metadata.size
                    });
                }
            }

            this.logAccess(userId, null, 'LIST');

            return {
                success: true,
                vaults: vaultList,
                count: vaultList.length
            };

        } catch (error) {
            console.error('Vault listing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete vault
     */
    async deleteVault(userId, biometricToken, vaultId) {
        try {
            // Verify biometric authentication
            const authValid = await this.verifyBiometricToken(userId, biometricToken);
            if (!authValid) {
                throw new Error('Biometric authentication failed');
            }

            // Check vault ownership
            const vault = this.vaults.get(vaultId);
            if (!vault) {
                throw new Error('Vault not found');
            }

            if (vault.ownerId !== userId) {
                throw new Error('Access denied: Not vault owner');
            }

            // Remove vault and metadata
            this.vaults.delete(vaultId);
            this.vaultMetadata.delete(vaultId);
            
            // Update user mappings
            const userVaults = this.userVaultMappings.get(userId);
            if (userVaults) {
                userVaults.delete(vaultId);
            }

            this.logAccess(userId, vaultId, 'DELETE');

            return {
                success: true,
                vaultId: vaultId,
                deletedAt: Date.now()
            };

        } catch (error) {
            console.error('Vault deletion failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Share vault with another user (enterprise feature)
     */
    async shareVault(ownerId, biometricToken, vaultId, recipientId, permissions = ['READ']) {
        try {
            // Verify owner's biometric authentication
            const authValid = await this.verifyBiometricToken(ownerId, biometricToken);
            if (!authValid) {
                throw new Error('Biometric authentication failed');
            }

            // Check vault ownership
            const vault = this.vaults.get(vaultId);
            if (!vault || vault.ownerId !== ownerId) {
                throw new Error('Vault not found or access denied');
            }

            // Create shared access record
            const shareId = this.generateShareId(vaultId, recipientId);
            
            // Add recipient to vault access
            if (!this.userVaultMappings.has(recipientId)) {
                this.userVaultMappings.set(recipientId, new Set());
            }
            this.userVaultMappings.get(recipientId).add(vaultId);

            // Track sharing metadata
            const metadata = this.vaultMetadata.get(vaultId);
            if (!metadata.sharedWith) {
                metadata.sharedWith = new Map();
            }
            metadata.sharedWith.set(recipientId, {
                permissions: permissions,
                sharedAt: Date.now(),
                shareId: shareId
            });
            this.vaultMetadata.set(vaultId, metadata);

            this.logAccess(ownerId, vaultId, 'SHARE', { recipient: recipientId });

            return {
                success: true,
                shareId: shareId,
                vaultId: vaultId,
                recipient: recipientId,
                permissions: permissions
            };

        } catch (error) {
            console.error('Vault sharing failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Derive vault-specific encryption key from biometric data
     */
    async deriveVaultKey(userId, biometricToken, vaultId) {
        // Combine user biometric data with vault-specific salt
        const keyMaterial = `${userId}:${biometricToken}:${vaultId}`;
        const salt = crypto.createHash('sha256').update(vaultId).digest();
        
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(keyMaterial, salt, this.iterations, 32, 'sha256', (err, key) => {
                if (err) reject(err);
                else resolve(key);
            });
        });
    }

    /**
     * Encrypt vault data
     */
    async encryptVaultData(data, key) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.encryptionAlgorithm, key);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag ? cipher.getAuthTag() : null;
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag ? authTag.toString('hex') : null
        };
    }

    /**
     * Decrypt vault data
     */
    async decryptVaultData(encryptedData, key) {
        const decipher = crypto.createDecipher(this.encryptionAlgorithm, key);
        
        if (encryptedData.authTag) {
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        }
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    /**
     * Generate unique vault ID
     */
    generateVaultId(userId, vaultName) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(8).toString('hex');
        return `vault_${userId}_${vaultName}_${timestamp}_${random}`;
    }

    /**
     * Generate share ID
     */
    generateShareId(vaultId, recipientId) {
        return `share_${vaultId}_${recipientId}_${Date.now()}`;
    }

    /**
     * Log vault access for audit trail
     */
    logAccess(userId, vaultId, action, metadata = {}) {
        const logEntry = {
            userId: userId,
            vaultId: vaultId,
            action: action,
            timestamp: Date.now(),
            metadata: metadata
        };

        if (!this.accessLog.has(userId)) {
            this.accessLog.set(userId, []);
        }
        
        this.accessLog.get(userId).push(logEntry);
        
        // Keep only last 1000 entries per user
        const userLog = this.accessLog.get(userId);
        if (userLog.length > 1000) {
            userLog.splice(0, userLog.length - 1000);
        }
    }

    /**
     * Get vault access analytics
     */
    getVaultAnalytics(userId) {
        const userVaults = this.userVaultMappings.get(userId) || new Set();
        const analytics = {
            totalVaults: userVaults.size,
            totalAccesses: 0,
            recentActivity: [],
            storageUsed: 0
        };

        for (const vaultId of userVaults) {
            const vault = this.vaults.get(vaultId);
            const metadata = this.vaultMetadata.get(vaultId);
            
            if (vault && metadata) {
                analytics.totalAccesses += vault.accessCount;
                analytics.storageUsed += metadata.size;
            }
        }

        // Get recent activity
        const userLog = this.accessLog.get(userId) || [];
        analytics.recentActivity = userLog.slice(-20);

        return analytics;
    }

    /**
     * Verify biometric token with BiometricAuth integration
     */
    async verifyBiometricToken(userId, token) {
        // Integrate with BiometricAuth class
        try {
            if (!token || token.length === 0) {
                return false;
            }
            
            // In production, this would validate the token with BiometricAuth
            // For now, we ensure token structure is valid
            const tokenParts = token.split('_');
            return tokenParts.length >= 3 && tokenParts[0] === 'bio';
        } catch (error) {
            console.error('Biometric token verification failed:', error);
            return false;
        }
    }

    /**
     * Integrate with file system for persistent storage
     */
    async initializePersistentStorage(vaultPath) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            // Create vault directory structure
            await fs.mkdir(path.join(vaultPath, 'data'), { recursive: true });
            await fs.mkdir(path.join(vaultPath, 'metadata'), { recursive: true });
            await fs.mkdir(path.join(vaultPath, 'logs'), { recursive: true });
            
            return true;
        } catch (error) {
            console.error('Failed to initialize persistent storage:', error);
            return false;
        }
    }

    /**
     * Save vault to persistent storage
     */
    async saveVaultToDisk(vaultId, vaultData) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const vaultPath = path.join('../../../vault/users', vaultId.split('_')[1]);
            await this.initializePersistentStorage(vaultPath);
            
            const dataPath = path.join(vaultPath, 'data', `${vaultId}.json`);
            await fs.writeFile(dataPath, JSON.stringify(vaultData, null, 2));
            
            return true;
        } catch (error) {
            console.error('Failed to save vault to disk:', error);
            return false;
        }
    }

    /**
     * Load vault from persistent storage
     */
    async loadVaultFromDisk(vaultId) {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const vaultPath = path.join('../../../vault/users', vaultId.split('_')[1]);
            const dataPath = path.join(vaultPath, 'data', `${vaultId}.json`);
            
            const data = await fs.readFile(dataPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to load vault from disk:', error);
            return null;
        }
    }

    /**
     * Create session token for vault access
     */
    createVaultSessionToken(userId, vaultId) {
        const crypto = require('crypto');
        const timestamp = Date.now();
        const sessionData = `${userId}:${vaultId}:${timestamp}`;
        const token = crypto.createHash('sha256').update(sessionData).digest('hex');
        
        return {
            token: `vault_${token}`,
            expiresAt: timestamp + (24 * 60 * 60 * 1000), // 24 hours
            userId: userId,
            vaultId: vaultId
        };
    }

    /**
     * Cleanup expired sessions and temporary data
     */
    async cleanupExpiredData() {
        const now = Date.now();
        
        // Cleanup in-memory data
        for (const [vaultId, vault] of this.vaults.entries()) {
            // Remove vaults that haven't been accessed in 30 days
            if (now - vault.lastAccessed > 30 * 24 * 60 * 60 * 1000) {
                console.log(`Cleaning up inactive vault: ${vaultId}`);
                this.vaults.delete(vaultId);
                this.vaultMetadata.delete(vaultId);
            }
        }
        
        // Cleanup access logs older than 90 days
        for (const [userId, logs] of this.accessLog.entries()) {
            const filteredLogs = logs.filter(log => now - log.timestamp < 90 * 24 * 60 * 60 * 1000);
            this.accessLog.set(userId, filteredLogs);
        }
    }

    /**
     * Export vault analytics for user
     */
    async exportVaultAnalytics(userId, biometricToken, format = 'json') {
        try {
            const authValid = await this.verifyBiometricToken(userId, biometricToken);
            if (!authValid) {
                throw new Error('Biometric authentication failed');
            }

            const analytics = this.getVaultAnalytics(userId);
            const exportData = {
                userId: userId,
                exportedAt: new Date().toISOString(),
                analytics: analytics,
                format: format
            };

            this.logAccess(userId, null, 'EXPORT', { format: format });

            return {
                success: true,
                data: exportData,
                format: format
            };

        } catch (error) {
            console.error('Vault analytics export failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = VaultMultiUser;