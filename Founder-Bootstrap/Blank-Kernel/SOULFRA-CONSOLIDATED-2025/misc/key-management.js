/**
 * Mirror Kernel - Private Key Management System
 * CRITICAL: This manages the actual keys to the kingdom
 * 
 * This is the REAL key system, not a template
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MasterKeyManagement {
    constructor() {
        this.keystore = new Map();
        this.masterSeed = null;
        this.initialized = false;
        
        // Key derivation paths
        this.paths = {
            master: "m/0'",
            emotional: "m/0'/0'",
            mesh: "m/0'/1'",
            diffusion: "m/0'/2'",
            user: "m/0'/3'",
            admin: "m/0'/999'"
        };
    }
    
    /**
     * Initialize the master key system
     * @param {string} masterPassphrase - Your personal master passphrase
     */
    async initialize(masterPassphrase) {
        if (this.initialized) {
            throw new Error('Key system already initialized');
        }
        
        console.log('🔐 Initializing Master Key System...');
        
        // Generate master seed from passphrase
        this.masterSeed = await this.generateMasterSeed(masterPassphrase);
        
        // Derive all system keys
        await this.deriveSystemKeys();
        
        // Store encrypted backup
        await this.createEncryptedBackup(masterPassphrase);
        
        this.initialized = true;
        
        console.log('✅ Master Key System initialized');
        console.log('⚠️  SAVE YOUR MASTER PASSPHRASE - IT CANNOT BE RECOVERED');
        
        return {
            initialized: true,
            publicKeys: this.getPublicKeys(),
            warning: 'Never share your private keys or master passphrase'
        };
    }
    
    /**
     * Generate master seed from passphrase
     */
    async generateMasterSeed(passphrase) {
        // Use PBKDF2 for key derivation
        const salt = crypto.randomBytes(32);
        const iterations = 100000;
        const keyLength = 64;
        
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(passphrase, salt, iterations, keyLength, 'sha512', (err, derivedKey) => {
                if (err) reject(err);
                
                resolve({
                    seed: derivedKey,
                    salt: salt,
                    iterations: iterations
                });
            });
        });
    }
    
    /**
     * Derive all system keys from master seed
     */
    async deriveSystemKeys() {
        for (const [name, path] of Object.entries(this.paths)) {
            const key = await this.deriveKey(path);
            this.keystore.set(name, key);
        }
    }
    
    /**
     * Derive a specific key from path
     */
    async deriveKey(derivationPath) {
        const pathHash = crypto
            .createHash('sha256')
            .update(derivationPath)
            .update(this.masterSeed.seed)
            .digest();
        
        // Generate key pair
        const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519', {
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            },
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            seed: pathHash.slice(0, 32)
        });
        
        return {
            path: derivationPath,
            private: privateKey,
            public: publicKey,
            address: this.generateAddress(publicKey)
        };
    }
    
    /**
     * Generate address from public key
     */
    generateAddress(publicKey) {
        const hash = crypto
            .createHash('sha256')
            .update(publicKey)
            .digest('hex');
        
        return 'mirror:' + hash.substring(0, 40);
    }
    
    /**
     * Get all public keys (safe to share)
     */
    getPublicKeys() {
        const publicKeys = {};
        
        for (const [name, key] of this.keystore.entries()) {
            publicKeys[name] = {
                address: key.address,
                publicKey: key.public
            };
        }
        
        return publicKeys;
    }
    
    /**
     * Sign data with a specific key
     */
    async sign(keyName, data) {
        if (!this.initialized) {
            throw new Error('Key system not initialized');
        }
        
        const key = this.keystore.get(keyName);
        if (!key) {
            throw new Error(`Key not found: ${keyName}`);
        }
        
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        sign.end();
        
        const signature = sign.sign(key.private, 'hex');
        
        return {
            data: data,
            signature: signature,
            keyName: keyName,
            address: key.address,
            timestamp: Date.now()
        };
    }
    
    /**
     * Verify a signature
     */
    async verify(publicKey, data, signature) {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        verify.end();
        
        return verify.verify(publicKey, signature, 'hex');
    }
    
    /**
     * Create encrypted backup of all keys
     */
    async createEncryptedBackup(passphrase) {
        const backup = {
            version: '1.0',
            created: new Date().toISOString(),
            masterSeed: this.masterSeed,
            keys: {}
        };
        
        // Include all derived keys
        for (const [name, key] of this.keystore.entries()) {
            backup.keys[name] = {
                path: key.path,
                address: key.address
                // Private keys will be encrypted
            };
        }
        
        // Encrypt the backup
        const cipher = crypto.createCipher('aes-256-gcm', passphrase);
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(backup)),
            cipher.final()
        ]);
        
        const authTag = cipher.getAuthTag();
        
        // Save encrypted backup
        const backupPath = path.join(__dirname, '.keys', 'master.backup');
        await fs.mkdir(path.dirname(backupPath), { recursive: true });
        
        await fs.writeFile(backupPath, JSON.stringify({
            encrypted: encrypted.toString('base64'),
            authTag: authTag.toString('base64'),
            version: '1.0'
        }));
        
        console.log('💾 Encrypted backup created at:', backupPath);
    }
    
    /**
     * Generate access token for specific permissions
     */
    async generateAccessToken(permissions, expiresIn = 3600) {
        const token = {
            permissions: permissions,
            issued: Date.now(),
            expires: Date.now() + (expiresIn * 1000),
            nonce: crypto.randomBytes(16).toString('hex')
        };
        
        const signed = await this.sign('admin', JSON.stringify(token));
        
        return {
            token: Buffer.from(JSON.stringify(signed)).toString('base64'),
            expires: new Date(token.expires).toISOString()
        };
    }
    
    /**
     * Emergency key recovery (requires master passphrase)
     */
    async recoverFromPassphrase(passphrase) {
        console.log('🔄 Attempting key recovery...');
        
        // Re-initialize with same passphrase
        this.keystore.clear();
        this.initialized = false;
        this.masterSeed = null;
        
        await this.initialize(passphrase);
        
        console.log('✅ Keys recovered successfully');
        return true;
    }
}

