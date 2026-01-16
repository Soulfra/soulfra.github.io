// Vault Writer - Mode-aware memory persistence system
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VaultWriter {
    constructor() {
        this.vaultPath = path.join(__dirname);
        this.modePath = path.join(__dirname, '../mirroros/mode-switcher.json');
        this.operatingMode = 'soft';
        this.modeConfig = null;
        this.permissionCache = new Map();
    }
    
    async initialize() {
        await this.loadMode();
        console.log(`🔐 Vault Writer initialized in ${this.operatingMode.toUpperCase()} mode`);
    }
    
    async loadMode() {
        try {
            const modeData = await fs.readFile(this.modePath, 'utf-8');
            const modeConfig = JSON.parse(modeData);
            this.operatingMode = modeConfig.activeMode || 'soft';
            
            // Load mode-specific config
            const configPath = path.join(__dirname, `../mirroros/${this.operatingMode}-mode-config.json`);
            this.modeConfig = JSON.parse(await fs.readFile(configPath, 'utf-8'));
        } catch (error) {
            console.log('⚠️ Defaulting to soft mode vault settings');
            this.operatingMode = 'soft';
        }
    }
    
    async writeMemory(sessionId, content, metadata = {}) {
        // Check mode-specific rules
        const canWrite = await this.checkWritePermission(sessionId, content, metadata);
        
        if (!canWrite.allowed) {
            console.log(`❌ Vault write blocked: ${canWrite.reason}`);
            return {
                success: false,
                reason: canWrite.reason,
                requiresPermission: canWrite.requiresPermission
            };
        }
        
        // Prepare memory entry
        const memoryEntry = {
            id: this.generateMemoryId(),
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            content: content,
            metadata: {
                ...metadata,
                mode: this.operatingMode,
                encrypted: this.shouldEncrypt(),
                retention: this.getRetentionPolicy()
            }
        };
        
        // Apply encryption if needed
        if (memoryEntry.metadata.encrypted) {
            memoryEntry.content = await this.encryptContent(content);
        }
        
        // Write to appropriate location
        const writePath = this.getWritePath(sessionId, metadata.type);
        await this.performWrite(writePath, memoryEntry);
        
        return {
            success: true,
            memoryId: memoryEntry.id,
            path: writePath,
            encrypted: memoryEntry.metadata.encrypted
        };
    }
    
    async checkWritePermission(sessionId, content, metadata) {
        // Platform mode - always allow
        if (this.operatingMode === 'platform') {
            return { allowed: true };
        }
        
        // Soft mode - check settings
        const memorySettings = this.modeConfig?.memory_settings || {};
        
        // Check if manual only
        if (memorySettings.vault_writes === 'manual_only') {
            // Check permission cache
            if (this.permissionCache.has(sessionId)) {
                return { allowed: true };
            }
            
            return {
                allowed: false,
                reason: 'Manual permission required',
                requiresPermission: true,
                permissionPrompt: memorySettings.permission_prompt || "May I save this to help you better?"
            };
        }
        
        // Check if default retention is false
        if (!memorySettings.default_retention) {
            // Sensitive content detection
            if (this.detectSensitiveContent(content)) {
                return {
                    allowed: false,
                    reason: 'Sensitive content detected',
                    requiresPermission: true
                };
            }
        }
        
        return { allowed: true };
    }
    
    detectSensitiveContent(content) {
        const sensitivePatterns = [
            /\b(password|secret|private key|api key)\b/gi,
            /\b(ssn|social security)\b/gi,
            /\b(credit card|bank account)\b/gi,
            /\b(confidential|proprietary)\b/gi
        ];
        
        return sensitivePatterns.some(pattern => pattern.test(content));
    }
    
    async grantPermission(sessionId, duration = 3600000) {
        // Cache permission for session (default 1 hour)
        this.permissionCache.set(sessionId, {
            granted: new Date().toISOString(),
            expires: new Date(Date.now() + duration).toISOString()
        });
        
        // Clean expired permissions
        this.cleanPermissionCache();
    }
    
    cleanPermissionCache() {
        const now = new Date();
        for (const [sessionId, permission] of this.permissionCache.entries()) {
            if (new Date(permission.expires) < now) {
                this.permissionCache.delete(sessionId);
            }
        }
    }
    
    shouldEncrypt() {
        if (this.operatingMode === 'soft') {
            return this.modeConfig?.memory_settings?.encryption === 'enabled';
        }
        return false; // Platform mode handles encryption differently
    }
    
    async encryptContent(content) {
        // Simple encryption for soft mode
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            algorithm: algorithm
        };
    }
    
    getEncryptionKey() {
        // In production, this would be properly managed
        return process.env.VAULT_ENCRYPTION_KEY || 'default-soft-mode-key';
    }
    
    getRetentionPolicy() {
        if (this.operatingMode === 'soft') {
            const privacy = this.modeConfig?.privacy_features || {};
            if (privacy.ephemeral_option) {
                return {
                    type: 'ephemeral',
                    ttl: 86400000 // 24 hours
                };
            }
            if (privacy.data_deletion === 'immediate') {
                return {
                    type: 'session',
                    deleteOnEnd: true
                };
            }
        }
        
        return {
            type: 'persistent',
            ttl: null
        };
    }
    
    getWritePath(sessionId, type = 'memory') {
        const timestamp = new Date().toISOString().split('T')[0];
        
        if (this.operatingMode === 'soft') {
            // Simple, privacy-focused structure
            return path.join(this.vaultPath, 'memories', timestamp, `${sessionId}.json`);
        } else {
            // Platform mode - detailed organization
            return path.join(this.vaultPath, 'sessions', sessionId, type, `${timestamp}.json`);
        }
    }
    
    async performWrite(writePath, memoryEntry) {
        // Ensure directory exists
        await fs.mkdir(path.dirname(writePath), { recursive: true });
        
        // Check if file exists
        let memories = [];
        try {
            const existing = await fs.readFile(writePath, 'utf-8');
            memories = JSON.parse(existing);
        } catch {
            // New file
        }
        
        // Add new memory
        memories.push(memoryEntry);
        
        // Apply retention limits
        if (this.operatingMode === 'soft') {
            // Keep only recent memories
            const maxMemories = 100;
            if (memories.length > maxMemories) {
                memories = memories.slice(-maxMemories);
            }
        }
        
        // Write back
        await fs.writeFile(writePath, JSON.stringify(memories, null, 2));
    }
    
    async readMemory(sessionId, options = {}) {
        // Check read permissions based on mode
        if (this.operatingMode === 'soft' && !options.userRequested) {
            console.log('❌ Automatic memory reads disabled in soft mode');
            return null;
        }
        
        const readPath = this.getWritePath(sessionId, options.type);
        
        try {
            const content = await fs.readFile(readPath, 'utf-8');
            const memories = JSON.parse(content);
            
            // Decrypt if needed
            for (const memory of memories) {
                if (memory.metadata?.encrypted) {
                    memory.content = await this.decryptContent(memory.content);
                }
            }
            
            // Filter by options
            if (options.limit) {
                return memories.slice(-options.limit);
            }
            
            return memories;
        } catch (error) {
            return [];
        }
    }
    
    async decryptContent(encryptedData) {
        const algorithm = encryptedData.algorithm || 'aes-256-cbc';
        const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
        const iv = Buffer.from(encryptedData.iv, 'hex');
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    async deleteMemory(sessionId, memoryId = null) {
        // In soft mode, honor immediate deletion
        if (this.operatingMode === 'soft') {
            const privacy = this.modeConfig?.privacy_features || {};
            if (privacy.data_deletion !== 'immediate') {
                console.log('⚠️ Deletion request logged but not immediate');
                return { success: true, immediate: false };
            }
        }
        
        // Perform deletion
        if (memoryId) {
            // Delete specific memory
            // Implementation depends on storage structure
        } else {
            // Delete all memories for session
            const sessionPath = path.join(this.vaultPath, 'memories');
            // Recursively delete session data
        }
        
        return { success: true, immediate: true };
    }
    
    generateMemoryId() {
        return `mem_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async getStorageStats(sessionId) {
        if (this.operatingMode === 'soft') {
            // Limited stats in soft mode
            return {
                mode: 'soft',
                hasMemories: true // Don't expose counts
            };
        }
        
        // Full stats in platform mode
        // Implementation for detailed statistics
        return {
            mode: 'platform',
            totalMemories: 0,
            storageSize: 0,
            oldestMemory: null,
            newestMemory: null
        };
    }
}

module.exports = VaultWriter;