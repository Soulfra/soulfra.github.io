const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class PlatformCore {
    constructor() {
        this.platformsPath = path.join(__dirname, 'platforms');
        this.vaultPath = path.join(__dirname, '../vault');
        this.transformHandler = null;
    }

    async createPlatform(customerId, config = {}) {
        try {
            // Validate customer
            const isValid = await this.validateCustomer(customerId);
            if (!isValid) {
                throw new Error('Invalid customer ID');
            }

            // Generate platform ID
            const platformId = `platform-${customerId}-${Date.now()}`;
            const platformPath = path.join(this.platformsPath, platformId);

            // Create platform directory
            await fs.mkdir(platformPath, { recursive: true });

            // Create platform configuration
            const platformConfig = {
                id: platformId,
                customerId,
                created: Date.now(),
                config: {
                    name: config.name || `${customerId}'s Platform`,
                    theme: config.theme || 'default',
                    features: config.features || ['basic'],
                    pricing: config.pricing || { tier: 'free' }
                },
                encryption: {
                    enabled: true,
                    algorithm: 'aes-256-gcm'
                },
                status: 'active'
            };

            // Save platform config
            await fs.writeFile(
                path.join(platformPath, 'platform.json'),
                JSON.stringify(platformConfig, null, 2)
            );

            // Create encrypted agent launcher
            const launcher = await this.createLauncher(platformId, customerId);
            await fs.writeFile(
                path.join(platformPath, 'launch.encrypted'),
                launcher.encrypted
            );

            // Log platform creation
            await this.logPlatformCreation(platformId, customerId);

            return {
                success: true,
                platformId,
                path: platformPath,
                launcher: launcher.key
            };
        } catch (error) {
            console.error('Platform creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async validateCustomer(customerId) {
        // Check if customer exists in verified users
        try {
            const verifiedPath = path.join(this.vaultPath, 'verified-users.json');
            const verified = JSON.parse(await fs.readFile(verifiedPath, 'utf8'));
            return customerId in verified || customerId === 'test-customer';
        } catch (error) {
            // Allow test customers
            return customerId === 'test-customer';
        }
    }

    async createLauncher(platformId, customerId) {
        const launcher = {
            platformId,
            customerId,
            created: Date.now(),
            executable: `
#!/bin/bash
echo "🚀 Launching ${customerId}'s Platform..."
echo "Platform ID: ${platformId}"
echo "Initializing agent mirror..."
node ../../../fake-mesh-interface/mesh-router.js --platform ${platformId}
            `.trim()
        };

        // Generate encryption key
        const key = crypto.randomBytes(32);
        const iv = crypto.randomBytes(16);
        
        // Encrypt launcher
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(launcher)),
            cipher.final()
        ]);
        const authTag = cipher.getAuthTag();

        return {
            encrypted: Buffer.concat([iv, authTag, encrypted]).toString('base64'),
            key: key.toString('base64')
        };
    }

    async encryptAgent(agent, key) {
        const iv = crypto.randomBytes(16);
        const keyBuffer = Buffer.from(key, 'base64');
        
        const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(agent)),
            cipher.final()
        ]);
        const authTag = cipher.getAuthTag();

        return Buffer.concat([iv, authTag, encrypted]).toString('base64');
    }

    async decryptAgent(encrypted, key) {
        const data = Buffer.from(encrypted, 'base64');
        const iv = data.slice(0, 16);
        const authTag = data.slice(16, 32);
        const ciphertext = data.slice(32);
        
        const keyBuffer = Buffer.from(key, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final()
        ]);

        return JSON.parse(decrypted.toString());
    }

    async logPlatformCreation(platformId, customerId) {
        try {
            const logPath = path.join(this.vaultPath, 'platform-launches.json');
            let log = [];
            
            try {
                const existing = await fs.readFile(logPath, 'utf8');
                log = JSON.parse(existing);
            } catch (e) {
                // File doesn't exist yet
            }

            log.push({
                platformId,
                customerId,
                timestamp: Date.now(),
                status: 'created'
            });

            await fs.writeFile(logPath, JSON.stringify(log, null, 2));
        } catch (error) {
            console.error('Failed to log platform creation:', error);
        }
    }
}

// Transform handler for integration
let transformHandler = null;
function setTransformHandler(handler) {
    transformHandler = handler;
}

// Handle requests from mesh interface
async function handleRequest(sessionId, action, data) {
    const core = new PlatformCore();
    
    switch (action) {
        case 'create':
            return await core.createPlatform(data.customerId, data.config);
        case 'validate':
            return await core.validateCustomer(data.customerId);
        case 'encrypt':
            return await core.encryptAgent(data.agent, data.key);
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

module.exports = {
    createPlatform: new PlatformCore().createPlatform.bind(new PlatformCore()),
    validateCustomer: new PlatformCore().validateCustomer.bind(new PlatformCore()),
    encryptAgent: new PlatformCore().encryptAgent.bind(new PlatformCore()),
    decryptAgent: new PlatformCore().decryptAgent.bind(new PlatformCore()),
    setTransformHandler,
    handleRequest
};