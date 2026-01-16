#!/usr/bin/env node

/**
 * ObfuscationVaultWriter.js
 * Handles encryption and obfuscation of presence data
 * Supports undo operations with soulkey validation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ObfuscationVaultWriter {
    constructor() {
        this.vaultPath = path.join(__dirname, '../../vault');
        this.obfuscatedPath = path.join(this.vaultPath, 'obfuscated');
        this.algorithm = 'aes-256-cbc';
        this.saltLength = 16;
    }
    
    /**
     * Generate encryption key from session data
     */
    generateKey(sessionData, salt) {
        return crypto.pbkdf2Sync(sessionData, salt, 100000, 32, 'sha256');
    }
    
    /**
     * Encrypt data with session-based key
     */
    encryptData(data, sessionHash) {
        const salt = crypto.randomBytes(this.saltLength);
        const key = this.generateKey(sessionHash, salt);
        const iv = crypto.randomBytes(16);
        
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        // Return encrypted package with metadata
        return {
            encrypted: encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            algorithm: this.algorithm,
            timestamp: Date.now()
        };
    }
    
    /**
     * Decrypt data with undo token
     */
    decryptData(encryptedPackage, sessionHash) {
        const salt = Buffer.from(encryptedPackage.salt, 'hex');
        const key = this.generateKey(sessionHash, salt);
        const iv = Buffer.from(encryptedPackage.iv, 'hex');
        
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        
        let decrypted = decipher.update(encryptedPackage.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    /**
     * Write obfuscated data to vault
     */
    writeObfuscated(visitorId, data, sessionHash) {
        const visitorPath = path.join(this.obfuscatedPath, visitorId);
        
        if (!fs.existsSync(visitorPath)) {
            fs.mkdirSync(visitorPath, { recursive: true });
        }
        
        // Encrypt sensitive data
        const encryptedPackage = this.encryptData(data, sessionHash);
        
        // Write encrypted data
        fs.writeFileSync(
            path.join(visitorPath, 'encrypted_data.json'),
            JSON.stringify(encryptedPackage, null, 2)
        );
        
        // Create obfuscation manifest
        const manifest = {
            visitorId: visitorId,
            created: Date.now(),
            dataType: typeof data,
            encrypted: true,
            algorithm: this.algorithm,
            reversible: true,
            sessionHashRequired: true
        };
        
        fs.writeFileSync(
            path.join(visitorPath, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        return encryptedPackage;
    }
    
    /**
     * Soft obfuscation for non-sensitive data
     */
    softObfuscate(data) {
        const obfuscated = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'string') {
                // Reverse and base64 encode
                obfuscated[key] = Buffer.from(value.split('').reverse().join('')).toString('base64');
            } else if (typeof value === 'number') {
                // XOR with magic number
                obfuscated[key] = value ^ 0xDEADBEEF;
            } else {
                // Hash complex objects
                obfuscated[key] = crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
            }
        }
        
        return obfuscated;
    }
    
    /**
     * Reverse soft obfuscation
     */
    reverseSoftObfuscation(obfuscated) {
        const original = {};
        
        for (const [key, value] of Object.entries(obfuscated)) {
            if (typeof value === 'string' && value.match(/^[A-Za-z0-9+/=]+$/)) {
                try {
                    // Try to reverse base64 and reverse string
                    const decoded = Buffer.from(value, 'base64').toString('utf8');
                    original[key] = decoded.split('').reverse().join('');
                } catch (e) {
                    original[key] = value; // Keep as is if decode fails
                }
            } else if (typeof value === 'number') {
                // Reverse XOR
                original[key] = value ^ 0xDEADBEEF;
            } else {
                // Hashes cannot be reversed
                original[key] = `[HASH: ${value}]`;
            }
        }
        
        return original;
    }
    
    /**
     * Validate undo token format
     */
    validateUndoToken(token) {
        return token && token.startsWith('soulkey-') && token.length === 16;
    }
    
    /**
     * Undo presence with token validation
     */
    async undoPresence(visitorId, undoToken) {
        const visitorPath = path.join(this.obfuscatedPath, visitorId);
        
        if (!fs.existsSync(visitorPath)) {
            throw new Error('Visitor session not found');
        }
        
        // Read and validate undo token
        const storedTokenPath = path.join(visitorPath, 'undo_token.txt');
        if (!fs.existsSync(storedTokenPath)) {
            throw new Error('No undo token found for session');
        }
        
        const storedToken = fs.readFileSync(storedTokenPath, 'utf8').trim();
        
        if (storedToken !== undoToken) {
            throw new Error('Invalid undo token');
        }
        
        // Read presence log before deletion
        const presenceLogPath = path.join(visitorPath, 'presence_log.json');
        const presenceLog = JSON.parse(fs.readFileSync(presenceLogPath, 'utf8'));
        
        // Create undo record
        const undoRecord = {
            visitorId: visitorId,
            undoToken: undoToken,
            undoTimestamp: Date.now(),
            originalTimestamp: presenceLog.timestamp,
            inputType: presenceLog.inputType,
            duration: Date.now() - presenceLog.timestamp
        };
        
        // Delete visitor directory
        this.deleteDirectory(visitorPath);
        
        // Update presence tracker
        this.updatePresenceTrackerUndo(visitorId, undoRecord);
        
        console.log(`✅ Presence ${visitorId} has been undone`);
        
        return undoRecord;
    }
    
    /**
     * Recursively delete directory
     */
    deleteDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(file => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    this.deleteDirectory(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }
    
    /**
     * Update tracker after undo
     */
    updatePresenceTrackerUndo(visitorId, undoRecord) {
        const trackerPath = path.join(this.vaultPath, 'logs', 'presence_tracker.json');
        
        if (fs.existsSync(trackerPath)) {
            const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
            
            if (tracker.sessions[visitorId]) {
                tracker.sessions[visitorId].active = false;
                tracker.sessions[visitorId].undone = true;
                tracker.sessions[visitorId].undoTimestamp = undoRecord.undoTimestamp;
            }
            
            // Add to undo history
            if (!tracker.undoHistory) {
                tracker.undoHistory = [];
            }
            tracker.undoHistory.push(undoRecord);
            
            fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
        }
    }
    
    /**
     * CLI interface for undo operations
     */
    async runCLI() {
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            console.log('Usage:');
            console.log('  node ObfuscationVaultWriter.js undo <visitorId> <undoToken>');
            console.log('  node ObfuscationVaultWriter.js list');
            process.exit(1);
        }
        
        const [command, ...params] = args;
        
        switch (command) {
            case 'undo':
                if (params.length < 2) {
                    console.log('❌ Please provide visitorId and undoToken');
                    process.exit(1);
                }
                
                try {
                    await this.undoPresence(params[0], params[1]);
                } catch (error) {
                    console.log(`❌ Undo failed: ${error.message}`);
                    process.exit(1);
                }
                break;
                
            case 'list':
                this.listObfuscatedSessions();
                break;
                
            default:
                console.log('❌ Unknown command');
                process.exit(1);
        }
    }
    
    /**
     * List all obfuscated sessions
     */
    listObfuscatedSessions() {
        if (!fs.existsSync(this.obfuscatedPath)) {
            console.log('📭 No obfuscated sessions found');
            return;
        }
        
        const sessions = fs.readdirSync(this.obfuscatedPath);
        console.log(`\n🔐 Obfuscated sessions: ${sessions.length}\n`);
        
        sessions.forEach(session => {
            const manifestPath = path.join(this.obfuscatedPath, session, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                console.log(`${session}`);
                console.log(`  Created: ${new Date(manifest.created).toLocaleString()}`);
                console.log(`  Encrypted: ${manifest.encrypted ? '✅' : '❌'}`);
                console.log(`  Algorithm: ${manifest.algorithm || 'N/A'}`);
                console.log('');
            }
        });
    }
}

// Run CLI if called directly
if (require.main === module) {
    const writer = new ObfuscationVaultWriter();
    writer.runCLI();
}

module.exports = ObfuscationVaultWriter;