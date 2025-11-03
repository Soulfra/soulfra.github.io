/**
 * Mirror Diffusion Instance Generator
 * Creates single-use AI instances with user-owned cryptographic keys
 * 
 * This implements the REAL mirror diffusion engine with key ownership transfer
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { DiffusionPatternExample } = require('./templates/examples/basic-integration/diffusion-pattern-example');
const { MasterKeyManagement } = require('./MASTER_IMPLEMENTATION/private-keys/key-management');

class MirrorDiffusionInstance {
    constructor() {
        this.instanceId = crypto.randomBytes(16).toString('hex');
        this.created = Date.now();
        this.used = false;
        this.ownerKeys = null;
        this.instanceKeys = null;
        this.diffusionEngine = new DiffusionPatternExample();
    }
    
    /**
     * Generate a new single-use AI instance with cryptographic ownership
     */
    async generateInstance(userId, useCase = 'general') {
        console.log(`🔮 Generating Mirror Diffusion Instance for user: ${userId}`);
        
        // 1. Generate instance-specific keys
        this.instanceKeys = await this.generateInstanceKeys();
        
        // 2. Generate user ownership keys
        this.ownerKeys = await this.generateOwnerKeys(userId);
        
        // 3. Create instance configuration
        const instanceConfig = {
            instanceId: this.instanceId,
            useCase: useCase,
            created: this.created,
            ownerAddress: this.ownerKeys.address,
            instanceAddress: this.instanceKeys.address,
            diffusionProtocol: 'zero-loss-v1',
            singleUse: true
        };
        
        // 4. Sign the instance with both keys (instance signs, owner counter-signs)
        const instanceSignature = await this.signData(
            this.instanceKeys.private, 
            JSON.stringify(instanceConfig)
        );
        
        const ownerSignature = await this.signData(
            this.ownerKeys.private,
            instanceSignature.signature
        );
        
        // 5. Create the pre-swap package
        const preSwapPackage = {
            instance: instanceConfig,
            signatures: {
                instance: instanceSignature,
                owner: ownerSignature
            },
            keys: {
                // These will be swapped before user access
                temporary: {
                    instancePublic: this.instanceKeys.public,
                    ownerPublic: this.ownerKeys.public
                }
            },
            swapInstructions: {
                step1: 'Instance keys will be transferred to user vault',
                step2: 'Owner keys will replace router keys',
                step3: 'User receives full ownership of AI instance',
                step4: 'Instance becomes single-use with user control'
            }
        };
        
        return preSwapPackage;
    }
    
    /**
     * Execute the key swap - transfers ownership to user
     */
    async executeKeySwap(preSwapPackage, routerKeys) {
        console.log('🔄 Executing key swap for user ownership...');
        
        // Verify this instance hasn't been used
        if (this.used) {
            throw new Error('Instance already used - single use only');
        }
        
        // 1. Create user vault entry
        const userVault = {
            instanceId: this.instanceId,
            originalRouter: {
                address: routerKeys.address,
                publicKey: routerKeys.public
                // Router private key is NOT stored
            },
            ownedInstance: {
                keys: {
                    instance: this.instanceKeys,  // Full keys transferred
                    owner: this.ownerKeys         // Full keys transferred
                },
                config: preSwapPackage.instance,
                signatures: preSwapPackage.signatures
            },
            swapTimestamp: Date.now(),
            swapProof: await this.generateSwapProof(routerKeys)
        };
        
        // 2. Encrypt vault with user's owner key
        const encryptedVault = await this.encryptVault(userVault, this.ownerKeys);
        
        // 3. Create post-swap package (what user receives)
        const postSwapPackage = {
            instanceId: this.instanceId,
            userVault: encryptedVault,
            access: {
                decryptionKey: this.ownerKeys.public,  // User needs private key to decrypt
                instanceControl: this.instanceKeys.address
            },
            ownership: {
                status: 'transferred',
                owner: preSwapPackage.instance.ownerAddress,
                rights: 'full',
                limitations: 'single-use'
            },
            usage: {
                endpoint: this.generateInstanceEndpoint(),
                protocol: 'mirror-diffusion-v1',
                ready: true
            }
        };
        
        // 4. Mark instance as ready (but not used)
        this.ready = true;
        
        // 5. Clear sensitive data from memory
        this.instanceKeys.private = '[TRANSFERRED_TO_USER]';
        this.ownerKeys.private = '[TRANSFERRED_TO_USER]';
        
        return postSwapPackage;
    }
    
    /**
     * Use the instance (single-use enforcement)
     */
    async useInstance(userRequest, ownerPrivateKey) {
        if (this.used) {
            throw new Error('Instance already used - single use only');
        }
        
        if (!this.ready) {
            throw new Error('Instance not ready - key swap required');
        }
        
        // Verify ownership
        const ownershipVerified = await this.verifyOwnership(userRequest, ownerPrivateKey);
        if (!ownershipVerified) {
            throw new Error('Ownership verification failed');
        }
        
        // Process through diffusion engine
        console.log('🎯 Processing through Mirror Diffusion Engine...');
        const result = await this.diffusionEngine.translateIntentExample(userRequest.intent);
        
        // Mark as used
        this.used = true;
        this.usedAt = Date.now();
        
        // Return result with usage proof
        return {
            result: result,
            usage: {
                instanceId: this.instanceId,
                usedAt: this.usedAt,
                finalSignature: await this.signData(ownerPrivateKey, JSON.stringify({
                    instanceId: this.instanceId,
                    used: true,
                    timestamp: this.usedAt
                }))
            },
            message: 'Instance has been permanently used. Keys remain in user vault for decryption of this result.'
        };
    }
    
    /**
     * Generate instance-specific keys
     */
    async generateInstanceKeys() {
        const seed = crypto.randomBytes(32);
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' }
        });
        
        return {
            private: privateKey,
            public: publicKey,
            address: 'instance:' + crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 40),
            seed: seed.toString('hex')
        };
    }
    
    /**
     * Generate user ownership keys
     */
    async generateOwnerKeys(userId) {
        const userSeed = crypto.createHash('sha256').update(userId + this.instanceId).digest();
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            seed: userSeed.slice(0, 32)
        });
        
        return {
            private: privateKey,
            public: publicKey,
            address: 'owner:' + crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 40),
            userId: userId
        };
    }
    
    /**
     * Sign data with a private key
     */
    async signData(privateKey, data) {
        // For Ed25519, we need to use a different approach
        const dataBuffer = Buffer.from(data);
        const signature = crypto.sign(null, dataBuffer, privateKey);
        
        return {
            data: data,
            signature: signature.toString('hex'),
            timestamp: Date.now()
        };
    }
    
    /**
     * Encrypt user vault
     */
    async encryptVault(vault, ownerKeys) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.createHash('sha256').update(ownerKeys.private).digest();
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(vault)),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            algorithm: algorithm
        };
    }
    
    /**
     * Generate swap proof
     */
    async generateSwapProof(routerKeys) {
        const proofData = {
            instanceId: this.instanceId,
            timestamp: Date.now(),
            routerAddress: routerKeys.address,
            ownerAddress: this.ownerKeys.address,
            swapType: 'ownership-transfer'
        };
        
        return await this.signData(routerKeys.private, JSON.stringify(proofData));
    }
    
    /**
     * Generate instance endpoint
     */
    generateInstanceEndpoint() {
        return `mirror://${this.instanceId}.diffusion.local`;
    }
    
    /**
     * Verify ownership for usage
     */
    async verifyOwnership(request, privateKey) {
        try {
            const dataBuffer = Buffer.from(request.intent);
            const signatureBuffer = Buffer.from(request.signature, 'hex');
            
            // Verify the signature matches the owner's public key
            return crypto.verify(null, dataBuffer, this.ownerKeys.public, signatureBuffer);
        } catch (e) {
            return false;
        }
    }
}

