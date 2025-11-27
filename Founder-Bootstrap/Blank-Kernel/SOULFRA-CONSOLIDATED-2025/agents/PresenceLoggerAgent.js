#!/usr/bin/env node

/**
 * PresenceLoggerAgent.js
 * Detects and logs user presence in obfuscated format
 * Handles QR scans, voice input, and file drops
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

class PresenceLoggerAgent {
    constructor() {
        this.vaultPath = path.join(__dirname, '../../vault');
        this.obfuscatedPath = path.join(this.vaultPath, 'obfuscated');
        this.logsPath = path.join(this.vaultPath, 'logs');
        
        // Ensure directories exist
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.obfuscatedPath, this.logsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * Generate unique session hash for obfuscation
     */
    generateSessionHash(input) {
        const timestamp = Date.now();
        const sessionData = `${input}_${timestamp}_${Math.random()}`;
        return crypto.createHash('sha256').update(sessionData).digest('hex').substring(0, 8);
    }
    
    /**
     * Generate undo token (soulkey)
     */
    generateUndoToken() {
        const randomBytes = crypto.randomBytes(4).toString('hex');
        return `soulkey-${randomBytes}`;
    }
    
    /**
     * Log presence from various input types
     */
    async logPresence(inputType, data, mood = null) {
        const sessionHash = this.generateSessionHash(data);
        const undoToken = this.generateUndoToken();
        const visitorId = `visitor_⚙️${sessionHash}`;
        const visitorPath = path.join(this.obfuscatedPath, visitorId);
        
        // Create obfuscated visitor directory
        if (!fs.existsSync(visitorPath)) {
            fs.mkdirSync(visitorPath, { recursive: true });
        }
        
        // Create presence log
        const presenceLog = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            inputType: inputType,
            sessionHash: sessionHash,
            visitorId: visitorId,
            obfuscatedData: this.obfuscateData(data),
            undoToken: undoToken,
            mood: mood,
            sealed: false
        };
        
        // Write presence log
        fs.writeFileSync(
            path.join(visitorPath, 'presence_log.json'),
            JSON.stringify(presenceLog, null, 2)
        );
        
        // Write undo token
        fs.writeFileSync(
            path.join(visitorPath, 'undo_token.txt'),
            undoToken
        );
        
        // Write mood/trigger if provided
        if (mood) {
            fs.writeFileSync(
                path.join(visitorPath, 'mood_or_trigger.txt'),
                mood
            );
        }
        
        // Log to main presence tracker
        this.updatePresenceTracker(visitorId, presenceLog);
        
        console.log(`✨ Presence logged: ${visitorId}`);
        console.log(`🔑 Undo token: ${undoToken}`);
        
        return {
            visitorId: visitorId,
            undoToken: undoToken,
            path: visitorPath
        };
    }
    
    /**
     * Obfuscate sensitive data
     */
    obfuscateData(data) {
        if (typeof data === 'string') {
            // Simple character rotation for demo
            return Buffer.from(data).toString('base64');
        }
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
    
    /**
     * Update central presence tracker
     */
    updatePresenceTracker(visitorId, log) {
        const trackerPath = path.join(this.logsPath, 'presence_tracker.json');
        let tracker = { sessions: {} };
        
        if (fs.existsSync(trackerPath)) {
            tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
        }
        
        tracker.sessions[visitorId] = {
            timestamp: log.timestamp,
            inputType: log.inputType,
            undoToken: log.undoToken,
            active: true
        };
        
        tracker.lastUpdated = Date.now();
        tracker.totalSessions = Object.keys(tracker.sessions).length;
        
        fs.writeFileSync(trackerPath, JSON.stringify(tracker, null, 2));
    }
    
    /**
     * Handle QR scan input
     */
    async handleQRScan(qrData) {
        console.log('📱 Processing QR scan...');
        return await this.logPresence('qr_scan', qrData, 'curious');
    }
    
    /**
     * Handle voice input
     */
    async handleVoiceInput(transcript, mood = null) {
        console.log('🎤 Processing voice input...');
        return await this.logPresence('voice', transcript, mood || 'engaged');
    }
    
    /**
     * Handle file drop
     */
    async handleFileDrop(filePath) {
        console.log('📁 Processing file drop...');
        const fileName = path.basename(filePath);
        const fileStats = fs.statSync(filePath);
        
        const fileData = {
            name: fileName,
            size: fileStats.size,
            modified: fileStats.mtime,
            hash: this.hashFile(filePath)
        };
        
        return await this.logPresence('file_drop', fileData, 'productive');
    }
    
    /**
     * Hash file contents
     */
    hashFile(filePath) {
        const fileBuffer = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }
    
    /**
     * Interactive CLI mode
     */
    async runInteractive() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log('\n🪞 Mirror Presence Logger Active\n');
        console.log('Commands:');
        console.log('  qr <data>     - Simulate QR scan');
        console.log('  voice <text>  - Simulate voice input');
        console.log('  file <path>   - Simulate file drop');
        console.log('  list          - Show all sessions');
        console.log('  exit          - Exit logger\n');
        
        const promptUser = () => {
            rl.question('presence> ', async (input) => {
                const [command, ...args] = input.trim().split(' ');
                
                switch (command) {
                    case 'qr':
                        if (args.length > 0) {
                            await this.handleQRScan(args.join(' '));
                        }
                        break;
                        
                    case 'voice':
                        if (args.length > 0) {
                            await this.handleVoiceInput(args.join(' '));
                        }
                        break;
                        
                    case 'file':
                        if (args.length > 0 && fs.existsSync(args[0])) {
                            await this.handleFileDrop(args[0]);
                        } else {
                            console.log('❌ File not found');
                        }
                        break;
                        
                    case 'list':
                        this.listSessions();
                        break;
                        
                    case 'exit':
                        console.log('👋 Presence logger shutting down');
                        rl.close();
                        return;
                        
                    default:
                        console.log('❓ Unknown command');
                }
                
                promptUser();
            });
        };
        
        promptUser();
    }
    
    /**
     * List all presence sessions
     */
    listSessions() {
        const trackerPath = path.join(this.logsPath, 'presence_tracker.json');
        
        if (!fs.existsSync(trackerPath)) {
            console.log('📭 No sessions logged yet');
            return;
        }
        
        const tracker = JSON.parse(fs.readFileSync(trackerPath, 'utf8'));
        console.log(`\n📊 Total sessions: ${tracker.totalSessions}`);
        
        Object.entries(tracker.sessions).forEach(([id, session]) => {
            console.log(`\n${id}`);
            console.log(`  Type: ${session.inputType}`);
            console.log(`  Time: ${new Date(session.timestamp).toLocaleString()}`);
            console.log(`  Token: ${session.undoToken}`);
            console.log(`  Active: ${session.active ? '✅' : '❌'}`);
        });
        console.log('');
    }
}

// Run if called directly
if (require.main === module) {
    const agent = new PresenceLoggerAgent();
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Interactive mode
        agent.runInteractive();
    } else {
        // Command line mode
        const [command, ...params] = args;
        
        switch (command) {
            case 'qr':
                agent.handleQRScan(params.join(' ')).then(() => process.exit(0));
                break;
            case 'voice':
                agent.handleVoiceInput(params.join(' ')).then(() => process.exit(0));
                break;
            case 'file':
                agent.handleFileDrop(params[0]).then(() => process.exit(0));
                break;
            default:
                console.log('Usage: node PresenceLoggerAgent.js [qr|voice|file] <data>');
                process.exit(1);
        }
    }
}

module.exports = PresenceLoggerAgent;