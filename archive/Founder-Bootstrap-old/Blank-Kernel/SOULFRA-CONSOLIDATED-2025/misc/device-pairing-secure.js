// Secure Device Pairing - Enables two-way vault pairing using QR codes with geofencing

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecureDevicePairing {
    constructor() {
        this.vaultPath = path.join(__dirname, '../');
        this.sessionPath = path.join(this.vaultPath, 'pairing');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.activeSessions = new Map();
        
        // Geofencing configuration
        this.geofenceRadius = 1000; // meters
        this.locationAccuracy = 50; // meters
    }

    async initialize() {
        await fs.mkdir(this.sessionPath, { recursive: true });
        await fs.mkdir(this.logsPath, { recursive: true });
        console.log('🔐 Secure device pairing initialized');
    }

    async generatePairingSession(deviceInfo = {}) {
        const sessionId = this.generateSessionId();
        const pairingToken = this.generateSecureToken();
        const deviceUUID = this.generateDeviceUUID(deviceInfo);
        
        const session = {
            sessionId: sessionId,
            pairingToken: pairingToken,
            deviceUUID: deviceUUID,
            created: new Date().toISOString(),
            expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
            status: 'pending',
            deviceInfo: {
                userAgent: deviceInfo.userAgent || 'unknown',
                platform: deviceInfo.platform || 'unknown',
                screenSize: deviceInfo.screenSize || 'unknown',
                language: deviceInfo.language || 'en',
                capabilities: deviceInfo.capabilities || {}
            },
            location: null,
            geofence: null,
            paired: false,
            vaultAccess: false
        };

        // Save session
        await this.saveSession(session);
        
        // Store in memory for quick access
        this.activeSessions.set(sessionId, session);

        // Generate QR data
        const qrData = {
            v: 2, // version
            t: 'mirror_pair', // type
            s: sessionId,
            k: pairingToken.substring(0, 16), // truncated for QR
            e: session.expires,
            d: deviceUUID.substring(0, 8) // device hint
        };

        console.log(`📱 Pairing session created: ${sessionId}`);
        
        return {
            sessionId: sessionId,
            qrData: qrData,
            qrString: Buffer.from(JSON.stringify(qrData)).toString('base64'),
            expires: session.expires
        };
    }

    async validatePairing(qrData, scannerDeviceInfo = {}) {
        try {
            const { s: sessionId, k: tokenHint, d: deviceHint } = qrData;
            
            // Get session
            const session = await this.getSession(sessionId);
            if (!session) {
                return { valid: false, reason: 'Session not found' };
            }

            // Check expiration
            if (new Date() > new Date(session.expires)) {
                await this.invalidateSession(sessionId);
                return { valid: false, reason: 'Session expired' };
            }

            // Validate token hint
            if (!session.pairingToken.startsWith(tokenHint)) {
                return { valid: false, reason: 'Invalid token' };
            }

            // Check if already paired
            if (session.paired) {
                return { valid: false, reason: 'Already paired' };
            }

            // Capture location if available
            if (scannerDeviceInfo.location) {
                await this.captureLocation(sessionId, scannerDeviceInfo.location);
            }

            // Complete pairing
            session.paired = true;
            session.pairedAt = new Date().toISOString();
            session.scannerDevice = {
                userAgent: scannerDeviceInfo.userAgent,
                platform: scannerDeviceInfo.platform,
                location: scannerDeviceInfo.location
            };
            
            await this.saveSession(session);
            
            // Log pairing event
            await this.logPairingEvent('pair_success', sessionId, {
                deviceUUID: session.deviceUUID,
                location: session.location,
                scannerDevice: scannerDeviceInfo
            });

            console.log(`✅ Device paired successfully: ${sessionId}`);

            return { 
                valid: true, 
                sessionId: sessionId,
                deviceUUID: session.deviceUUID,
                greeting: this.generatePairingGreeting(session),
                vaultAccess: true
            };

        } catch (error) {
            console.error('Pairing validation error:', error);
            return { valid: false, reason: 'Validation failed' };
        }
    }

    async captureLocation(sessionId, locationData) {
        try {
            const session = await this.getSession(sessionId);
            if (!session) return;

            const location = {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy || this.locationAccuracy,
                timestamp: new Date().toISOString(),
                city: await this.geocodeLocation(locationData.latitude, locationData.longitude)
            };

            // Generate geofence
            const geofence = this.generateGeofence(location);
            
            session.location = location;
            session.geofence = geofence;
            
            await this.saveSession(session);
            
            // Log to location fingerprint
            await this.updateLocationFingerprint(sessionId, location, geofence);
            
            console.log(`📍 Location captured for ${sessionId}: ${location.city || 'Unknown'}`);
            
        } catch (error) {
            console.error('Location capture error:', error);
        }
    }

    async geocodeLocation(lat, lng) {
        // Simplified geocoding - in production use actual geocoding service
        const cities = [
            { lat: 37.7749, lng: -122.4194, name: 'San Francisco' },
            { lat: 40.7128, lng: -74.0060, name: 'New York' },
            { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
            { lat: 51.5074, lng: -0.1278, name: 'London' },
            { lat: 48.8566, lng: 2.3522, name: 'Paris' }
        ];

        let closestCity = 'Unknown';
        let minDistance = Infinity;

        cities.forEach(city => {
            const distance = this.calculateDistance(lat, lng, city.lat, city.lng);
            if (distance < minDistance) {
                minDistance = distance;
                closestCity = city.name;
            }
        });

        return minDistance < 100 ? closestCity : 'Unknown';
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lng2-lng1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    generateGeofence(location) {
        const hash = crypto.createHash('sha256')
            .update(`${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`)
            .digest('hex')
            .substring(0, 8);

        return {
            center: {
                lat: Math.round(location.latitude * 1000) / 1000,
                lng: Math.round(location.longitude * 1000) / 1000
            },
            radius: this.geofenceRadius,
            hash: hash,
            created: new Date().toISOString()
        };
    }

    async updateLocationFingerprint(sessionId, location, geofence) {
        const fingerprintPath = path.join(this.logsPath, 'location-fingerprint.json');
        
        let fingerprint = { zones: [], sessions: [] };
        try {
            const existing = await fs.readFile(fingerprintPath, 'utf8');
            fingerprint = JSON.parse(existing);
        } catch {
            // New file
        }

        // Add zone if not exists
        const existingZone = fingerprint.zones.find(z => z.hash === geofence.hash);
        if (!existingZone) {
            fingerprint.zones.push({
                hash: geofence.hash,
                center: geofence.center,
                radius: geofence.radius,
                city: location.city,
                firstSeen: new Date().toISOString(),
                sessionCount: 1
            });
        } else {
            existingZone.sessionCount++;
        }

        // Add session
        fingerprint.sessions.push({
            sessionId: sessionId,
            geofenceHash: geofence.hash,
            timestamp: new Date().toISOString(),
            city: location.city
        });

        // Keep last 1000 sessions
        if (fingerprint.sessions.length > 1000) {
            fingerprint.sessions = fingerprint.sessions.slice(-1000);
        }

        await fs.writeFile(fingerprintPath, JSON.stringify(fingerprint, null, 2));
    }

    generatePairingGreeting(session) {
        const city = session.location?.city || 'an unknown location';
        const device = session.deviceInfo.platform || 'your device';
        
        return `You paired this mirror from ${city}. All reflection is local unless exported.`;
    }

    generateSessionId() {
        return 'ses_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
    }

    generateSecureToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    generateDeviceUUID(deviceInfo) {
        const fingerprint = [
            deviceInfo.userAgent || '',
            deviceInfo.platform || '',
            deviceInfo.screenSize || '',
            deviceInfo.language || '',
            Date.now().toString()
        ].join('|');
        
        return 'dev_' + crypto.createHash('sha256')
            .update(fingerprint)
            .digest('hex')
            .substring(0, 16);
    }

    async saveSession(session) {
        const sessionFile = path.join(this.sessionPath, `session-${session.sessionId}.json`);
        await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
    }

    async getSession(sessionId) {
        try {
            const sessionFile = path.join(this.sessionPath, `session-${sessionId}.json`);
            const data = await fs.readFile(sessionFile, 'utf8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async invalidateSession(sessionId) {
        try {
            const sessionFile = path.join(this.sessionPath, `session-${sessionId}.json`);
            const session = await this.getSession(sessionId);
            if (session) {
                session.status = 'expired';
                session.invalidatedAt = new Date().toISOString();
                await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));
            }
            this.activeSessions.delete(sessionId);
        } catch (error) {
            console.error('Session invalidation error:', error);
        }
    }

    async logPairingEvent(eventType, sessionId, data) {
        const eventLogPath = path.join(this.logsPath, 'pairing-events.json');
        
        let events = { events: [] };
        try {
            const existing = await fs.readFile(eventLogPath, 'utf8');
            events = JSON.parse(existing);
        } catch {
            // New file
        }

        events.events.push({
            timestamp: new Date().toISOString(),
            type: eventType,
            sessionId: sessionId,
            data: data
        });

        // Keep last 1000 events
        if (events.events.length > 1000) {
            events.events = events.events.slice(-1000);
        }

        await fs.writeFile(eventLogPath, JSON.stringify(events, null, 2));
    }

    async getActiveSession(sessionId) {
        return this.activeSessions.get(sessionId) || await this.getSession(sessionId);
    }

    async cleanup() {
        // Clean up expired sessions
        const now = new Date();
        for (const [sessionId, session] of this.activeSessions) {
            if (new Date(session.expires) < now) {
                await this.invalidateSession(sessionId);
            }
        }
        
        console.log('🧹 Session cleanup completed');
    }
}

module.exports = SecureDevicePairing;