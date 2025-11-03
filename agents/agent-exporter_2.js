// Agent Exporter - Mode-aware agent export system
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AgentExporter {
    constructor() {
        this.modePath = path.join(__dirname, '../mirroros/mode-switcher.json');
        this.exportPath = path.join(__dirname, '../vault/exports');
        this.operatingMode = 'soft';
        this.modeConfig = null;
        this.exportQueue = new Map();
    }
    
    async initialize() {
        await this.loadMode();
        console.log(`📤 Agent Exporter initialized in ${this.operatingMode.toUpperCase()} mode`);
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
            console.log('⚠️ Defaulting to soft mode export settings');
            this.operatingMode = 'soft';
        }
    }
    
    async canExport(sessionId, exportType = 'agent') {
        // Check mode settings
        if (this.operatingMode === 'soft') {
            const features = this.modeConfig?.features || {};
            if (!features.agent_export?.enabled) {
                return {
                    allowed: false,
                    reason: 'Agent export is disabled in Soft Mode',
                    suggestion: 'This feature helps maintain your privacy and focus on reflection'
                };
            }
        }
        
        // Platform mode checks
        if (this.operatingMode === 'platform') {
            // Check rate limits
            const limits = this.modeConfig?.interaction_limits?.rate_limits || {};
            const dailyExports = await this.getDailyExportCount(sessionId);
            
            if (dailyExports >= (limits.exports || 100)) {
                return {
                    allowed: false,
                    reason: 'Daily export limit reached',
                    limit: limits.exports,
                    resetTime: this.getNextResetTime()
                };
            }
        }
        
        return { allowed: true };
    }
    
    async exportAgent(sessionId, agentConfig, options = {}) {
        // Check permissions
        const canExport = await this.canExport(sessionId, 'agent');
        if (!canExport.allowed) {
            return {
                success: false,
                error: canExport.reason,
                details: canExport
            };
        }
        
        // In soft mode, this should never be called
        if (this.operatingMode === 'soft') {
            console.log('⚠️ Export attempted in soft mode - should be hidden from UI');
            return {
                success: false,
                error: 'Feature not available in current mode'
            };
        }
        
        // Platform mode export
        const exportId = this.generateExportId();
        const exportData = {
            id: exportId,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            mode: this.operatingMode,
            agent: {
                ...agentConfig,
                exportVersion: '2.0',
                platformSignature: this.generateSignature(agentConfig)
            },
            metadata: {
                format: options.format || 'json',
                compression: options.compress || false,
                encryption: options.encrypt || false,
                webhook: options.webhook || null
            }
        };
        
        // Process export based on format
        const processed = await this.processExport(exportData, options);
        
        // Save export record
        await this.saveExportRecord(exportData);
        
        // Handle webhooks if configured
        if (options.webhook) {
            this.queueWebhook(exportId, options.webhook, processed);
        }
        
        // Track usage
        await this.trackExport(sessionId, exportId);
        
        return {
            success: true,
            exportId: exportId,
            format: exportData.metadata.format,
            size: processed.size,
            url: processed.url,
            webhook: options.webhook ? 'queued' : null
        };
    }
    
    async processExport(exportData, options) {
        const { format } = options;
        let processed = {
            data: exportData,
            size: 0,
            url: null
        };
        
        // Format conversions
        switch (format) {
            case 'yaml':
                processed.data = this.convertToYAML(exportData);
                break;
            case 'api':
                processed.data = this.formatForAPI(exportData);
                break;
            case 'webhook':
                processed.data = this.formatForWebhook(exportData);
                break;
            default:
                processed.data = JSON.stringify(exportData, null, 2);
        }
        
        // Calculate size
        processed.size = Buffer.byteLength(processed.data);
        
        // Save to export directory
        const filename = `export_${exportData.id}.${format || 'json'}`;
        const filepath = path.join(this.exportPath, filename);
        await fs.mkdir(this.exportPath, { recursive: true });
        await fs.writeFile(filepath, processed.data);
        
        // Generate access URL (in production, this would be a signed URL)
        processed.url = `/api/exports/${exportData.id}`;
        
        return processed;
    }
    
    async bulkExport(sessionId, agentIds, options = {}) {
        if (this.operatingMode !== 'platform') {
            return {
                success: false,
                error: 'Bulk export is only available in Platform Mode'
            };
        }
        
        const results = [];
        
        for (const agentId of agentIds) {
            // Load agent config
            const agentConfig = await this.loadAgentConfig(agentId);
            if (agentConfig) {
                const result = await this.exportAgent(sessionId, agentConfig, options);
                results.push({
                    agentId: agentId,
                    ...result
                });
            }
        }
        
        return {
            success: true,
            exported: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        };
    }
    
    async exportToMarketplace(sessionId, agentConfig, marketplaceOptions = {}) {
        if (this.operatingMode !== 'platform') {
            return {
                success: false,
                error: 'Marketplace export is only available in Platform Mode'
            };
        }
        
        // Additional validation for marketplace
        const validation = this.validateForMarketplace(agentConfig);
        if (!validation.valid) {
            return {
                success: false,
                error: 'Agent does not meet marketplace requirements',
                issues: validation.issues
            };
        }
        
        // Add marketplace metadata
        const marketplaceExport = {
            ...agentConfig,
            marketplace: {
                listed: new Date().toISOString(),
                author: sessionId,
                price: marketplaceOptions.price || 0,
                license: marketplaceOptions.license || 'MIT',
                category: marketplaceOptions.category || 'general',
                tags: marketplaceOptions.tags || [],
                visibility: marketplaceOptions.visibility || 'public'
            }
        };
        
        // Export with special marketplace format
        return await this.exportAgent(sessionId, marketplaceExport, {
            format: 'marketplace',
            compress: true,
            sign: true
        });
    }
    
    validateForMarketplace(agentConfig) {
        const issues = [];
        
        if (!agentConfig.name || agentConfig.name.length < 3) {
            issues.push('Agent name must be at least 3 characters');
        }
        
        if (!agentConfig.description || agentConfig.description.length < 50) {
            issues.push('Agent description must be at least 50 characters');
        }
        
        if (!agentConfig.capabilities || agentConfig.capabilities.length === 0) {
            issues.push('Agent must have at least one capability');
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
    
    async queueWebhook(exportId, webhookUrl, exportData) {
        this.exportQueue.set(exportId, {
            url: webhookUrl,
            data: exportData,
            attempts: 0,
            queued: new Date().toISOString()
        });
        
        // Process webhook queue
        this.processWebhookQueue();
    }
    
    async processWebhookQueue() {
        for (const [exportId, webhook] of this.exportQueue.entries()) {
            if (webhook.attempts >= 3) {
                // Max retries reached
                this.exportQueue.delete(exportId);
                continue;
            }
            
            try {
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Export-ID': exportId,
                        'X-MirrorOS-Signature': this.generateWebhookSignature(webhook.data)
                    },
                    body: JSON.stringify(webhook.data)
                });
                
                if (response.ok) {
                    this.exportQueue.delete(exportId);
                } else {
                    webhook.attempts++;
                }
            } catch (error) {
                webhook.attempts++;
            }
        }
    }
    
    generateExportId() {
        return `exp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
    
    generateSignature(data) {
        const hash = crypto.createHash('sha256');
        hash.update(JSON.stringify(data));
        return hash.digest('hex');
    }
    
    generateWebhookSignature(data) {
        const secret = process.env.WEBHOOK_SECRET || 'default-webhook-secret';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(data));
        return hmac.digest('hex');
    }
    
    async getDailyExportCount(sessionId) {
        const today = new Date().toISOString().split('T')[0];
        const countFile = path.join(this.exportPath, 'counts', `${today}.json`);
        
        try {
            const counts = JSON.parse(await fs.readFile(countFile, 'utf-8'));
            return counts[sessionId] || 0;
        } catch {
            return 0;
        }
    }
    
    async trackExport(sessionId, exportId) {
        const today = new Date().toISOString().split('T')[0];
        const countFile = path.join(this.exportPath, 'counts', `${today}.json`);
        
        let counts = {};
        try {
            counts = JSON.parse(await fs.readFile(countFile, 'utf-8'));
        } catch {
            // New file
        }
        
        counts[sessionId] = (counts[sessionId] || 0) + 1;
        
        await fs.mkdir(path.dirname(countFile), { recursive: true });
        await fs.writeFile(countFile, JSON.stringify(counts, null, 2));
    }
    
    async saveExportRecord(exportData) {
        const recordFile = path.join(this.exportPath, 'records', `${exportData.sessionId}.json`);
        
        let records = [];
        try {
            records = JSON.parse(await fs.readFile(recordFile, 'utf-8'));
        } catch {
            // New file
        }
        
        records.push({
            id: exportData.id,
            timestamp: exportData.timestamp,
            format: exportData.metadata.format,
            size: exportData.agent ? JSON.stringify(exportData.agent).length : 0
        });
        
        // Keep last 1000 records
        if (records.length > 1000) {
            records = records.slice(-1000);
        }
        
        await fs.mkdir(path.dirname(recordFile), { recursive: true });
        await fs.writeFile(recordFile, JSON.stringify(records, null, 2));
    }
    
    async loadAgentConfig(agentId) {
        // Load agent configuration from vault
        try {
            const agentFile = path.join(__dirname, '../vault/agents', `${agentId}.json`);
            return JSON.parse(await fs.readFile(agentFile, 'utf-8'));
        } catch {
            return null;
        }
    }
    
    convertToYAML(data) {
        // Simple YAML conversion (in production, use a proper YAML library)
        const yaml = this.objectToYAML(data, 0);
        return yaml;
    }
    
    objectToYAML(obj, indent = 0) {
        let yaml = '';
        const spacing = '  '.repeat(indent);
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                yaml += `${spacing}${key}:\n`;
                yaml += this.objectToYAML(value, indent + 1);
            } else {
                yaml += `${spacing}${key}: ${value}\n`;
            }
        }
        
        return yaml;
    }
    
    formatForAPI(data) {
        return JSON.stringify({
            version: 'v1',
            agent: data.agent,
            endpoints: {
                chat: `/api/agents/${data.id}/chat`,
                config: `/api/agents/${data.id}/config`,
                fork: `/api/agents/${data.id}/fork`
            }
        });
    }
    
    formatForWebhook(data) {
        return JSON.stringify({
            event: 'agent.exported',
            data: data.agent,
            metadata: {
                exportId: data.id,
                timestamp: data.timestamp
            }
        });
    }
    
    getNextResetTime() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.toISOString();
    }
}

module.exports = AgentExporter;