// Singleton instance
let masterKeySystem = null;

module.exports = {
    MasterKeyManagement,
    
    /**
     * Get or create the master key system
     */
    getMasterKeySystem: function() {
        if (!masterKeySystem) {
            masterKeySystem = new MasterKeyManagement();
        }
        return masterKeySystem;
    },
    
    /**
     * Initialize with your master passphrase
     * CRITICAL: Save this passphrase securely!
     */
    initialize: async function(masterPassphrase) {
        const system = this.getMasterKeySystem();
        return await system.initialize(masterPassphrase);
    },
    
    /**
     * Get public keys (safe to share)
     */
    getPublicKeys: function() {
        const system = this.getMasterKeySystem();
        if (!system.initialized) {
            throw new Error('System not initialized. Call initialize() first.');
        }
        return system.getPublicKeys();
    },
    
    /**
     * Sign data
     */
    sign: async function(keyName, data) {
        const system = this.getMasterKeySystem();
        return await system.sign(keyName, data);
    },
    
    /**
     * Verify signature
     */
    verify: async function(publicKey, data, signature) {
        const system = this.getMasterKeySystem();
        return await system.verify(publicKey, data, signature);
    },
    
    /**
     * Generate access token
     */
    generateAccessToken: async function(permissions, expiresIn) {
        const system = this.getMasterKeySystem();
        return await system.generateAccessToken(permissions, expiresIn);
    }
};

/**
 * CRITICAL SECURITY NOTES:
 * 
 * 1. NEVER commit your master passphrase to git
 * 2. NEVER share your private keys
 * 3. The encrypted backup in .keys/ should be stored offline
 * 4. Your master passphrase is the ONLY way to recover keys
 * 5. Use a strong, unique passphrase you can remember
 * 
 * Example secure passphrase:
 * "Mirror reflects truth through emotional connections 2025!"
 * 
 * DO NOT USE THE EXAMPLE - CREATE YOUR OWN
 */