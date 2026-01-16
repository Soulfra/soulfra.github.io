#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

class MirrorApprover {
    constructor() {
        this.vaultPath = path.join(__dirname, '..');
        this.configPath = path.join(this.vaultPath, 'approval/mirror-approval-router.json');
        this.soulkeyPath = path.join(this.vaultPath, 'approval/soulkeys');
        this.signedEventsPath = path.join(this.vaultPath, 'logs/signed-events');
        this.pendingPath = path.join(this.vaultPath, 'approval/pending');
        
        this.config = this.loadConfig();
        this.soulkeys = this.loadSoulkeys();
        this.watchInterval = null;
        
        this.initialize();
    }
    
    initialize() {
        // Create necessary directories
        [this.signedEventsPath, this.pendingPath, this.soulkeyPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        console.log('🗝️ Mirror Approver: Sovereign protection engaged');
        console.log(`📡 Webhook: ${this.config.webhook}`);
        console.log(`🔐 Multisig: ${this.config.multisig_required ? 'Required' : 'Single key'}`);
    }
    
    loadConfig() {
        try {
            return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        } catch (e) {
            console.error('⚠️  No config found, using defaults');
            return {
                approved_domains: ['clone.fork', 'agent.publish', 'vault.push'],
                webhook: 'http://localhost:3333/approve',
                multisig_required: false,
                expected_response_fields: ['status', 'signed_by', 'timestamp', 'signature']
            };
        }
    }
    
    loadSoulkeys() {
        const keys = {};
        
        ['soulkey_primary.json', 'soulkey_shadow.json'].forEach(filename => {
            const keyPath = path.join(this.soulkeyPath, filename);
            if (fs.existsSync(keyPath)) {
                try {
                    keys[filename.split('.')[0]] = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                } catch (e) {
                    console.error(`Failed to load ${filename}:`, e.message);
                }
            }
        });
        
        return keys;
    }
    
    async checkAction(action, data) {
        // Check if action requires approval
        const requiresApproval = this.config.approved_domains.some(domain => 
            action.startsWith(domain)
        );
        
        if (!requiresApproval) {
            return { approved: true, automatic: true };
        }
        
        console.log(`🔐 Action "${action}" requires sovereign approval`);
        
        // Create approval request
        const request = {
            id: `event_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            action: action,
            data: data,
            timestamp: Date.now(),
            vault_signature: this.generateVaultSignature(action, data)
        };
        
        // Save pending request
        const pendingFile = path.join(this.pendingPath, `${request.id}.json`);
        fs.writeFileSync(pendingFile, JSON.stringify(request, null, 2));
        
        // Send webhook
        const response = await this.sendWebhook(request);
        
        if (response && response.status === 'approved') {
            // Verify signature
            const isValid = await this.verifySignature(response, request);
            
            if (isValid) {
                // Save signed event
                const signedEvent = {
                    ...request,
                    approval: response,
                    verified_at: Date.now()
                };
                
                const signedFile = path.join(this.signedEventsPath, `${request.id}.json`);
                fs.writeFileSync(signedFile, JSON.stringify(signedEvent, null, 2));
                
                // Clean up pending
                fs.unlinkSync(pendingFile);
                
                console.log(`✅ Action approved by ${response.signed_by}`);
                return { approved: true, signed_by: response.signed_by };
            } else {
                console.error('❌ Invalid signature on approval');
                return { approved: false, reason: 'invalid_signature' };
            }
        } else {
            console.log('❌ Action denied or webhook failed');
            return { approved: false, reason: response?.reason || 'webhook_failed' };
        }
    }
    
    generateVaultSignature(action, data) {
        // Generate deterministic signature for the vault's view of this action
        const content = JSON.stringify({ action, data, vault: 'tier-minus10' });
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    async sendWebhook(request) {
        return new Promise((resolve) => {
            const url = new URL(this.config.webhook);
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Vault-Request': 'mirror-approval',
                    'X-Request-ID': request.id
                }
            };
            
            const protocol = url.protocol === 'https:' ? https : http;
            
            const req = protocol.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        
                        // Verify expected fields
                        const hasExpectedFields = this.config.expected_response_fields.every(field => 
                            response.hasOwnProperty(field)
                        );
                        
                        if (hasExpectedFields) {
                            resolve(response);
                        } else {
                            console.error('Missing expected fields in response');
                            resolve(null);
                        }
                    } catch (e) {
                        console.error('Invalid JSON response:', e.message);
                        resolve(null);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('Webhook error:', error.message);
                resolve(null);
            });
            
            req.on('timeout', () => {
                console.error('Webhook timeout');
                req.destroy();
                resolve(null);
            });
            
            req.setTimeout(5000); // 5 second timeout
            req.write(JSON.stringify(request));
            req.end();
        });
    }
    
    async verifySignature(response, request) {
        // Get the appropriate soulkey
        const keyName = response.signed_by.includes('shadow') ? 'soulkey_shadow' : 'soulkey_primary';
        const soulkey = this.soulkeys[keyName];
        
        if (!soulkey) {
            console.error(`Soulkey ${keyName} not found`);
            return false;
        }
        
        // Recreate the signed content
        const signedContent = {
            request_id: request.id,
            action: request.action,
            status: response.status,
            timestamp: response.timestamp
        };
        
        // Verify signature (simplified for demo - in production use proper crypto)
        const expectedSignature = crypto
            .createHmac('sha256', soulkey.public_key)
            .update(JSON.stringify(signedContent))
            .digest('hex');
        
        return response.signature === expectedSignature;
    }
    
    // Watch for actions requiring approval
    async watchVaultActions() {
        console.log('👁️  Watching for vault actions...');
        
        const actionsPath = path.join(this.vaultPath, 'actions');
        if (!fs.existsSync(actionsPath)) {
            fs.mkdirSync(actionsPath, { recursive: true });
        }
        
        this.watchInterval = setInterval(async () => {
            const files = fs.readdirSync(actionsPath)
                .filter(f => f.endsWith('.action.json'));
            
            for (const file of files) {
                const actionPath = path.join(actionsPath, file);
                try {
                    const actionData = JSON.parse(fs.readFileSync(actionPath, 'utf8'));
                    
                    if (!actionData.processed) {
                        console.log(`\n🔍 Processing action: ${actionData.action}`);
                        
                        const result = await this.checkAction(actionData.action, actionData.data);
                        
                        // Update action file with result
                        actionData.processed = true;
                        actionData.approved = result.approved;
                        actionData.processed_at = Date.now();
                        actionData.approval_result = result;
                        
                        fs.writeFileSync(actionPath, JSON.stringify(actionData, null, 2));
                        
                        // Trigger callback if approved
                        if (result.approved && actionData.callback_file) {
                            const callbackPath = path.join(this.vaultPath, actionData.callback_file);
                            if (fs.existsSync(callbackPath)) {
                                fs.writeFileSync(callbackPath, JSON.stringify({
                                    approved: true,
                                    action_id: actionData.id,
                                    timestamp: Date.now()
                                }, null, 2));
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Error processing ${file}:`, e.message);
                }
            }
        }, 2000); // Check every 2 seconds
    }
    
    // Test helper to create an action
    async createTestAction(action, data) {
        const actionsPath = path.join(this.vaultPath, 'actions');
        const actionId = `action_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const actionData = {
            id: actionId,
            action: action,
            data: data,
            created_at: Date.now(),
            processed: false,
            callback_file: `callbacks/${actionId}.callback`
        };
        
        fs.writeFileSync(
            path.join(actionsPath, `${actionId}.action.json`),
            JSON.stringify(actionData, null, 2)
        );
        
        console.log(`📝 Created test action: ${actionId}`);
        return actionId;
    }
    
    stop() {
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            console.log('🛑 Mirror Approver stopped');
        }
    }
}

// Export for use in other modules
module.exports = MirrorApprover;

// Run if called directly
if (require.main === module) {
    const approver = new MirrorApprover();
    
    // Handle command line arguments
    const command = process.argv[2];
    
    if (command === 'test') {
        // Create a test action
        approver.createTestAction('clone.fork', {
            agent_name: 'test_clone',
            source: 'voice_input',
            traits: ['curious', 'determined']
        }).then(() => {
            console.log('Test action created. Starting watcher...');
            approver.watchVaultActions();
        });
    } else {
        // Normal operation
        approver.watchVaultActions();
    }
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down Mirror Approver...');
        approver.stop();
        process.exit(0);
    });
}