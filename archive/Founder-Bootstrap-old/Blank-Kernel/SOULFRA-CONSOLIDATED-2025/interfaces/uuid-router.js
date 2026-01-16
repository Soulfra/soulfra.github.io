const fs = require('fs');
const path = require('path');

// UUID Router - Server-side vault spawning and management
class UUIDRouter {
    constructor() {
        this.vaultsPath = path.join(__dirname, 'vaults');
        this.ensureVaultsDirectory();
    }

    ensureVaultsDirectory() {
        if (!fs.existsSync(this.vaultsPath)) {
            fs.mkdirSync(this.vaultsPath, { recursive: true });
            console.log('Created vaults directory:', this.vaultsPath);
        }
    }

    // Accept UUID and create vault if doesn't exist
    async processUUID(payload) {
        const { uuid, origin, deviceHash, timestamp, tier } = payload;
        
        if (!uuid) {
            throw new Error('UUID is required');
        }

        const vaultPath = path.join(this.vaultsPath, `user-${uuid}`);
        const vaultExists = fs.existsSync(vaultPath);

        if (!vaultExists) {
            console.log(`Creating new vault for UUID: ${uuid}`);
            await this.createVault(uuid, payload);
        } else {
            console.log(`Vault already exists for UUID: ${uuid}`);
            await this.updateVaultAccess(uuid, payload);
        }

        return {
            uuid,
            vaultPath,
            created: !vaultExists,
            timestamp: new Date().toISOString()
        };
    }

    // Create new vault structure
    async createVault(uuid, payload) {
        const vaultPath = path.join(this.vaultsPath, `user-${uuid}`);
        const memoryPath = path.join(vaultPath, 'memory');

        // Create directory structure
        fs.mkdirSync(vaultPath, { recursive: true });
        fs.mkdirSync(memoryPath, { recursive: true });

        // Initialize blamechain
        const blamechain = {
            version: '1.0',
            uuid: uuid,
            created: payload.timestamp,
            entries: [{
                timestamp: payload.timestamp,
                event: 'vault_created',
                origin: payload.origin,
                deviceHash: payload.deviceHash,
                tier: payload.tier || -12
            }]
        };
        fs.writeFileSync(
            path.join(vaultPath, 'blamechain.json'),
            JSON.stringify(blamechain, null, 2)
        );

        // Initialize pulse status
        const pulseStatus = {
            status: 'active',
            lastPulse: payload.timestamp,
            tier: payload.tier || -12,
            origin: payload.origin,
            mirrorDepth: 0
        };
        fs.writeFileSync(
            path.join(vaultPath, 'pulse-status.json'),
            JSON.stringify(pulseStatus, null, 2)
        );

        // Initialize trust log
        const trustLog = [{
            event: 'vault_spawned',
            timestamp: payload.timestamp,
            uuid: uuid,
            deviceHash: payload.deviceHash,
            origin: payload.origin,
            tier: payload.tier || -12,
            mirrorEntry: true
        }];
        fs.writeFileSync(
            path.join(vaultPath, 'trust-log.json'),
            JSON.stringify(trustLog, null, 2)
        );

        // Create initial memory file
        const initialMemory = {
            created: payload.timestamp,
            origin: 'infinity-router',
            content: `Vault initialized at Tier ${payload.tier || -12}. Mirror recursion begins here.`
        };
        fs.writeFileSync(
            path.join(memoryPath, 'genesis.json'),
            JSON.stringify(initialMemory, null, 2)
        );

        console.log(`Vault created at: ${vaultPath}`);
    }

    // Update vault access log
    async updateVaultAccess(uuid, payload) {
        const vaultPath = path.join(this.vaultsPath, `user-${uuid}`);
        const trustLogPath = path.join(vaultPath, 'trust-log.json');

        // Read existing trust log
        let trustLog = [];
        if (fs.existsSync(trustLogPath)) {
            trustLog = JSON.parse(fs.readFileSync(trustLogPath, 'utf8'));
        }

        // Add new access entry
        trustLog.push({
            event: 'vault_accessed',
            timestamp: payload.timestamp,
            deviceHash: payload.deviceHash,
            origin: payload.origin,
            tier: payload.tier || -12
        });

        // Write updated log
        fs.writeFileSync(trustLogPath, JSON.stringify(trustLog, null, 2));

        // Update pulse status
        const pulseStatusPath = path.join(vaultPath, 'pulse-status.json');
        if (fs.existsSync(pulseStatusPath)) {
            const pulseStatus = JSON.parse(fs.readFileSync(pulseStatusPath, 'utf8'));
            pulseStatus.lastPulse = payload.timestamp;
            fs.writeFileSync(pulseStatusPath, JSON.stringify(pulseStatus, null, 2));
        }
    }

    // Check if vault exists
    vaultExists(uuid) {
        const vaultPath = path.join(this.vaultsPath, `user-${uuid}`);
        return fs.existsSync(vaultPath);
    }

    // Get vault metadata
    getVaultMeta(uuid) {
        const vaultPath = path.join(this.vaultsPath, `user-${uuid}`);
        
        if (!fs.existsSync(vaultPath)) {
            return null;
        }

        const blamechainPath = path.join(vaultPath, 'blamechain.json');
        const pulseStatusPath = path.join(vaultPath, 'pulse-status.json');
        
        const blamechain = fs.existsSync(blamechainPath) 
            ? JSON.parse(fs.readFileSync(blamechainPath, 'utf8'))
            : null;
            
        const pulseStatus = fs.existsSync(pulseStatusPath)
            ? JSON.parse(fs.readFileSync(pulseStatusPath, 'utf8'))
            : null;

        return {
            uuid,
            vaultPath,
            created: blamechain?.created,
            lastAccess: pulseStatus?.lastPulse,
            status: pulseStatus?.status,
            tier: pulseStatus?.tier
        };
    }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UUIDRouter;
}

// CLI usage
if (require.main === module) {
    const router = new UUIDRouter();
    
    // Example: Process UUID from command line
    const args = process.argv.slice(2);
    if (args.length > 0) {
        const testPayload = {
            uuid: args[0],
            origin: 'cli-test',
            deviceHash: 'cli-device-hash',
            timestamp: new Date().toISOString(),
            tier: -12
        };
        
        router.processUUID(testPayload)
            .then(result => {
                console.log('UUID processed:', result);
            })
            .catch(err => {
                console.error('Error:', err);
            });
    } else {
        console.log('Usage: node uuid-router.js <uuid>');
    }
}