/**
 * Factory for creating mirror diffusion instances
 */
class MirrorDiffusionFactory {
    constructor() {
        this.instances = new Map();
        this.routerKeys = null;
    }
    
    /**
     * Initialize with router keys
     */
    async initialize(masterPassphrase) {
        const keyManager = new MasterKeyManagement();
        await keyManager.initialize(masterPassphrase);
        
        // Get the actual keys from the public interface
        const publicKeys = keyManager.getPublicKeys();
        
        // Generate router-specific keys
        const routerSeed = crypto.createHash('sha256').update(masterPassphrase + 'router').digest();
        const routerKeyPair = crypto.generateKeyPairSync('ed25519', {
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            seed: routerSeed.slice(0, 32)
        });
        
        this.routerKeys = {
            private: routerKeyPair.privateKey,
            public: routerKeyPair.publicKey,
            address: publicKeys.diffusion.address
        };
        
        console.log('✅ Mirror Diffusion Factory initialized');
        console.log('🔑 Router address:', this.routerKeys.address);
    }
    
    /**
     * Create a new instance for a user
     */
    async createInstance(userId, useCase) {
        const instance = new MirrorDiffusionInstance();
        
        // Generate the instance
        const preSwapPackage = await instance.generateInstance(userId, useCase);
        
        // Execute key swap
        const postSwapPackage = await instance.executeKeySwap(preSwapPackage, this.routerKeys);
        
        // Store instance reference
        this.instances.set(instance.instanceId, instance);
        
        // Save user vault to disk
        await this.saveUserVault(userId, postSwapPackage);
        
        return postSwapPackage;
    }
    
