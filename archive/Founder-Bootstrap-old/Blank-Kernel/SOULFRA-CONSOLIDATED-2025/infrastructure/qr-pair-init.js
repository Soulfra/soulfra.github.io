// QR Pair Init - Generates session QR for mobile device pairing
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

class QRPairInit {
    constructor() {
        this.sessionTrackerPath = path.join(__dirname, 'session-tracker.json');
        this.vaultPath = path.join(__dirname, '../../vault');
        this.pairingEndpoint = process.env.PAIRING_ENDPOINT || 'https://mirror.local/pair';
        
        this.sessionConfig = {
            expiryMinutes: 10,
            maxDevices: 3,
            requirePin: false,
            encryptionLevel: 'standard'
        };
        
        console.log('📱 QR Pairing initialized');
    }
    
    async generatePairingSession(options = {}) {
        const session = {
            id: this.generateSessionId(),
            created: new Date().toISOString(),
            expires: new Date(Date.now() + this.sessionConfig.expiryMinutes * 60000).toISOString(),
            status: 'pending',
            devices: [],
            config: {
                ...this.sessionConfig,
                ...options
            },
            vaultAccess: {
                read: true,
                write: options.allowWrite || false,
                paths: options.vaultPaths || ['memory/audio-prompts', 'exports']
            },
            metadata: {
                purpose: options.purpose || 'voice-interaction',
                createdBy: options.createdBy || 'system',
                features: options.features || ['voice', 'reflection', 'export']
            }
        };
        
        // Generate pairing token
        session.pairingToken = this.generatePairingToken(session);
        
        // Generate QR data
        const qrData = this.generateQRData(session);
        session.qrData = qrData;
        
        // Generate QR code image
        const qrCode = await this.generateQRCode(qrData);
        session.qrCode = qrCode;
        
        // Save session
        await this.saveSession(session);
        
        console.log(`\n🔐 Pairing Session Created`);
        console.log(`   ID: ${session.id}`);
        console.log(`   Expires: ${new Date(session.expires).toLocaleTimeString()}`);
        console.log(`   Token: ${session.pairingToken.substring(0, 16)}...`);
        
        return session;
    }
    
