// ============================================================================
// GEOFENCED VIBES API - REAL-TIME GLOBAL ACTIVITY TRACKING
// Show VIBES earning activity across locations, like Google Maps traffic
// ============================================================================

import express from 'express';
import WebSocket from 'ws';
import { createClient } from '@supabase/supabase-js';
import geoip from 'geoip-lite';

// ============================================================================
// 1. GEOFENCED ACTIVITY TRACKER
// ============================================================================

class GeofencedVibesTracker {
  constructor(config = {}) {
    this.config = {
      supabase: createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      ),
      redis: null, // Optional Redis for caching
      updateInterval: 5000, // 5 seconds
      heatmapResolution: 0.01, // ~1km resolution
      maxHotspots: 1000,
      ...config
    };

    this.activeConnections = new Map();
    this.currentActivity = new Map(); // locationKey -> activity data
    this.geofences = new Map(); // Custom geofenced areas
    this.setupGeofences();
    this.startRealTimeTracking();
  }

  setupGeofences() {
    // Pre-defined interesting areas for VIBES tracking
    const defaultGeofences = [
      // Tech Hubs
      { id: 'silicon_valley', name: 'Silicon Valley', lat: 37.4419, lng: -122.1430, radius: 20000, type: 'tech' },
      { id: 'seattle_tech', name: 'Seattle Tech', lat: 47.6062, lng: -122.3321, radius: 15000, type: 'tech' },
      { id: 'london_tech', name: 'London Tech City', lat: 51.5074, lng: -0.0901, radius: 10000, type: 'tech' },
      
      // Universities
      { id: 'mit', name: 'MIT', lat: 42.3601, lng: -71.0942, radius: 2000, type: 'education' },
      { id: 'stanford', name: 'Stanford', lat: 37.4275, lng: -122.1697, radius: 3000, type: 'education' },
      { id: 'oxford', name: 'Oxford', lat: 51.7520, lng: -1.2577, radius: 2000, type: 'education' },
      
      // Business Districts
      { id: 'wall_street', name: 'Wall Street', lat: 40.7074, lng: -74.0113, radius: 1000, type: 'finance' },
      { id: 'city_london', name: 'City of London', lat: 51.5138, lng: -0.0984, radius: 2000, type: 'finance' },
      { id: 'tokyo_business', name: 'Tokyo Business', lat: 35.6762, lng: 139.6503, radius: 5000, type: 'business' },
      
      // Creative Districts
      { id: 'soho_nyc', name: 'SoHo NYC', lat: 40.7231, lng: -74.0026, radius: 1500, type: 'creative' },
      { id: 'shoreditch', name: 'Shoreditch', lat: 51.5252, lng: -0.0811, radius: 2000, type: 'creative' },
      { id: 'shibuya', name: 'Shibuya', lat: 35.6598, lng: 139.7006, radius: 1000, type: 'creative' }
    ];

    defaultGeofences.forEach(fence => {
      this.geofences.set(fence.id, fence);
    });
  }

  // ========================================================================
  // REAL-TIME ACTIVITY TRACKING
  // ========================================================================

  async trackVibesActivity(userFingerprint, vibesAmount, activityType, metadata = {}) {
    try {
      // Get user location (from IP or explicit location sharing)
      const location = await this.getUserLocation(userFingerprint, metadata);
      
      if (!location) return; // No location data available

      const activity = {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userFingerprint: this.anonymizeFingerprint(userFingerprint),
        location,
        vibesAmount,
        activityType, // 'earn', 'spend', 'stake', 'create', 'help'
        timestamp: new Date().toISOString(),
        metadata: {
          userTier: metadata.userTier || 'simple',
          source: metadata.source || 'unknown',
          quality: metadata.quality || 50
        }
      };

      // Store in database
      await this.storeActivity(activity);
      
      // Update real-time maps
      await this.updateHeatmaps(activity);
      
      // Check geofences
      await this.checkGeofences(activity);
      
      // Broadcast to connected clients
      this.broadcastActivity(activity);
      
      return activity;

    } catch (error) {
      console.error('Error tracking VIBES activity:', error);
    }
  }

  async getUserLocation(userFingerprint, metadata = {}) {
    // Method 1: Explicit location sharing (most accurate)
    if (metadata.lat && metadata.lng) {
      return {
        lat: parseFloat(metadata.lat),
        lng: parseFloat(metadata.lng),
        accuracy: metadata.accuracy || 100,
        source: 'gps'
      };
    }

    // Method 2: IP-based geolocation (less accurate but automatic)
    if (metadata.ip) {
      const geo = geoip.lookup(metadata.ip);
      if (geo) {
        return {
          lat: geo.ll[0],
          lng: geo.ll[1],
          accuracy: 10000, // ~10km accuracy for IP
          source: 'ip',
          city: geo.city,
          country: geo.country
        };
      }
    }

    // Method 3: Stored user location preferences
    const storedLocation = await this.getStoredUserLocation(userFingerprint);
    if (storedLocation) {
      return storedLocation;
    }

    return null;
  }

  async getStoredUserLocation(userFingerprint) {
    try {
      const { data } = await this.config.supabase
        .from('user_locations')
        .select('lat, lng, accuracy, city, country')
        .eq('user_fingerprint', userFingerprint)
        .single();
      
      return data ? { ...data, source: 'stored' } : null;
    } catch (error) {
      return null;
    }
  }

  anonymizeFingerprint(fingerprint) {
    // Create anonymous hash for privacy while maintaining consistency
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(fingerprint + process.env.VIBES_SALT)
      .digest('hex')
      .substr(0, 16);
  }

  // ========================================================================
  // ACTIVITY STORAGE & RETRIEVAL
  // ========================================================================

  async storeActivity(activity) {
    // Store in Supabase for persistence and analysis
    await this.config.supabase
      .from('vibes_geo_activity')
      .insert({
        activity_id: activity.id,
        user_hash: activity.userFingerprint,
        lat: activity.location.lat,
        lng: activity.location.lng,
        location_accuracy: activity.location.accuracy,
        location_source: activity.location.source,
        vibes_amount: activity.vibesAmount,
        activity_type: activity.activityType,
        user_tier: activity.metadata.userTier,
        source: activity.metadata.source,
        quality: activity.metadata.quality,
        city: activity.location.city,
        country: activity.location.country,
        timestamp: activity.timestamp
      });
  }

  async getActivityInBounds(bounds, timeRange = '1h') {
    const timeThreshold = new Date(Date.now() - this.parseTimeRange(timeRange));
    
    const { data } = await this.config.supabase
      .from('vibes_geo_activity')
      .select('*')
      .gte('lat', bounds.south)
      .lte('lat', bounds.north)
      .gte('lng', bounds.west)
      .lte('lng', bounds.east)
      .gte('timestamp', timeThreshold.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);

    return data || [];
  }

  async getHotspots(timeRange = '1h', limit = 50) {
    const timeThreshold = new Date(Date.now() - this.parseTimeRange(timeRange));
    
    // Aggregate activity by location clusters
    const { data } = await this.config.supabase
      .from('vibes_geo_activity')
      .select(`
        lat, lng, city, country,
        vibes_amount,
        activity_type,
        count(*) as activity_count
      `)
      .gte('timestamp', timeThreshold.toISOString())
      .group('lat, lng, city, country, vibes_amount, activity_type')
      .order('activity_count', { ascending: false })
      .limit(limit);

    // Process into hotspot format
    const hotspots = new Map();
    
    data?.forEach(row => {
      const key = `${Math.round(row.lat * 100)}_${Math.round(row.lng * 100)}`;
      
      if (!hotspots.has(key)) {
        hotspots.set(key, {
          lat: row.lat,
          lng: row.lng,
          city: row.city,
          country: row.country,
          totalActivity: 0,
          totalVibes: 0,
          activityTypes: new Map()
        });
      }
      
      const hotspot = hotspots.get(key);
      hotspot.totalActivity += row.activity_count;
      hotspot.totalVibes += row.vibes_amount * row.activity_count;
      
      if (!hotspot.activityTypes.has(row.activity_type)) {
        hotspot.activityTypes.set(row.activity_type, 0);
      }
      hotspot.activityTypes.set(
        row.activity_type, 
        hotspot.activityTypes.get(row.activity_type) + row.activity_count
      );
    });

    return Array.from(hotspots.values())
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, limit);
  }

  parseTimeRange(timeRange) {
    const units = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    const match = timeRange.match(/^(\d+)([smhd])$/);
    if (match) {
      return parseInt(match[1]) * units[match[2]];
    }
    
    return 60 * 60 * 1000; // Default to 1 hour
  }

  // ========================================================================
  // HEATMAP GENERATION
  // ========================================================================

  async updateHeatmaps(activity) {
    const gridKey = this.getHeatmapGridKey(
      activity.location.lat, 
      activity.location.lng
    );
    
    // Update in-memory heatmap
    if (!this.currentActivity.has(gridKey)) {
      this.currentActivity.set(gridKey, {
        lat: this.roundToGrid(activity.location.lat),
        lng: this.roundToGrid(activity.location.lng),
        vibesPerHour: 0,
        activityCount: 0,
        lastUpdate: Date.now(),
        activityTypes: new Map()
      });
    }
    
    const cell = this.currentActivity.get(gridKey);
    cell.vibesPerHour += activity.vibesAmount;
    cell.activityCount += 1;
    cell.lastUpdate = Date.now();
    
    if (!cell.activityTypes.has(activity.activityType)) {
      cell.activityTypes.set(activity.activityType, 0);
    }
    cell.activityTypes.set(
      activity.activityType,
      cell.activityTypes.get(activity.activityType) + 1
    );
    
    // Clean up old data (older than 1 hour)
    this.cleanupOldHeatmapData();
  }

  getHeatmapGridKey(lat, lng) {
    const gridLat = this.roundToGrid(lat);
    const gridLng = this.roundToGrid(lng);
    return `${gridLat}_${gridLng}`;
  }

  roundToGrid(coordinate) {
    return Math.round(coordinate / this.config.heatmapResolution) * this.config.heatmapResolution;
  }

  cleanupOldHeatmapData() {
    const cutoff = Date.now() - (60 * 60 * 1000); // 1 hour
    
    for (const [key, cell] of this.currentActivity.entries()) {
      if (cell.lastUpdate < cutoff) {
        this.currentActivity.delete(key);
      }
    }
  }

  getHeatmapData(bounds) {
    const cells = [];
    
    for (const [key, cell] of this.currentActivity.entries()) {
      if (cell.lat >= bounds.south && cell.lat <= bounds.north &&
          cell.lng >= bounds.west && cell.lng <= bounds.east) {
        
        cells.push({
          lat: cell.lat,
          lng: cell.lng,
          intensity: Math.min(100, cell.vibesPerHour / 10), // Scale intensity
          vibesPerHour: cell.vibesPerHour,
          activityCount: cell.activityCount,
          dominantType: this.getDominantActivityType(cell.activityTypes)
        });
      }
    }
    
    return cells;
  }

  getDominantActivityType(activityTypes) {
    let maxCount = 0;
    let dominantType = 'unknown';
    
    for (const [type, count] of activityTypes.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }
    
    return dominantType;
  }

  // ========================================================================
  // GEOFENCE MONITORING
  // ========================================================================

  async checkGeofences(activity) {
    for (const [fenceId, fence] of this.geofences.entries()) {
      const distance = this.calculateDistance(
        activity.location.lat,
        activity.location.lng,
        fence.lat,
        fence.lng
      );
      
      if (distance <= fence.radius) {
        await this.handleGeofenceEntry(activity, fence);
      }
    }
  }

  async handleGeofenceEntry(activity, geofence) {
    // Log geofence activity
    await this.config.supabase
      .from('vibes_geofence_activity')
      .insert({
        geofence_id: geofence.id,
        geofence_name: geofence.name,
        geofence_type: geofence.type,
        activity_id: activity.id,
        user_hash: activity.userFingerprint,
        vibes_amount: activity.vibesAmount,
        activity_type: activity.activityType,
        timestamp: activity.timestamp
      });

    // Broadcast special geofence event
    this.broadcastGeofenceActivity(activity, geofence);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // ========================================================================
  // WEBSOCKET REAL-TIME BROADCASTING
  // ========================================================================

  setupWebSocketServer(server) {
    this.wss = new WebSocket.Server({ server });
    
    this.wss.on('connection', (ws, req) => {
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.activeConnections.set(connectionId, {
        ws,
        filters: {},
        lastPing: Date.now()
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(connectionId, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.activeConnections.delete(connectionId);
      });

      // Send initial data
      this.sendInitialData(connectionId);
    });
  }

  handleWebSocketMessage(connectionId, message) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'subscribe_bounds':
        connection.filters.bounds = message.bounds;
        break;
        
      case 'subscribe_geofence':
        connection.filters.geofenceId = message.geofenceId;
        break;
        
      case 'set_update_interval':
        connection.filters.updateInterval = Math.max(1000, message.interval);
        break;
        
      case 'ping':
        connection.lastPing = Date.now();
        connection.ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  async sendInitialData(connectionId) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    try {
      // Send current hotspots
      const hotspots = await this.getHotspots('1h', 20);
      
      connection.ws.send(JSON.stringify({
        type: 'initial_data',
        hotspots,
        geofences: Array.from(this.geofences.values()),
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  }

  broadcastActivity(activity) {
    const message = JSON.stringify({
      type: 'activity_update',
      activity: {
        lat: activity.location.lat,
        lng: activity.location.lng,
        vibesAmount: activity.vibesAmount,
        activityType: activity.activityType,
        userTier: activity.metadata.userTier,
        timestamp: activity.timestamp
      }
    });

    this.activeConnections.forEach((connection, connectionId) => {
      if (this.shouldSendToConnection(connection, activity)) {
        try {
          connection.ws.send(message);
        } catch (error) {
          console.error(`Error sending to connection ${connectionId}:`, error);
          this.activeConnections.delete(connectionId);
        }
      }
    });
  }

  broadcastGeofenceActivity(activity, geofence) {
    const message = JSON.stringify({
      type: 'geofence_activity',
      geofence: {
        id: geofence.id,
        name: geofence.name,
        type: geofence.type
      },
      activity: {
        vibesAmount: activity.vibesAmount,
        activityType: activity.activityType,
        timestamp: activity.timestamp
      }
    });

    this.activeConnections.forEach((connection, connectionId) => {
      try {
        connection.ws.send(message);
      } catch (error) {
        this.activeConnections.delete(connectionId);
      }
    });
  }

  shouldSendToConnection(connection, activity) {
    // Check if activity is within subscribed bounds
    if (connection.filters.bounds) {
      const bounds = connection.filters.bounds;
      if (activity.location.lat < bounds.south || 
          activity.location.lat > bounds.north ||
          activity.location.lng < bounds.west || 
          activity.location.lng > bounds.east) {
        return false;
      }
    }

    return true;
  }

  startRealTimeTracking() {
    // Send periodic updates to all connected clients
    setInterval(() => {
      this.broadcastPeriodicUpdates();
    }, this.config.updateInterval);

    // Clean up inactive connections
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 30000); // Every 30 seconds
  }

  async broadcastPeriodicUpdates() {
    if (this.activeConnections.size === 0) return;

    try {
      const hotspots = await this.getHotspots('5m', 10); // Last 5 minutes
      
      const message = JSON.stringify({
        type: 'periodic_update',
        hotspots,
        totalConnections: this.activeConnections.size,
        timestamp: new Date().toISOString()
      });

      this.activeConnections.forEach((connection, connectionId) => {
        try {
          connection.ws.send(message);
        } catch (error) {
          this.activeConnections.delete(connectionId);
        }
      });
    } catch (error) {
      console.error('Error in periodic updates:', error);
    }
  }

  cleanupInactiveConnections() {
    const cutoff = Date.now() - (60 * 1000); // 1 minute
    
    this.activeConnections.forEach((connection, connectionId) => {
      if (connection.lastPing < cutoff) {
        try {
          connection.ws.close();
        } catch (error) {
          // Connection already closed
        }
        this.activeConnections.delete(connectionId);
      }
    });
  }

  // ========================================================================
  // EXPRESS API ENDPOINTS
  // ========================================================================

  createExpressRoutes(app) {
    // Get activity within map bounds
    app.get('/api/geo/activity', async (req, res) => {
      try {
        const { north, south, east, west, timeRange = '1h' } = req.query;
        
        if (!north || !south || !east || !west) {
          return res.status(400).json({ 
            error: 'Missing required bounds parameters' 
          });
        }

        const bounds = {
          north: parseFloat(north),
          south: parseFloat(south),
          east: parseFloat(east),
          west: parseFloat(west)
        };

        const activities = await this.getActivityInBounds(bounds, timeRange);
        
        res.json({
          success: true,
          activities,
          bounds,
          timeRange,
          count: activities.length
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Get current hotspots
    app.get('/api/geo/hotspots', async (req, res) => {
      try {
        const { timeRange = '1h', limit = 50 } = req.query;
        
        const hotspots = await this.getHotspots(timeRange, parseInt(limit));
        
        res.json({
          success: true,
          hotspots,
          timeRange,
          count: hotspots.length
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Get heatmap data
    app.get('/api/geo/heatmap', async (req, res) => {
      try {
        const { north, south, east, west } = req.query;
        
        if (!north || !south || !east || !west) {
          return res.status(400).json({ 
            error: 'Missing required bounds parameters' 
          });
        }

        const bounds = {
          north: parseFloat(north),
          south: parseFloat(south),
          east: parseFloat(east),
          west: parseFloat(west)
        };

        const heatmapData = this.getHeatmapData(bounds);
        
        res.json({
          success: true,
          heatmap: heatmapData,
          bounds,
          resolution: this.config.heatmapResolution
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Get geofence activity
    app.get('/api/geo/geofences', async (req, res) => {
      try {
        const { timeRange = '1h' } = req.query;
        const timeThreshold = new Date(Date.now() - this.parseTimeRange(timeRange));
        
        const { data } = await this.config.supabase
          .from('vibes_geofence_activity')
          .select(`
            geofence_id,
            geofence_name,
            geofence_type,
            count(*) as activity_count,
            sum(vibes_amount) as total_vibes
          `)
          .gte('timestamp', timeThreshold.toISOString())
          .group('geofence_id, geofence_name, geofence_type')
          .order('activity_count', { ascending: false });

        res.json({
          success: true,
          geofenceActivity: data || [],
          geofences: Array.from(this.geofences.values()),
          timeRange
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Track new activity (integration endpoint)
    app.post('/api/geo/track', async (req, res) => {
      try {
        const { 
          userFingerprint, 
          vibesAmount, 
          activityType, 
          lat, 
          lng, 
          accuracy,
          userTier,
          source 
        } = req.body;

        if (!userFingerprint || !vibesAmount || !activityType) {
          return res.status(400).json({ 
            error: 'Missing required fields' 
          });
        }

        const metadata = {
          lat,
          lng,
          accuracy,
          userTier,
          source,
          ip: req.ip || req.connection.remoteAddress
        };

        const activity = await this.trackVibesActivity(
          userFingerprint,
          vibesAmount,
          activityType,
          metadata
        );

        res.json({
          success: true,
          activity: activity ? {
            id: activity.id,
            location: activity.location,
            timestamp: activity.timestamp
          } : null
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Global statistics
    app.get('/api/geo/stats', async (req, res) => {
      try {
        const { timeRange = '24h' } = req.query;
        const timeThreshold = new Date(Date.now() - this.parseTimeRange(timeRange));

        const [activityStats, countryStats, typeStats] = await Promise.all([
          this.config.supabase
            .from('vibes_geo_activity')
            .select('vibes_amount, activity_type')
            .gte('timestamp', timeThreshold.toISOString()),
          
          this.config.supabase
            .from('vibes_geo_activity')
            .select('country, count(*)')
            .gte('timestamp', timeThreshold.toISOString())
            .group('country')
            .order('count', { ascending: false })
            .limit(20),
          
          this.config.supabase
            .from('vibes_geo_activity')
            .select('activity_type, count(*), sum(vibes_amount)')
            .gte('timestamp', timeThreshold.toISOString())
            .group('activity_type')
            .order('count', { ascending: false })
        ]);

        const totalVibes = activityStats.data?.reduce((sum, row) => sum + row.vibes_amount, 0) || 0;
        const totalActivities = activityStats.data?.length || 0;

        res.json({
          success: true,
          timeRange,
          stats: {
            totalVibes,
            totalActivities,
            activeCountries: countryStats.data?.length || 0,
            topCountries: countryStats.data || [],
            activityBreakdown: typeStats.data || [],
            averageVibesPerActivity: totalActivities > 0 ? totalVibes / totalActivities : 0
          }
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
  }
}

// ============================================================================
// DATABASE SCHEMA SETUP
// ============================================================================

const setupGeofencedTables = async (supabase) => {
  // This would typically be run as a migration
  const schema = `
    -- VIBES geolocation activity table
    CREATE TABLE IF NOT EXISTS vibes_geo_activity (
      id SERIAL PRIMARY KEY,
      activity_id TEXT UNIQUE NOT NULL,
      user_hash TEXT NOT NULL,
      lat DECIMAL(10, 8) NOT NULL,
      lng DECIMAL(11, 8) NOT NULL,
      location_accuracy INTEGER,
      location_source TEXT,
      vibes_amount INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      user_tier TEXT,
      source TEXT,
      quality INTEGER,
      city TEXT,
      country TEXT,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Geofence activity tracking
    CREATE TABLE IF NOT EXISTS vibes_geofence_activity (
      id SERIAL PRIMARY KEY,
      geofence_id TEXT NOT NULL,
      geofence_name TEXT NOT NULL,
      geofence_type TEXT NOT NULL,
      activity_id TEXT NOT NULL,
      user_hash TEXT NOT NULL,
      vibes_amount INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- User location preferences (optional)
    CREATE TABLE IF NOT EXISTS user_locations (
      user_fingerprint TEXT PRIMARY KEY,
      lat DECIMAL(10, 8),
      lng DECIMAL(11, 8),
      accuracy INTEGER,
      city TEXT,
      country TEXT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_geo_activity_location ON vibes_geo_activity(lat, lng);
    CREATE INDEX IF NOT EXISTS idx_geo_activity_timestamp ON vibes_geo_activity(timestamp);
    CREATE INDEX IF NOT EXISTS idx_geo_activity_type ON vibes_geo_activity(activity_type);
    CREATE INDEX IF NOT EXISTS idx_geofence_activity_geofence ON vibes_geofence_activity(geofence_id);
    CREATE INDEX IF NOT EXISTS idx_geofence_activity_timestamp ON vibes_geofence_activity(timestamp);
  `;

  console.log('Geofenced tables schema created');
};

// ============================================================================
// INTEGRATION EXAMPLE
// ============================================================================

class VIBESGeoIntegration {
  constructor() {
    this.geoTracker = new GeofencedVibesTracker();
  }

  // Integration with main VIBES system
  async onVibesEarned(userFingerprint, amount, source, metadata = {}) {
    await this.geoTracker.trackVibesActivity(
      userFingerprint,
      amount,
      'earn',
      {
        ...metadata,
        source
      }
    );
  }

  async onVibesSpent(userFingerprint, amount, target, metadata = {}) {
    await this.geoTracker.trackVibesActivity(
      userFingerprint,
      amount,
      'spend',
      {
        ...metadata,
        target
      }
    );
  }

  async onAgentCreated(userFingerprint, agentData, metadata = {}) {
    await this.geoTracker.trackVibesActivity(
      userFingerprint,
      200, // Standard agent creation reward
      'create',
      {
        ...metadata,
        agentType: agentData.type
      }
    );
  }

  async onCommunityHelp(userFingerprint, helpData, metadata = {}) {
    await this.geoTracker.trackVibesActivity(
      userFingerprint,
      helpData.vibesEarned || 25,
      'help',
      {
        ...metadata,
        helpType: helpData.type
      }
    );
  }

  setupExpressIntegration(app, server) {
    // Setup WebSocket server
    this.geoTracker.setupWebSocketServer(server);
    
    // Setup API routes
    this.geoTracker.createExpressRoutes(app);
    
    console.log('VIBES Geofenced API integration complete');
  }
}

// ============================================================================
// EXPORT FOR USE
// ============================================================================

export { 
  GeofencedVibesTracker, 
  VIBESGeoIntegration, 
  setupGeofencedTables 
};

// Example usage:
/*
const geoIntegration = new VIBESGeoIntegration();

// Track VIBES earning
await geoIntegration.onVibesEarned('user123', 25, 'reflection', {
  lat: 37.7749,
  lng: -122.4194,
  userTier: 'developer'
});

// Setup server integration
const app = express();
const server = http.createServer(app);
geoIntegration.setupExpressIntegration(app, server);

// WebSocket client example:
const ws = new WebSocket('ws://localhost:3000');
ws.send(JSON.stringify({
  type: 'subscribe_bounds',
  bounds: { north: 38, south: 37, east: -122, west: -123 }
}));
*/