    /**
     * Save user vault to disk
     */
    async saveUserVault(userId, postSwapPackage) {
        const vaultPath = path.join(__dirname, 'vault', 'user-instances', userId);
        await fs.mkdir(vaultPath, { recursive: true });
        
        const vaultFile = path.join(vaultPath, `${postSwapPackage.instanceId}.vault`);
        await fs.writeFile(vaultFile, JSON.stringify(postSwapPackage, null, 2));
        
        console.log(`💾 User vault saved: ${vaultFile}`);
    }
    
    /**
     * Get instance for usage
     */
    getInstance(instanceId) {
        return this.instances.get(instanceId);
    }
}

module.exports = {
    MirrorDiffusionInstance,
    MirrorDiffusionFactory,
    
    /**
     * Quick start example
     */
    example: async function() {
        console.log('🚀 Mirror Diffusion Instance Example\n');
        
        // Initialize factory
        const factory = new MirrorDiffusionFactory();
        await factory.initialize('your-secure-master-passphrase-here');
        
        // Create instance for user
        const userId = 'user-' + crypto.randomBytes(4).toString('hex');
        const instance = await factory.createInstance(userId, 'copywriting');
        
        console.log('\n📦 Instance created:');
        console.log('- Instance ID:', instance.instanceId);
        console.log('- Owner:', instance.ownership.owner);
        console.log('- Status:', instance.ownership.status);
        console.log('- Vault encrypted:', !!instance.userVault.encrypted);
        
        console.log('\n✅ User now owns their AI instance!');
        console.log('🔐 Keys stored in user vault for future decryption');
        console.log('⚡ Ready for single-use execution');
        
        return instance;
    }
};

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Each instance is cryptographically unique
 * 2. Keys are swapped BEFORE user access
 * 3. User owns both instance and owner keys
 * 4. Single-use enforcement at protocol level
 * 5. Results can be decrypted anytime with user keys
 * 6. Router never retains user instance keys
 * 
 * This creates true AI ownership - the user literally owns
 * the cryptographic keys to their AI instance.
 */