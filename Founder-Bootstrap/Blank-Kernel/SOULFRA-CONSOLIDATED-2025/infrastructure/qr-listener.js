// QR Listener - Handles QR scanning and location check-ins with vault logging
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class QRListener {
    constructor() {
        this.checkinLogPath = path.join(__dirname, 'vault/checkins/checkin-log.json');
        this.vaultLogsPath = path.join(__dirname, 'vault-sync-core/logs');
        this.locationsPath = path.join(__dirname, 'vault/checkins/locations.json');
        
        this.knownLocations = new Map();
        this.activeListeners = new Set();
        this.rewardSystem = new QRRewardSystem();
        
        this.init();
    }

    async init() {
        console.log('📱 Initializing QR Listener...');
        
        await this.ensureDirectories();
        await this.loadCheckinLog();
        await this.loadKnownLocations();
        await this.setupDefaultLocations();
        
        console.log('✅ QR Listener ready');
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.checkinLogPath),
            path.dirname(this.locationsPath),
            this.vaultLogsPath
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async loadCheckinLog() {
        try {
            const logContent = await fs.readFile(this.checkinLogPath, 'utf8');
            this.checkinLog = JSON.parse(logContent);
        } catch {
            this.checkinLog = {
                checkins: [],
                totalCheckins: 0,
                uniqueUsers: new Set(),
                uniqueLocations: new Set(),
                created: new Date().toISOString()
            };
            await this.saveCheckinLog();
        }
    }

    async loadKnownLocations() {
        try {
            const locationsContent = await fs.readFile(this.locationsPath, 'utf8');
            const locations = JSON.parse(locationsContent);
            
            locations.forEach(location => {
                this.knownLocations.set(location.qrCode, location);
            });
        } catch {
            // Will setup default locations
        }
    }

    async setupDefaultLocations() {
        if (this.knownLocations.size === 0) {
            const defaultLocations = [
                {
                    qrCode: 'qr-downtown-coffee-001',
                    name: 'Downtown Coffee Shop',
                    type: 'cafe',
                    coordinates: { lat: 37.7749, lng: -122.4194 },
                    address: '123 Main St, Downtown',
                    geofence: { radius: 50 }, // meters
                    rewards: { points: 10, badges: ['coffee-lover'] },
                    description: 'Cozy coffee shop with great atmosphere',
                    created: new Date().toISOString()
                },
                {
                    qrCode: 'qr-tech-hub-cowork-002',
                    name: 'Tech Hub Coworking',
                    type: 'coworking',
                    coordinates: { lat: 37.7849, lng: -122.4094 },
                    address: '456 Innovation Ave, Tech District',
                    geofence: { radius: 100 },
                    rewards: { points: 15, badges: ['tech-explorer'] },
                    description: 'Modern coworking space for tech professionals',
                    created: new Date().toISOString()
                }
            ];

            defaultLocations.forEach(location => {
                this.knownLocations.set(location.qrCode, location);
            });

            await this.saveKnownLocations();
        }
    }

    async saveCheckinLog() {
        // Convert Sets to Arrays for JSON serialization
        const logToSave = {
            ...this.checkinLog,
            uniqueUsers: Array.from(this.checkinLog.uniqueUsers),
            uniqueLocations: Array.from(this.checkinLog.uniqueLocations)
        };
        
        await fs.writeFile(this.checkinLogPath, JSON.stringify(logToSave, null, 2));
    }

    async saveKnownLocations() {
        const locationsArray = Array.from(this.knownLocations.values());
        await fs.writeFile(this.locationsPath, JSON.stringify(locationsArray, null, 2));
    }

    async processQRScan(qrCode, userLocation = null, userId = 'anonymous') {
        console.log(`📱 Processing QR scan: ${qrCode}`);
        
        const checkinId = `checkin-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        try {
            // Validate QR code
            const location = this.knownLocations.get(qrCode);
            if (!location) {
                return await this.handleUnknownQR(qrCode, checkinId, userId);
            }
            
            // Verify geolocation if provided
            const locationValid = userLocation ? 
                this.verifyGeofence(userLocation, location) : true;
            
            if (!locationValid) {
                return await this.handleGeofenceViolation(qrCode, location, userLocation, checkinId, userId);
            }
            
            // Process valid check-in
            const checkin = await this.createCheckin(checkinId, qrCode, location, userLocation, userId);
            
            // Generate reward
            const reward = await this.rewardSystem.generateReward(checkin, this.getUserHistory(userId));
            
            // Generate Cal prompt
            const calPrompt = await this.generateCalPrompt(checkin, location);
            
            // Update logs
            await this.updateCheckinLog(checkin);
            await this.logToVault('qr', 'checkin_successful', {
                checkinId: checkinId,
                qrCode: qrCode,
                location: location.name,
                userId: userId,
                reward: reward
            });
            
            console.log(`✅ Check-in successful: ${checkinId}`);
            
            return {
                success: true,
                checkinId: checkinId,
                location: location,
                reward: reward,
                calPrompt: calPrompt,
                timestamp: checkin.timestamp
            };
            
        } catch (error) {
            console.error('❌ QR processing error:', error);
            
            await this.logToVault('qr', 'checkin_error', {
                checkinId: checkinId,
                qrCode: qrCode,
                userId: userId,
                error: error.message
            });
            
            return {
                success: false,
                error: error.message,
                checkinId: checkinId
            };
        }
    }

    async createCheckin(checkinId, qrCode, location, userLocation, userId) {
        return {
            id: checkinId,
            qrCode: qrCode,
            location: {
                name: location.name,
                type: location.type,
                coordinates: location.coordinates
            },
            userLocation: userLocation,
            userId: userId,
            timestamp: new Date().toISOString(),
            verified: true,
            accuracy: userLocation ? this.calculateAccuracy(userLocation, location) : null
        };
    }

    verifyGeofence(userLocation, location) {
        if (!userLocation || !location.coordinates || !location.geofence) {
            return true; // Skip verification if data is missing
        }
        
        const distance = this.calculateDistance(
            userLocation.lat, userLocation.lng,
            location.coordinates.lat, location.coordinates.lng
        );
        
        return distance <= location.geofence.radius;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        // Haversine formula for distance calculation
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
    }

    calculateAccuracy(userLocation, targetLocation) {
        const distance = this.calculateDistance(
            userLocation.lat, userLocation.lng,
            targetLocation.coordinates.lat, targetLocation.coordinates.lng
        );
        
        // Return accuracy as percentage (closer = higher accuracy)
        const maxDistance = targetLocation.geofence?.radius || 100;
        return Math.max(0, (maxDistance - distance) / maxDistance * 100);
    }

    async handleUnknownQR(qrCode, checkinId, userId) {
        console.log(`⚠️ Unknown QR code: ${qrCode}`);
        
        await this.logToVault('qr', 'unknown_qr_scanned', {
            checkinId: checkinId,
            qrCode: qrCode,
            userId: userId
        });
        
        return {
            success: false,
            error: 'Unknown QR code',
            suggestion: 'This QR code is not recognized. Please check with the location owner.',
            supportInfo: {
                qrCode: qrCode,
                timestamp: new Date().toISOString()
            }
        };
    }

    async handleGeofenceViolation(qrCode, location, userLocation, checkinId, userId) {
        const distance = this.calculateDistance(
            userLocation.lat, userLocation.lng,
            location.coordinates.lat, location.coordinates.lng
        );
        
        console.log(`⚠️ Geofence violation: ${distance}m from ${location.name}`);
        
        await this.logToVault('qr', 'geofence_violation', {
            checkinId: checkinId,
            qrCode: qrCode,
            location: location.name,
            distance: distance,
            allowedRadius: location.geofence.radius,
            userId: userId
        });
        
        return {
            success: false,
            error: 'Location verification failed',
            details: {
                distance: Math.round(distance),
                allowedRadius: location.geofence.radius,
                locationName: location.name
            },
            suggestion: `You need to be within ${location.geofence.radius}m of ${location.name} to check in.`
        };
    }

    async generateCalPrompt(checkin, location) {
        const prompts = [
            `Cal remembers you visited ${location.name} - want to share your experience?`,
            `How was your time at ${location.name}? I'd love to hear your thoughts.`,
            `You're at ${location.name}! What's the vibe like today?`,
            `Cal sees you've checked into ${location.name}. Care to leave a review?`,
            `${location.name} seems interesting! What drew you here today?`
        ];
        
        // Personalize based on visit history
        const userHistory = this.getUserHistory(checkin.userId);
        const previousVisits = userHistory.filter(h => h.location.name === location.name);
        
        if (previousVisits.length > 0) {
            const returnPrompts = [
                `Welcome back to ${location.name}! How does it compare to your last visit?`,
                `Another visit to ${location.name}! What keeps bringing you back?`,
                `Cal remembers you liked ${location.name}. Still feeling the same way?`
            ];
            return returnPrompts[Math.floor(Math.random() * returnPrompts.length)];
        }
        
        return prompts[Math.floor(Math.random() * prompts.length)];
    }

    getUserHistory(userId) {
        return this.checkinLog.checkins.filter(c => c.userId === userId);
    }

    async updateCheckinLog(checkin) {
        this.checkinLog.checkins.push(checkin);
        this.checkinLog.totalCheckins++;
        this.checkinLog.uniqueUsers.add(checkin.userId);
        this.checkinLog.uniqueLocations.add(checkin.location.name);
        
        // Keep only last 10000 check-ins
        if (this.checkinLog.checkins.length > 10000) {
            this.checkinLog.checkins = this.checkinLog.checkins.slice(-10000);
        }
        
        await this.saveCheckinLog();
    }

    async getLocationStats(locationName) {
        const locationCheckins = this.checkinLog.checkins.filter(
            c => c.location.name === locationName
        );
        
        if (locationCheckins.length === 0) {
            return null;
        }
        
        const uniqueUsers = new Set(locationCheckins.map(c => c.userId)).size;
        const averageAccuracy = locationCheckins
            .filter(c => c.accuracy !== null)
            .reduce((sum, c) => sum + c.accuracy, 0) / locationCheckins.length || 0;
        
        return {
            locationName: locationName,
            totalCheckins: locationCheckins.length,
            uniqueUsers: uniqueUsers,
            averageAccuracy: Math.round(averageAccuracy),
            firstCheckin: locationCheckins[0].timestamp,
            lastCheckin: locationCheckins[locationCheckins.length - 1].timestamp
        };
    }

    async getRecentCheckins(limit = 20) {
        return this.checkinLog.checkins.slice(-limit).reverse();
    }

    async getUserCheckins(userId, limit = 50) {
        return this.checkinLog.checkins
            .filter(c => c.userId === userId)
            .slice(-limit)
            .reverse();
    }

    async addLocation(locationData) {
        const qrCode = locationData.qrCode || `qr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        const location = {
            qrCode: qrCode,
            name: locationData.name,
            type: locationData.type || 'general',
            coordinates: locationData.coordinates,
            address: locationData.address || '',
            geofence: locationData.geofence || { radius: 50 },
            rewards: locationData.rewards || { points: 10, badges: [] },
            description: locationData.description || '',
            created: new Date().toISOString()
        };
        
        this.knownLocations.set(qrCode, location);
        await this.saveKnownLocations();
        
        await this.logToVault('qr', 'location_added', {
            qrCode: qrCode,
            locationName: location.name,
            type: location.type
        });
        
        return location;
    }

    async generateQRCode(locationName) {
        const location = Array.from(this.knownLocations.values())
            .find(loc => loc.name === locationName);
        
        if (!location) {
            throw new Error(`Location ${locationName} not found`);
        }
        
        // In production, this would generate an actual QR code image
        // For now, return QR code data
        return {
            qrCode: location.qrCode,
            location: location,
            qrData: {
                text: location.qrCode,
                url: `https://mirroros.app/checkin?qr=${location.qrCode}`,
                format: 'svg',
                size: 256
            }
        };
    }

    async logToVault(module, action, data) {
        const logPath = path.join(this.vaultLogsPath, 'qr-activity.log');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            module: module,
            action: action,
            data: data
        };

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    }

    async getStats() {
        const locationStats = {};
        
        for (const [qrCode, location] of this.knownLocations.entries()) {
            const stats = await this.getLocationStats(location.name);
            if (stats) {
                locationStats[location.name] = stats;
            }
        }
        
        return {
            totalCheckins: this.checkinLog.totalCheckins,
            uniqueUsers: this.checkinLog.uniqueUsers.size || Array.from(this.checkinLog.uniqueUsers).length,
            uniqueLocations: this.checkinLog.uniqueLocations.size || Array.from(this.checkinLog.uniqueLocations).length,
            knownLocations: this.knownLocations.size,
            locationStats: locationStats,
            recentCheckins: (await this.getRecentCheckins(5)).length
        };
    }
}