    generateSessionId() {
        return `pair_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generatePairingToken(session) {
        const tokenData = {
            sessionId: session.id,
            created: session.created,
            vaultAccess: session.vaultAccess
        };
        
        // Create HMAC signature
        const secret = process.env.PAIRING_SECRET || 'mirror-default-secret';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(tokenData));
        
        return hmac.digest('hex');
    }
    
    generateQRData(session) {
        const qrPayload = {
            v: 1, // Version
            t: 'pair', // Type
            s: session.id, // Session ID
            k: session.pairingToken.substring(0, 32), // Key prefix
            e: session.expires, // Expiry
            u: `${this.pairingEndpoint}/${session.id}`, // URL
            f: session.metadata.features // Features
        };
        
        // Encode as base64 for compactness
        return Buffer.from(JSON.stringify(qrPayload)).toString('base64');
    }
    
    async generateQRCode(data) {
        try {
            // Generate QR code options
            const options = {
                errorCorrectionLevel: 'M',
                type: 'svg',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#1e293b',
                    light: '#f1f5f9'
                },
                width: 256
            };
            
            // Generate QR code
            const qrSvg = await QRCode.toString(data, options);
            
            // Also generate PNG for display
            const qrPng = await QRCode.toDataURL(data, {
                ...options,
                type: 'image/png'
            });
            
            return {
                svg: qrSvg,
                png: qrPng,
                raw: data
            };
            
        } catch (error) {
            console.error('❌ QR generation error:', error.message);
            
            // Fallback ASCII QR for terminal
            const asciiQR = await this.generateASCIIQR(data);
            return {
                ascii: asciiQR,
                raw: data
            };
        }
    }
    
    async generateASCIIQR(data) {
        // Simple ASCII representation for terminal
        const size = 25;
        const qr = [];
        
        // Create border
        qr.push('█'.repeat(size + 4));
        
        // Simulate QR pattern (not a real QR code)
        for (let i = 0; i < size; i++) {
            let row = '██';
            for (let j = 0; j < size; j++) {
                // Create a pattern based on data hash
                const hash = crypto.createHash('md5').update(`${data}${i}${j}`).digest('hex');
                row += parseInt(hash[0], 16) % 2 === 0 ? '  ' : '██';
            }
            row += '██';
            qr.push(row);
        }
        
        // Add border
        qr.push('█'.repeat(size + 4));
        
        return qr.join('\n');
    }
    
    async saveSession(session) {
        try {
            // Load existing sessions
            let tracker = { sessions: {}, history: [] };
            try {
                const trackerContent = await fs.readFile(this.sessionTrackerPath, 'utf-8');
                tracker = JSON.parse(trackerContent);
            } catch (error) {
                // File doesn't exist yet
            }
            
            // Add new session
            tracker.sessions[session.id] = session;
            tracker.lastUpdated = new Date().toISOString();
            
            // Add to history
            tracker.history.push({
                sessionId: session.id,
                created: session.created,
                purpose: session.metadata.purpose
            });
            
            // Clean expired sessions
            await this.cleanExpiredSessions(tracker);
            
            // Save updated tracker
            await fs.writeFile(
                this.sessionTrackerPath,
                JSON.stringify(tracker, null, 2)
            );
            
        } catch (error) {
            console.error('❌ Error saving session:', error.message);
            throw error;
        }
    }
    
    async cleanExpiredSessions(tracker) {
        const now = new Date();
        const expiredSessions = [];
        
        for (const [sessionId, session] of Object.entries(tracker.sessions)) {
            if (new Date(session.expires) < now) {
                expiredSessions.push(sessionId);
            }
        }
        
        expiredSessions.forEach(sessionId => {
            delete tracker.sessions[sessionId];
        });
        
        if (expiredSessions.length > 0) {
            console.log(`🧹 Cleaned ${expiredSessions.length} expired sessions`);
        }
    }
    
    async validatePairing(sessionId, deviceInfo) {
        try {
            // Load session
            const trackerContent = await fs.readFile(this.sessionTrackerPath, 'utf-8');
            const tracker = JSON.parse(trackerContent);
            const session = tracker.sessions[sessionId];
            
            if (!session) {
                throw new Error('Session not found');
            }
            
            // Check expiry
            if (new Date(session.expires) < new Date()) {
                throw new Error('Session expired');
            }
            
            // Check device limit
            if (session.devices.length >= session.config.maxDevices) {
                throw new Error('Device limit reached');
            }
            
            // Add device
            const device = {
                id: crypto.randomBytes(8).toString('hex'),
                paired: new Date().toISOString(),
                info: deviceInfo,
                lastSeen: new Date().toISOString()
            };
            
            session.devices.push(device);
            session.status = 'active';
            
            // Save updated session
            await fs.writeFile(
                this.sessionTrackerPath,
                JSON.stringify(tracker, null, 2)
            );
            
            console.log(`✅ Device paired: ${device.id}`);
            
            return {
                success: true,
                session: session,
                device: device,
                vaultAccess: session.vaultAccess
            };
            
        } catch (error) {
            console.error('❌ Pairing validation error:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async displayQRCode(session) {
        console.log('\n📱 Scan this QR code from your phone:\n');
        
        if (session.qrCode.ascii) {
            console.log(session.qrCode.ascii);
        } else {
            console.log('QR Code generated. View in browser or save as image.');
            console.log(`Data: ${session.qrData.substring(0, 50)}...`);
        }
        
        console.log('\n📝 Instructions:');
        console.log('1. Open MirrorOS mobile app');
        console.log('2. Tap "Pair with Desktop"');
        console.log('3. Scan the QR code');
        console.log('4. Start talking to Cal\n');
        
        console.log(`🔗 Manual pairing URL: ${this.pairingEndpoint}/${session.id}`);
        console.log(`🔑 Session expires in ${this.sessionConfig.expiryMinutes} minutes`);
    }
    
    async generateTestQR() {
        // Generate test QR for examples
        const testSession = await this.generatePairingSession({
            purpose: 'test',
            createdBy: 'example',
            features: ['voice', 'reflection', 'export', 'test']
        });
        
        // Save test QR image
        const testQRPath = path.join(__dirname, '../../vault/tools/MirrorOS_Final_Integration/phone-pairing/examples/test-session-qr.png');
        
        if (testSession.qrCode.png) {
            // Extract base64 data
            const base64Data = testSession.qrCode.png.replace(/^data:image\/png;base64,/, '');
            await fs.writeFile(testQRPath, Buffer.from(base64Data, 'base64'));
            console.log(`\n✅ Test QR saved to: ${testQRPath}`);
        }
        
        return testSession;
    }
}

// Export for use in router
module.exports = QRPairInit;

// CLI interface
if (require.main === module) {
    const pairing = new QRPairInit();
    
    console.log('📱 MirrorOS Phone Pairing');
    console.log('   Generating pairing session...\n');
    
    pairing.generatePairingSession({
        purpose: 'voice-cal-interaction',
        allowWrite: true,
        features: ['voice', 'reflection', 'export', 'realtime']
    })
    .then(session => {
        pairing.displayQRCode(session);
        
        // Generate test QR
        return pairing.generateTestQR();
    })
    .then(() => {
        console.log('\n✨ Pairing ready. Scan QR code to connect.');
    })
    .catch(console.error);
}

// Mock QRCode module for demo (in production, use actual qrcode npm package)
if (!QRCode) {
    var QRCode = {
        toString: async (data, options) => 'QR_CODE_SVG_HERE',
        toDataURL: async (data, options) => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    };
}