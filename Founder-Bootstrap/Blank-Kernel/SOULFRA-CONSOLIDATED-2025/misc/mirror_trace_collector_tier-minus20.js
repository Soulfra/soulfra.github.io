// mirror-shell/collectors/MirrorTraceCollector.js
// Gathers ritual JSON feeds into loop-ready seeds for recursive evolution
// Operates as the memory bridge between platforms in the four-body system

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { LoopSeedGenerator } = require('../core/LoopSeedGenerator');
const { CompressionEngine } = require('../core/CompressionEngine');
const { CrossPlatformBridge } = require('../bridges/CrossPlatformBridge');

class MirrorTraceCollector extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      collectionInterval: config.collectionInterval || 60000, // 1 minute
      maxRetentionTime: config.maxRetentionTime || 86400000, // 24 hours
      compressionRatio: config.compressionRatio || 0.8,
      seedGenerationThreshold: config.seedGenerationThreshold || 100,
      ...config
    };
    
    // Core components
    this.loopSeedGenerator = new LoopSeedGenerator();
    this.compressionEngine = new CompressionEngine();
    this.platformBridge = new CrossPlatformBridge();
    
    // Data stores
    this.ritualFeeds = new Map();
    this.collectedTraces = new Map();
    this.seedHistory = new Map();
    this.compressionCache = new Map();
    
    // Collection state
    this.isCollecting = false;
    this.lastCollectionTime = null;
    this.totalTracesCollected = 0;
    this.successfulSeeds = 0;
    
    console.log('🪞 MirrorTraceCollector initialized - Ready to gather ritual feeds');
  }
  
  async startCollection() {
    if (this.isCollecting) {
      console.warn('⚠️ Collection already in progress');
      return;
    }
    
    this.isCollecting = true;
    console.log('🚀 Starting ritual feed collection...');
    
    // Start collection interval
    this.collectionInterval = setInterval(async () => {
      await this.performCollection();
    }, this.config.collectionInterval);
    
    // Start cleanup interval (less frequent)
    this.cleanupInterval = setInterval(async () => {
      await this.performCleanup();
    }, this.config.collectionInterval * 10);
    
    // Initial collection
    await this.performCollection();
    
    this.emit('collection_started');
    console.log('✅ Ritual feed collection started');
  }
  
  async stopCollection() {
    if (!this.isCollecting) return;
    
    console.log('🛑 Stopping ritual feed collection...');
    this.isCollecting = false;
    
    clearInterval(this.collectionInterval);
    clearInterval(this.cleanupInterval);
    
    // Final collection and seed generation
    await this.performCollection();
    const finalSeed = await this.generateFinalSeed();
    
    this.emit('collection_stopped', { finalSeed });
    console.log('🔴 Ritual feed collection stopped');
  }
  
  async performCollection() {
    if (!this.isCollecting) return;
    
    try {
      console.log('🔍 Performing ritual feed collection...');
      
      const collectionTimestamp = Date.now();
      
      // Collect from all platforms simultaneously
      const [runtimeTraces, surfaceReflections, protocolValidations] = await Promise.all([
        this.fetchRuntimeTraces(),
        this.fetchSurfaceReflections(), 
        this.fetchProtocolValidations()
      ]);
      
      // Store collected data
      const collectionId = this.generateCollectionId();
      const collectedData = {
        id: collectionId,
        timestamp: collectionTimestamp,
        runtime: runtimeTraces,
        surface: surfaceReflections,
        protocol: protocolValidations,
        metadata: {
          collectionDuration: Date.now() - collectionTimestamp,
          totalTraces: runtimeTraces.length + surfaceReflections.length + protocolValidations.length
        }
      };
      
      this.collectedTraces.set(collectionId, collectedData);
      this.lastCollectionTime = collectionTimestamp;
      this.totalTracesCollected += collectedData.metadata.totalTraces;
      
      console.log(`📊 Collection complete: ${collectedData.metadata.totalTraces} traces`);
      
      // Check if we should generate a seed
      if (this.shouldGenerateSeed()) {
        await this.generateLoopReadySeed();
      }
      
      this.emit('collection_complete', collectedData);
      
    } catch (error) {
      console.error('❌ Collection error:', error);
      this.emit('collection_error', error);
    }
  }
  
  async fetchRuntimeTraces() {
    console.log('🔵 Fetching runtime traces...');
    
    try {
      const runtimeData = await this.platformBridge.fetchFromRuntime({
        endpoint: '/internal/traces',
        includeAgentStates: true,
        includeDaemonLogs: true,
        includeRitualEvents: true,
        timeRange: this.getTimeRange()
      });
      
      const traces = this.processRuntimeData(runtimeData);
      console.log(`✅ Runtime traces: ${traces.length} items`);
      
      return traces;
      
    } catch (error) {
      console.error('❌ Error fetching runtime traces:', error);
      return [];
    }
  }
  
  async fetchSurfaceReflections() {
    console.log('🟠 Fetching surface reflections...');
    
    try {
      const surfaceData = await this.platformBridge.fetchFromSurface({
        endpoint: '/api/reflections/export',
        includeVibeWeather: true,
        includeAgentEchoes: true,
        includeRitualTraces: true,
        timeRange: this.getTimeRange()
      });
      
      const reflections = this.processSurfaceData(surfaceData);
      console.log(`✅ Surface reflections: ${reflections.length} items`);
      
      return reflections;
      
    } catch (error) {
      console.error('❌ Error fetching surface reflections:', error);
      return [];
    }
  }
  
  async fetchProtocolValidations() {
    console.log('🟣 Fetching protocol validations...');
    
    try {
      const protocolData = await this.platformBridge.fetchFromProtocol({
        endpoint: '/legal/validations/export',
        includeLegalStatus: true,
        includeComplianceChecks: true,
        includeLicenseValidations: true,
        timeRange: this.getTimeRange()
      });
      
      const validations = this.processProtocolData(protocolData);
      console.log(`✅ Protocol validations: ${validations.length} items`);
      
      return validations;
      
    } catch (error) {
      console.error('❌ Error fetching protocol validations:', error);
      return [];
    }
  }
  
  async generateLoopReadySeed() {
    console.log('🌱 Generating loop-ready seed...');
    
    try {
      // Get all collected data for seed generation
      const allCollectedData = Array.from(this.collectedTraces.values());
      
      // Generate comprehensive seed
      const seedData = await this.loopSeedGenerator.createSeed({
        collections: allCollectedData,
        totalTraces: this.totalTracesCollected,
        timeRange: this.getTimeRange(),
        metadata: {
          generatedAt: Date.now(),
          collectorVersion: '1.0.0',
          seedNumber: this.successfulSeeds + 1
        }
      });
      
      // Compress the seed for efficient storage and transmission
      const compressedSeed = await this.compressionEngine.compress(seedData, {
        targetRatio: this.config.compressionRatio,
        preserveStructure: true,
        optimizeForRetrieval: true
      });
      
      const seedId = this.generateSeedId();
      const loopReadySeed = {
        seedId,
        timestamp: Date.now(),
        originalSize: JSON.stringify(seedData).length,
        compressedSize: JSON.stringify(compressedSeed).length,
        compressionRatio: compressedSeed.compressionRatio,
        loopData: compressedSeed,
        readyForRitual: true,
        seedMetadata: {
          sourceCollections: allCollectedData.length,
          totalTraces: this.totalTracesCollected,
          generationTime: Date.now()
        }
      };
      
      // Store seed
      this.seedHistory.set(seedId, loopReadySeed);
      this.successfulSeeds++;
      
      console.log(`✅ Loop-ready seed generated: ${seedId}`);
      console.log(`📏 Compression: ${loopReadySeed.originalSize} → ${loopReadySeed.compressedSize} bytes`);
      
      // Send seed to runtime for integration
      await this.sendSeedToRuntime(loopReadySeed);
      
      this.emit('seed_generated', loopReadySeed);
      
      return loopReadySeed;
      
    } catch (error) {
      console.error('❌ Error generating seed:', error);
      this.emit('seed_error', error);
      throw error;
    }
  }
  
  async sendSeedToRuntime(seed) {
    console.log(`📨 Sending seed to runtime: ${seed.seedId}`);
    
    try {
      await this.platformBridge.sendToRuntime({
        endpoint: '/DIAMOND/ritual_core',
        method: 'POST',
        data: {
          type: 'ritual_seed',
          seedId: seed.seedId,
          seedData: seed.loopData,
          metadata: seed.seedMetadata
        }
      });
      
      console.log('✅ Seed successfully sent to runtime');
      
    } catch (error) {
      console.error('❌ Error sending seed to runtime:', error);
      throw error;
    }
  }
  
  // Data processing methods
  processRuntimeData(runtimeData) {
    if (!runtimeData || !runtimeData.traces) return [];
    
    return runtimeData.traces.map(trace => ({
      type: 'runtime',
      source: trace.source || 'unknown',
      timestamp: trace.timestamp,
      data: trace.data,
      agentId: trace.agentId,
      ritualId: trace.ritualId,
      processed: true
    }));
  }
  
  processSurfaceData(surfaceData) {
    if (!surfaceData || !surfaceData.reflections) return [];
    
    return surfaceData.reflections.map(reflection => ({
      type: 'surface',
      source: reflection.source || 'unknown',
      timestamp: reflection.timestamp,
      data: reflection.data,
      reflectionType: reflection.type,
      vibeScore: reflection.vibeScore,
      processed: true
    }));
  }
  
  processProtocolData(protocolData) {
    if (!protocolData || !protocolData.validations) return [];
    
    return protocolData.validations.map(validation => ({
      type: 'protocol',
      source: validation.source || 'unknown',
      timestamp: validation.timestamp,
      data: validation.data,
      validationType: validation.type,
      legalStatus: validation.status,
      processed: true
    }));
  }
  
  // Helper methods
  shouldGenerateSeed() {
    const totalTraces = Array.from(this.collectedTraces.values())
      .reduce((sum, collection) => sum + collection.metadata.totalTraces, 0);
    
    return totalTraces >= this.config.seedGenerationThreshold;
  }
  
  getTimeRange() {
    const now = Date.now();
    return {
      start: this.lastCollectionTime || (now - this.config.collectionInterval),
      end: now
    };
  }
  
  async performCleanup() {
    console.log('🧹 Performing cleanup...');
    
    const cutoffTime = Date.now() - this.config.maxRetentionTime;
    
    // Clean old collections
    for (const [id, collection] of this.collectedTraces.entries()) {
      if (collection.timestamp < cutoffTime) {
        this.collectedTraces.delete(id);
      }
    }
    
    // Clean old seeds
    for (const [id, seed] of this.seedHistory.entries()) {
      if (seed.timestamp < cutoffTime) {
        this.seedHistory.delete(id);
      }
    }
    
    // Clear compression cache
    this.compressionCache.clear();
    
    console.log('✅ Cleanup complete');
  }
  
  async generateFinalSeed() {
    console.log('🏁 Generating final seed before shutdown...');
    
    if (this.collectedTraces.size === 0) {
      console.log('⚠️ No collected traces for final seed');
      return null;
    }
    
    return await this.generateLoopReadySeed();
  }
  
  // ID generation
  generateCollectionId() {
    return `collection_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateSeedId() {
    return `seed_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  // Status and metrics
  getStatus() {
    return {
      isCollecting: this.isCollecting,
      lastCollectionTime: this.lastCollectionTime,
      totalTracesCollected: this.totalTracesCollected,
      successfulSeeds: this.successfulSeeds,
      activeCollections: this.collectedTraces.size,
      seedHistory: this.seedHistory.size,
      config: this.config
    };
  }
  
  getMetrics() {
    const collectionSizes = Array.from(this.collectedTraces.values())
      .map(c => c.metadata.totalTraces);
    
    const seedSizes = Array.from(this.seedHistory.values())
      .map(s => s.compressedSize);
    
    return {
      collections: {
        total: this.collectedTraces.size,
        averageSize: collectionSizes.length > 0 ? 
          collectionSizes.reduce((a, b) => a + b, 0) / collectionSizes.length : 0,
        maxSize: Math.max(...collectionSizes, 0),
        minSize: Math.min(...collectionSizes, Number.MAX_SAFE_INTEGER)
      },
      seeds: {
        total: this.seedHistory.size,
        successful: this.successfulSeeds,
        averageSize: seedSizes.length > 0 ?
          seedSizes.reduce((a, b) => a + b, 0) / seedSizes.length : 0,
        compressionEfficiency: this.calculateCompressionEfficiency()
      },
      performance: {
        collectionsPerHour: this.calculateCollectionsPerHour(),
        seedsPerHour: this.calculateSeedsPerHour(),
        uptime: Date.now() - (this.lastCollectionTime || Date.now())
      }
    };
  }
  
  calculateCompressionEfficiency() {
    const seeds = Array.from(this.seedHistory.values());
    if (seeds.length === 0) return 0;
    
    const totalOriginal = seeds.reduce((sum, seed) => sum + seed.originalSize, 0);
    const totalCompressed = seeds.reduce((sum, seed) => sum + seed.compressedSize, 0);
    
    return totalOriginal > 0 ? (totalOriginal - totalCompressed) / totalOriginal : 0;
  }
  
  calculateCollectionsPerHour() {
    // Implementation would track collection rate over time
    return this.collectedTraces.size; // Simplified
  }
  
  calculateSeedsPerHour() {
    // Implementation would track seed generation rate over time
    return this.successfulSeeds; // Simplified
  }
}

module.exports = { MirrorTraceCollector };