// QR Reward System
class QRRewardSystem {
    constructor() {
        this.pointValues = {
            first_visit: 20,
            return_visit: 10,
            streak_bonus: 5,
            review_bonus: 15,
            social_bonus: 10
        };
        
        this.badges = {
            'first-timer': { name: 'First Timer', description: 'First check-in anywhere' },
            'explorer': { name: 'Explorer', description: '5 different locations' },
            'regular': { name: 'Regular', description: '10 visits to the same place' },
            'reviewer': { name: 'Reviewer', description: 'Left 10 reviews' },
            'social': { name: 'Social', description: 'Shared 5 check-ins' }
        };
    }

    async generateReward(checkin, userHistory) {
        let points = 0;
        const badges = [];
        const achievements = [];
        
        // Base points for check-in
        const previousVisitsToLocation = userHistory.filter(
            h => h.location.name === checkin.location.name
        ).length;
        
        if (previousVisitsToLocation === 0) {
            points += this.pointValues.first_visit;
            achievements.push('First visit to ' + checkin.location.name);
        } else {
            points += this.pointValues.return_visit;
        }
        
        // Streak bonus
        const recentCheckins = userHistory.slice(-7); // Last 7 days
        if (recentCheckins.length >= 3) {
            points += this.pointValues.streak_bonus;
            achievements.push('Check-in streak bonus');
        }
        
        // Badge calculations
        if (userHistory.length === 0) {
            badges.push('first-timer');
        }
        
        const uniqueLocations = new Set(userHistory.map(h => h.location.name)).size;
        if (uniqueLocations >= 5 && !this.hasBadge(userHistory, 'explorer')) {
            badges.push('explorer');
        }
        
        if (previousVisitsToLocation >= 10 && !this.hasBadge(userHistory, 'regular')) {
            badges.push('regular');
        }
        
        return {
            points: points,
            badges: badges,
            achievements: achievements,
            totalPoints: this.calculateTotalPoints(userHistory) + points,
            level: this.calculateLevel(userHistory.length + 1)
        };
    }

    hasBadge(userHistory, badgeId) {
        // In a real implementation, this would check user's badge collection
        return false;
    }

    calculateTotalPoints(userHistory) {
        // Simplified calculation
        return userHistory.length * 10;
    }

    calculateLevel(totalCheckins) {
        if (totalCheckins < 5) return 1;
        if (totalCheckins < 15) return 2;
        if (totalCheckins < 30) return 3;
        if (totalCheckins < 50) return 4;
        return 5;
    }
}

module.exports = QRListener;

// Example usage
if (require.main === module) {
    const qrListener = new QRListener();
    
    setTimeout(async () => {
        console.log('\n🧪 Testing QR Listener...');
        
        // Test QR scan
        const result = await qrListener.processQRScan(
            'qr-downtown-coffee-001',
            { lat: 37.7749, lng: -122.4194 },
            'test-user'
        );
        
        console.log('\n📱 QR Scan Result:', result);
        
        const stats = await qrListener.getStats();
        console.log('\n📊 QR Stats:', stats);
    }, 1000);
}