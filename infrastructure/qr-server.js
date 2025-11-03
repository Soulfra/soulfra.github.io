const express = require('express');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class QRCheckInServer {
  constructor(config, vaultLogger) {
    this.config = config;
    this.vaultLogger = vaultLogger;
    this.app = express();
    this.locations = new Map();
    this.checkIns = new Map();
    this.qrCodes = new Map();
    
    this.initializeLocations();
    this.setupMiddleware();
    this.setupRoutes();
  }

  initializeLocations() {
    // Initialize predefined locations
    this.config.locations.forEach(location => {
      this.locations.set(location.id, {
        ...location,
        qrCode: null,
        checkInCount: 0,
        lastActivity: null
      });
    });
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Location management
    this.app.get('/api/locations', this.getLocations.bind(this));
    this.app.post('/api/locations', this.createLocation.bind(this));
    this.app.get('/api/locations/:id', this.getLocation.bind(this));
    this.app.put('/api/locations/:id', this.updateLocation.bind(this));

    // QR code generation
    this.app.post('/api/locations/:id/qr', this.generateQRCode.bind(this));
    this.app.get('/api/qr/:code', this.getQRInfo.bind(this));
    this.app.get('/api/qr/:code/image', this.getQRImage.bind(this));

    // Check-in functionality
    this.app.post('/api/checkin', this.checkIn.bind(this));
    this.app.get('/api/checkins', this.getCheckIns.bind(this));
    this.app.get('/api/checkins/user/:userId', this.getUserCheckIns.bind(this));
    this.app.get('/api/checkins/location/:locationId', this.getLocationCheckIns.bind(this));

    // Location verification
    this.app.post('/api/verify-location', this.verifyLocation.bind(this));
    
    // Analytics
    this.app.get('/api/analytics/checkins', this.getCheckInAnalytics.bind(this));
    this.app.get('/api/analytics/locations', this.getLocationAnalytics.bind(this));

    // Rewards
    this.app.get('/api/rewards/user/:userId', this.getUserRewards.bind(this));
    this.app.post('/api/rewards/redeem', this.redeemReward.bind(this));
  }

  async getLocations(req, res) {
    try {
      const locations = Array.from(this.locations.values());
      res.json({
        success: true,
        locations
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createLocation(req, res) {
    try {
      const locationData = {
        id: uuidv4(),
        name: req.body.name,
        description: req.body.description || '',
        lat: parseFloat(req.body.lat),
        lng: parseFloat(req.body.lng),
        radius: parseInt(req.body.radius) || this.config.checkInRadius,
        category: req.body.category || 'general',
        rewards: {
          points: parseInt(req.body.points) || this.config.rewardPoints,
          badges: req.body.badges || []
        },
        metadata: {
          created: new Date().toISOString(),
          creator: req.body.creator || 'system'
        },
        qrCode: null,
        checkInCount: 0,
        lastActivity: null
      };

      // Validate required fields
      if (!locationData.name || isNaN(locationData.lat) || isNaN(locationData.lng)) {
        return res.status(400).json({ 
          error: 'Name, latitude, and longitude are required' 
        });
      }

      this.locations.set(locationData.id, locationData);

      await this.vaultLogger.log('qr-checkin', 'location_created', {
        locationId: locationData.id,
        name: locationData.name
      });

      res.json({
        success: true,
        location: locationData
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLocation(req, res) {
    try {
      const location = this.locations.get(req.params.id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json({
        success: true,
        location
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateLocation(req, res) {
    try {
      const location = this.locations.get(req.params.id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const updatedLocation = {
        ...location,
        ...req.body,
        id: location.id, // Preserve ID
        metadata: {
          ...location.metadata,
          updated: new Date().toISOString()
        }
      };

      this.locations.set(location.id, updatedLocation);

      await this.vaultLogger.log('qr-checkin', 'location_updated', {
        locationId: location.id,
        changes: Object.keys(req.body)
      });

      res.json({
        success: true,
        location: updatedLocation
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async generateQRCode(req, res) {
    try {
      const location = this.locations.get(req.params.id);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const qrCode = this.createQRCode(location);
      location.qrCode = qrCode;
      
      // Store QR code data
      this.qrCodes.set(qrCode.code, {
        ...qrCode,
        locationId: location.id,
        scans: 0,
        lastScanned: null
      });

      await this.vaultLogger.log('qr-checkin', 'qr_generated', {
        locationId: location.id,
        qrCode: qrCode.code
      });

      res.json({
        success: true,
        qrCode
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getQRInfo(req, res) {
    try {
      const qrData = this.qrCodes.get(req.params.code);
      if (!qrData) {
        return res.status(404).json({ error: 'QR code not found' });
      }

      const location = this.locations.get(qrData.locationId);
      
      res.json({
        success: true,
        qrCode: qrData,
        location
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getQRImage(req, res) {
    try {
      const qrData = this.qrCodes.get(req.params.code);
      if (!qrData) {
        return res.status(404).json({ error: 'QR code not found' });
      }

      // Generate QR code image
      const qrImageBuffer = await QRCode.toBuffer(qrData.data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.set('Content-Type', 'image/png');
      res.send(qrImageBuffer);

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async checkIn(req, res) {
    try {
      const { qrCode, userId, location } = req.body;
      
      if (!qrCode || !userId) {
        return res.status(400).json({ 
          error: 'QR code and user ID are required' 
        });
      }

      // Verify QR code
      const qrData = this.qrCodes.get(qrCode);
      if (!qrData) {
        return res.status(400).json({ error: 'Invalid QR code' });
      }

      const locationData = this.locations.get(qrData.locationId);
      if (!locationData) {
        return res.status(400).json({ error: 'Location not found' });
      }

      // Verify location if provided
      if (location) {
        const distance = this.calculateDistance(
          location.lat, location.lng,
          locationData.lat, locationData.lng
        );

        if (distance > locationData.radius) {
          return res.status(400).json({ 
            error: 'You are too far from the check-in location',
            distance,
            maxDistance: locationData.radius
          });
        }
      }

      // Check for duplicate check-ins (within last hour)
      const recentCheckIn = this.findRecentCheckIn(userId, qrData.locationId);
      if (recentCheckIn) {
        return res.status(400).json({ 
          error: 'You have already checked in recently',
          lastCheckIn: recentCheckIn.timestamp
        });
      }

      // Create check-in record
      const checkIn = {
        id: uuidv4(),
        userId,
        locationId: qrData.locationId,
        qrCode,
        timestamp: new Date().toISOString(),
        location: location || null,
        rewards: {
          points: locationData.rewards.points,
          badges: [...locationData.rewards.badges]
        },
        metadata: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          distance: location ? this.calculateDistance(
            location.lat, location.lng,
            locationData.lat, locationData.lng
          ) : null
        }
      };

      // Store check-in
      this.checkIns.set(checkIn.id, checkIn);
      await this.vaultLogger.saveCheckIn(checkIn);

      // Update location stats
      locationData.checkInCount++;
      locationData.lastActivity = checkIn.timestamp;

      // Update QR code stats
      qrData.scans++;
      qrData.lastScanned = checkIn.timestamp;

      await this.vaultLogger.log('qr-checkin', 'user_checked_in', {
        checkInId: checkIn.id,
        userId,
        locationId: qrData.locationId,
        pointsEarned: checkIn.rewards.points
      });

      res.json({
        success: true,
        checkIn,
        message: `Welcome to ${locationData.name}! You earned ${checkIn.rewards.points} points.`
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCheckIns(req, res) {
    try {
      const { userId, locationId, limit = 50, offset = 0 } = req.query;
      let checkIns = Array.from(this.checkIns.values());

      // Apply filters
      if (userId) {
        checkIns = checkIns.filter(checkIn => checkIn.userId === userId);
      }

      if (locationId) {
        checkIns = checkIns.filter(checkIn => checkIn.locationId === locationId);
      }

      // Sort by timestamp (newest first)
      checkIns.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Pagination
      const total = checkIns.length;
      checkIns = checkIns.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

      res.json({
        success: true,
        checkIns,
        total,
        offset: parseInt(offset),
        limit: parseInt(limit)
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserCheckIns(req, res) {
    try {
      const userId = req.params.userId;
      const checkIns = Array.from(this.checkIns.values())
        .filter(checkIn => checkIn.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const stats = this.calculateUserStats(userId, checkIns);

      res.json({
        success: true,
        checkIns,
        stats
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLocationCheckIns(req, res) {
    try {
      const locationId = req.params.locationId;
      const checkIns = Array.from(this.checkIns.values())
        .filter(checkIn => checkIn.locationId === locationId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const stats = this.calculateLocationStats(locationId, checkIns);

      res.json({
        success: true,
        checkIns,
        stats
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async verifyLocation(req, res) {
    try {
      const { lat, lng, locationId } = req.body;
      
      if (!lat || !lng || !locationId) {
        return res.status(400).json({ 
          error: 'Latitude, longitude, and location ID are required' 
        });
      }

      const location = this.locations.get(locationId);
      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const distance = this.calculateDistance(lat, lng, location.lat, location.lng);
      const isWithinRange = distance <= location.radius;

      res.json({
        success: true,
        isWithinRange,
        distance,
        maxDistance: location.radius,
        location: location.name
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getCheckInAnalytics(req, res) {
    try {
      const { timeRange = '7d' } = req.query;
      const checkIns = Array.from(this.checkIns.values());
      
      const cutoffDate = this.getTimeRangeCutoff(timeRange);
      const filteredCheckIns = checkIns.filter(checkIn => 
        new Date(checkIn.timestamp) >= cutoffDate
      );

      const analytics = {
        totalCheckIns: filteredCheckIns.length,
        uniqueUsers: new Set(filteredCheckIns.map(c => c.userId)).size,
        uniqueLocations: new Set(filteredCheckIns.map(c => c.locationId)).size,
        totalPoints: filteredCheckIns.reduce((sum, c) => sum + c.rewards.points, 0),
        dailyBreakdown: this.calculateDailyBreakdown(filteredCheckIns, timeRange),
        topLocations: this.calculateTopLocations(filteredCheckIns),
        topUsers: this.calculateTopUsers(filteredCheckIns)
      };

      res.json({
        success: true,
        analytics,
        timeRange
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLocationAnalytics(req, res) {
    try {
      const locations = Array.from(this.locations.values());
      const analytics = locations.map(location => ({
        id: location.id,
        name: location.name,
        checkInCount: location.checkInCount,
        lastActivity: location.lastActivity,
        qrScans: this.qrCodes.get(location.qrCode?.code)?.scans || 0
      }));

      res.json({
        success: true,
        analytics
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserRewards(req, res) {
    try {
      const userId = req.params.userId;
      const userCheckIns = Array.from(this.checkIns.values())
        .filter(checkIn => checkIn.userId === userId);

      const rewards = {
        totalPoints: userCheckIns.reduce((sum, c) => sum + c.rewards.points, 0),
        totalCheckIns: userCheckIns.length,
        badges: this.calculateUserBadges(userCheckIns),
        recentCheckIns: userCheckIns
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
      };

      res.json({
        success: true,
        rewards
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async redeemReward(req, res) {
    try {
      const { userId, rewardType, pointsCost } = req.body;
      
      const userRewards = await this.getUserRewards({ params: { userId } });
      const userPoints = userRewards.rewards.totalPoints;

      if (userPoints < pointsCost) {
        return res.status(400).json({ 
          error: 'Insufficient points',
          userPoints,
          required: pointsCost
        });
      }

      // Create redemption record
      const redemption = {
        id: uuidv4(),
        userId,
        rewardType,
        pointsCost,
        timestamp: new Date().toISOString()
      };

      await this.vaultLogger.log('qr-checkin', 'reward_redeemed', redemption);

      res.json({
        success: true,
        redemption,
        remainingPoints: userPoints - pointsCost
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Utility methods
  createQRCode(location) {
    const code = this.generateQRCodeString();
    const data = JSON.stringify({
      type: 'checkin',
      locationId: location.id,
      code,
      timestamp: new Date().toISOString()
    });

    return {
      code,
      data,
      location: location.name,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
  }

  generateQRCodeString() {
    return `QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    // Haversine formula for calculating distance between two points
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  findRecentCheckIn(userId, locationId) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return Array.from(this.checkIns.values()).find(checkIn =>
      checkIn.userId === userId &&
      checkIn.locationId === locationId &&
      new Date(checkIn.timestamp) > oneHourAgo
    );
  }

  calculateUserStats(userId, checkIns) {
    const uniqueLocations = new Set(checkIns.map(c => c.locationId));
    const totalPoints = checkIns.reduce((sum, c) => sum + c.rewards.points, 0);
    
    return {
      totalCheckIns: checkIns.length,
      uniqueLocations: uniqueLocations.size,
      totalPoints,
      averagePointsPerCheckIn: checkIns.length > 0 ? totalPoints / checkIns.length : 0,
      firstCheckIn: checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp : null,
      lastCheckIn: checkIns.length > 0 ? checkIns[0].timestamp : null
    };
  }

  calculateLocationStats(locationId, checkIns) {
    const uniqueUsers = new Set(checkIns.map(c => c.userId));
    
    return {
      totalCheckIns: checkIns.length,
      uniqueUsers: uniqueUsers.size,
      firstCheckIn: checkIns.length > 0 ? checkIns[checkIns.length - 1].timestamp : null,
      lastCheckIn: checkIns.length > 0 ? checkIns[0].timestamp : null,
      averageDistance: this.calculateAverageDistance(checkIns)
    };
  }

  calculateAverageDistance(checkIns) {
    const withDistance = checkIns.filter(c => c.metadata.distance !== null);
    if (withDistance.length === 0) return 0;
    
    const totalDistance = withDistance.reduce((sum, c) => sum + c.metadata.distance, 0);
    return totalDistance / withDistance.length;
  }

  calculateUserBadges(checkIns) {
    const badges = [];
    
    if (checkIns.length >= 1) badges.push('First Check-in');
    if (checkIns.length >= 10) badges.push('Regular Visitor');
    if (checkIns.length >= 50) badges.push('Frequent Flyer');
    if (checkIns.length >= 100) badges.push('Location Master');
    
    const uniqueLocations = new Set(checkIns.map(c => c.locationId));
    if (uniqueLocations.size >= 5) badges.push('Explorer');
    if (uniqueLocations.size >= 10) badges.push('Travel Enthusiast');
    
    return badges;
  }

  getTimeRangeCutoff(timeRange) {
    const now = new Date();
    const ranges = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = ranges[timeRange] || 7;
    return new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
  }

  calculateDailyBreakdown(checkIns, timeRange) {
    const breakdown = {};
    const days = timeRange === '1d' ? 1 : 
                 timeRange === '7d' ? 7 : 
                 timeRange === '30d' ? 30 : 90;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      breakdown[dateKey] = 0;
    }

    checkIns.forEach(checkIn => {
      const dateKey = checkIn.timestamp.split('T')[0];
      if (breakdown.hasOwnProperty(dateKey)) {
        breakdown[dateKey]++;
      }
    });

    return breakdown;
  }

  calculateTopLocations(checkIns) {
    const locationCounts = {};
    
    checkIns.forEach(checkIn => {
      locationCounts[checkIn.locationId] = (locationCounts[checkIn.locationId] || 0) + 1;
    });

    return Object.entries(locationCounts)
      .map(([locationId, count]) => {
        const location = this.locations.get(locationId);
        return {
          locationId,
          name: location ? location.name : 'Unknown',
          checkIns: count
        };
      })
      .sort((a, b) => b.checkIns - a.checkIns)
      .slice(0, 10);
  }

  calculateTopUsers(checkIns) {
    const userCounts = {};
    
    checkIns.forEach(checkIn => {
      userCounts[checkIn.userId] = (userCounts[checkIn.userId] || 0) + 1;
    });

    return Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, checkIns: count }))
      .sort((a, b) => b.checkIns - a.checkIns)
      .slice(0, 10);
  }

  start(port) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`QR Check-in server running on port ${port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = QRCheckInServer;