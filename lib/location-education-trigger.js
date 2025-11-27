/**
 * Location Education Trigger
 *
 * Geofencing system that triggers educational content when users enter
 * physical locations (restaurants, stores, landmarks).
 *
 * Features:
 * - Geofencing with configurable trigger radius
 * - Location-based content delivery (tutorials, quizzes, math games)
 * - Integration with Cal Knowledge Base
 * - Navigation assistance for kids
 * - History lessons about locations
 *
 * Usage:
 *   const trigger = new LocationEducationTrigger();
 *   await trigger.init();
 *   const result = await trigger.checkLocation(userLat, userLong, userId);
 *   if (result.triggered) {
 *     // Deliver educational content to user
 *   }
 *
 * Integration:
 * - Mobile app sends GPS coordinates
 * - System checks geofences
 * - Delivers content from Cal KB
 * - Awards XP/tier progression
 */

const fs = require('fs');
const path = require('path');
const CalKnowledgeBase = require('./cal-knowledge-base');

class LocationEducationTrigger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.calKB = options.calKB || new CalKnowledgeBase({ verbose: this.verbose });
    this.kbInitialized = false;

    // Location-content mapping
    this.locationMap = null;
    this.locationMapPath = options.locationMapPath ||
      path.join(__dirname, '../data/location-content-map.json');

    // Cooldown to prevent spam (don't trigger same location within 1 hour)
    this.triggerCooldown = options.triggerCooldown || 60 * 60 * 1000; // 1 hour
    this.userTriggerHistory = new Map(); // userId → Map(placeId → lastTrigger)
  }

  /**
   * Initialize trigger system
   */
  async init() {
    // Load location-content mapping
    await this.loadLocationMap();

    // Initialize Cal Knowledge Base
    await this.initKB();

    if (this.verbose) {
      console.log(`📍 Location Education Trigger initialized`);
      console.log(`   Locations: ${this.locationMap.locations.length}`);
      console.log(`   Place types: ${Object.keys(this.locationMap.place_types).length}`);
    }
  }

  /**
   * Initialize Cal Knowledge Base
   */
  async initKB() {
    if (!this.kbInitialized) {
      await this.calKB.init();
      this.kbInitialized = true;
    }
  }

  /**
   * Load location-content mapping from JSON
   */
  async loadLocationMap() {
    if (!fs.existsSync(this.locationMapPath)) {
      throw new Error(`Location map not found: ${this.locationMapPath}`);
    }

    const data = fs.readFileSync(this.locationMapPath, 'utf-8');
    this.locationMap = JSON.parse(data);

    if (this.verbose) {
      console.log(`📂 Loaded location map: ${this.locationMap.metadata.total_locations} locations`);
    }
  }

  /**
   * Check user location against all geofences
   *
   * @param {number} userLat - User latitude
   * @param {number} userLong - User longitude
   * @param {string} userId - User ID
   * @returns {object} { triggered, location, content, distance }
   */
  async checkLocation(userLat, userLong, userId) {
    // Find all locations within trigger radius
    const nearbyLocations = [];

    for (const location of this.locationMap.locations) {
      const distance = this.calculateDistance(
        userLat,
        userLong,
        location.latitude,
        location.longitude
      );

      const triggerRadius = location.trigger_radius ||
        this.locationMap.place_types[location.place_type].default_radius;

      if (distance <= triggerRadius) {
        nearbyLocations.push({
          ...location,
          distance: distance
        });
      }
    }

    // No locations triggered
    if (nearbyLocations.length === 0) {
      return {
        triggered: false,
        message: 'No locations nearby'
      };
    }

    // Sort by distance (closest first)
    nearbyLocations.sort((a, b) => a.distance - b.distance);

    // Get closest location
    const closestLocation = nearbyLocations[0];

    // Check cooldown (don't trigger same location within 1 hour)
    if (this.isOnCooldown(userId, closestLocation.place_id)) {
      return {
        triggered: false,
        message: `Location "${closestLocation.place_name}" recently visited`,
        cooldownRemaining: this.getCooldownRemaining(userId, closestLocation.place_id)
      };
    }

    // Load educational content
    const content = await this.loadContent(closestLocation, userId);

    // Record trigger
    await this.recordTrigger(userId, closestLocation, userLat, userLong);

    // Update cooldown
    this.updateCooldown(userId, closestLocation.place_id);

    if (this.verbose) {
      console.log(`📍 Triggered: ${closestLocation.place_name} (${Math.round(closestLocation.distance)}m away)`);
    }

    return {
      triggered: true,
      location: {
        place_id: closestLocation.place_id,
        place_name: closestLocation.place_name,
        place_type: closestLocation.place_type,
        distance: Math.round(closestLocation.distance)
      },
      content: content
    };
  }

  /**
   * Load educational content for location
   */
  async loadContent(location, userId) {
    const learningContent = location.learning_content;

    // Check if tutorial already exists in Cal KB
    const existingTutorial = await this.calKB.search(learningContent.tutorial_title, { limit: 1 });

    let learningId = null;

    if (existingTutorial.length > 0) {
      learningId = existingTutorial[0].id;
    } else {
      // Store new tutorial in Cal KB
      learningId = await this.calKB.storeLearning({
        title: learningContent.tutorial_title,
        description: `Educational content triggered at ${location.place_name}`,
        concepts: learningContent.concepts,
        sections: [],
        quiz: learningContent.quiz,
        examples: [],
        analogies: []
      });
    }

    return {
      tutorial: {
        id: learningId,
        title: learningContent.tutorial_title,
        concepts: learningContent.concepts,
        quiz: learningContent.quiz
      },
      mathGame: learningContent.math_game,
      navigation: {
        directionsTo: location.place_name,
        currentDistance: Math.round(location.distance),
        insideStore: location.distance < 50 // Within 50m = inside
      }
    };
  }

  /**
   * Record location trigger in database
   */
  async recordTrigger(userId, location, userLat, userLong) {
    // Get or create learning ID for this location
    const learningId = await this.getOrCreateLearningId(location);

    // Insert location mapping
    const sql = `
      INSERT INTO location_mappings (
        learning_id,
        place_name,
        latitude,
        longitude,
        place_type,
        trigger_radius,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      learningId,
      location.place_name,
      userLat,
      userLong,
      location.place_type,
      location.trigger_radius,
      new Date().toISOString()
    ];

    try {
      await this.calKB.runSQL(sql, params);

      if (this.verbose) {
        console.log(`💾 Recorded trigger: ${location.place_name} for user ${userId}`);
      }
    } catch (err) {
      if (this.verbose) {
        console.error(`❌ Failed to record trigger: ${err.message}`);
      }
    }
  }

  /**
   * Get or create learning ID for location
   */
  async getOrCreateLearningId(location) {
    const existingTutorial = await this.calKB.search(location.learning_content.tutorial_title, { limit: 1 });

    if (existingTutorial.length > 0) {
      return existingTutorial[0].id;
    }

    // Create new learning entry
    const learningId = await this.calKB.storeLearning({
      title: location.learning_content.tutorial_title,
      description: `Educational content for ${location.place_name}`,
      concepts: location.learning_content.concepts,
      sections: [],
      quiz: location.learning_content.quiz || [],
      examples: [],
      analogies: []
    });

    return learningId;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if location is on cooldown for user
   */
  isOnCooldown(userId, placeId) {
    if (!this.userTriggerHistory.has(userId)) {
      return false;
    }

    const userHistory = this.userTriggerHistory.get(userId);

    if (!userHistory.has(placeId)) {
      return false;
    }

    const lastTrigger = userHistory.get(placeId);
    const timeSinceTrigger = Date.now() - lastTrigger;

    return timeSinceTrigger < this.triggerCooldown;
  }

  /**
   * Get remaining cooldown time in minutes
   */
  getCooldownRemaining(userId, placeId) {
    if (!this.userTriggerHistory.has(userId)) {
      return 0;
    }

    const userHistory = this.userTriggerHistory.get(userId);

    if (!userHistory.has(placeId)) {
      return 0;
    }

    const lastTrigger = userHistory.get(placeId);
    const timeSinceTrigger = Date.now() - lastTrigger;
    const remaining = this.triggerCooldown - timeSinceTrigger;

    return Math.ceil(remaining / 60000); // Convert to minutes
  }

  /**
   * Update cooldown for user + location
   */
  updateCooldown(userId, placeId) {
    if (!this.userTriggerHistory.has(userId)) {
      this.userTriggerHistory.set(userId, new Map());
    }

    const userHistory = this.userTriggerHistory.get(userId);
    userHistory.set(placeId, Date.now());
  }

  /**
   * Get all nearby locations (within max radius)
   */
  async getNearbyLocations(userLat, userLong, maxDistance = 1000) {
    const nearby = [];

    for (const location of this.locationMap.locations) {
      const distance = this.calculateDistance(
        userLat,
        userLong,
        location.latitude,
        location.longitude
      );

      if (distance <= maxDistance) {
        nearby.push({
          ...location,
          distance: Math.round(distance)
        });
      }
    }

    // Sort by distance
    nearby.sort((a, b) => a.distance - b.distance);

    return nearby;
  }

  /**
   * Get location details by place ID
   */
  getLocationById(placeId) {
    return this.locationMap.locations.find(loc => loc.place_id === placeId);
  }

  /**
   * Get all locations of a specific type
   */
  getLocationsByType(placeType) {
    return this.locationMap.locations.filter(loc => loc.place_type === placeType);
  }

  /**
   * Clear cooldown for testing
   */
  clearCooldown(userId, placeId = null) {
    if (!this.userTriggerHistory.has(userId)) {
      return;
    }

    if (placeId) {
      const userHistory = this.userTriggerHistory.get(userId);
      userHistory.delete(placeId);
    } else {
      this.userTriggerHistory.delete(userId);
    }
  }
}

module.exports = LocationEducationTrigger;

// CLI usage example
if (require.main === module) {
  (async () => {
    console.log('📍 Location Education Trigger Demo\n');

    const trigger = new LocationEducationTrigger({ verbose: true });
    await trigger.init();

    // Test coordinates (near McDonald's Mission Valley)
    const userLat = 32.7738;
    const userLong = -117.1478;
    const userId = 'test-kid-123';

    console.log('\n🧪 Testing geofence trigger...\n');
    const result = await trigger.checkLocation(userLat, userLong, userId);

    if (result.triggered) {
      console.log('\n✅ Location triggered!');
      console.log(`   Location: ${result.location.place_name}`);
      console.log(`   Distance: ${result.location.distance}m`);
      console.log(`   Tutorial: ${result.content.tutorial.title}`);
      console.log(`   Concepts: ${result.content.tutorial.concepts.join(', ')}`);
      console.log(`   Math game: ${result.content.mathGame.type}`);
      console.log(`   Quiz questions: ${result.content.tutorial.quiz.length}`);
    } else {
      console.log(`\n❌ No trigger: ${result.message}`);
    }

    // Test nearby locations
    console.log('\n\n📍 Nearby locations (within 2km):');
    const nearby = await trigger.getNearbyLocations(userLat, userLong, 2000);
    nearby.forEach((loc, i) => {
      console.log(`   ${i + 1}. ${loc.place_name} (${loc.distance}m away)`);
    });

    console.log('\n✅ Demo complete!');
  })();
}
