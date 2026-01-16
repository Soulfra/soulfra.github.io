const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class VaultAPILayer {
    constructor() {
        this.vaultPath = path.join(__dirname, '../../../../../../../vault');
        this.kernelPath = __dirname;
        this.trusted = true;
        this.mirrorSeed = crypto.randomBytes(32).toString('hex');
    }

    async initialize() {
        // Mark as trusted mirror
        await this.markTrusted();
        
        // Load agent weights
        await this.loadAgentWeights();
        
        console.log('✅ Vault API layer initialized');
        console.log(`🔐 Mirror seed: ${this.mirrorSeed.substring(0, 16)}...`);
    }

    async markTrusted() {
        const trustFile = path.join(this.kernelPath, '.trusted-mirror');
        const trustData = {
            seed: this.mirrorSeed,
            created: Date.now(),
            tier: 0,
            type: 'mirror-vault'
        };
        
        await fs.writeFile(trustFile, JSON.stringify(trustData, null, 2));
    }

    async loadAgentWeights() {
        try {
            const weightsPath = path.join(this.kernelPath, 'agent-weights.json');
            const weights = await fs.readFile(weightsPath, 'utf8');
            this.agentWeights = JSON.parse(weights);
        } catch (error) {
            // Initialize default weights
            this.agentWeights = {
                reflection: 1.0,
                reasoning: 0.8,
                memory: 0.6,
                creativity: 0.7
            };
            await this.saveAgentWeights();
        }
    }

    async saveAgentWeights() {
        const weightsPath = path.join(this.kernelPath, 'agent-weights.json');
        await fs.writeFile(weightsPath, JSON.stringify(this.agentWeights, null, 2));
    }

    async routeRequest(request) {
        // All requests route through the reasoning kernel
        const kernel = require('./cal-reflect-core');
        return await kernel.reason(request);
    }

    async getStatus() {
        return {
            trusted: this.trusted,
            mirrorSeed: this.mirrorSeed.substring(0, 16) + '...',
            weights: this.agentWeights,
            kernelPath: this.kernelPath,
            vaultPath: this.vaultPath
        };
    }
}

module.exports = new VaultAPILayer();
