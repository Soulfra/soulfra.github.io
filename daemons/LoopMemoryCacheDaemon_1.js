#!/usr/bin/env node
/**
 * Loop Memory Cache Daemon
 * High-performance short-term memory cache before database sync
 */

const { EventEmitter } = require('events');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Try to use existing Redis config if available
let redisConfig;
try {
    const databaseConfig = require('../../billion-dollar-game/backend/src/config/database');
    redisConfig = databaseConfig.redis;
    console.log('✅ Using existing Redis configuration');
} catch (error) {
    console.log('Using local Redis configuration');
    redisConfig = null;
}

class LoopMemoryCacheDaemon extends EventEmitter {
    constructor() {
        super();
        
        // Use existing Redis instance or create new one
        if (redisConfig) {
            this.redis = redisConfig;
        } else {
            // Fallback configuration
            this.redis = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD,
                db: process.env.REDIS_DB || 0,
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                }
            });
        }
        
        // Create pub/sub clients
        this.publisher = this.redis.duplicate();
        this.subscriber = this.redis.duplicate();
        
        // Cache configuration
        this.config = {
            ttl: {
                hot: 300,        // 5 minutes for hot data
                warm: 3600,      // 1 hour for warm data
                cold: 86400      // 24 hours for cold data
            },
            thresholds: {
                hot_access_count: 10,    // Accesses to be considered hot
                warm_access_count: 3,    // Accesses to be considered warm
                memory_limit_mb: 500,    // Max memory usage
                sync_batch_size: 100,    // Items to sync at once
                sync_interval: 30000     // 30 seconds
            },
            prefixes: {
                loop: 'loop:',
                agent: 'agent:',
                whisper: 'whisper:',
                drift: 'drift:',
                event: 'event:',
                analytics: 'analytics:'
            }
        };
        
        // Memory tracking
        this.memoryStats = {
            total_keys: 0,
            hot_keys: 0,
            warm_keys: 0,
            cold_keys: 0,
            memory_used_mb: 0,
            hits: 0,
            misses: 0,
            evictions: 0,
            sync_queue_size: 0
        };
        
        // Sync queue for database persistence
        this.syncQueue = new Map();
        
        // Access tracking for heat management
        this.accessTracking = new Map();
        
        this.setupEventHandlers();
    }
    
    async initialize() {
        console.log('🚀 Initializing Loop Memory Cache Daemon...');
        
        try {
            // Test Redis connection
            await this.redis.ping();
            console.log('✅ Redis connection established');
            
            // Subscribe to cache events
            await this.subscriber.subscribe(
                'cache:invalidate',
                'cache:warm',
                'cache:sync'
            );
            
            // Start daemon services
            this.startMemoryMonitor();
            this.startSyncService();
            this.startEvictionService();
            
            console.log('✅ Cache daemon initialized');
            
            // Load initial stats
            await this.updateMemoryStats();
            
        } catch (error) {
            console.error('❌ Failed to initialize cache daemon:', error);
            throw error;
        }
    }
    
    setupEventHandlers() {
        // Handle pub/sub messages
        this.subscriber.on('message', (channel, message) => {
            this.handleCacheMessage(channel, message);
        });
        
        // Handle Redis errors
        this.redis.on('error', (error) => {
            console.error('Redis error:', error);
            this.emit('error', error);
        });
    }
    
    // Core Cache Operations
    
    async cacheLoop(loopId, loopData, ttl = null) {
        const key = `${this.config.prefixes.loop}${loopId}`;
        const serialized = JSON.stringify({
            ...loopData,
            cached_at: new Date().toISOString(),
            cache_version: 1
        });
        
        // Determine TTL based on access pattern
        const effectiveTTL = ttl || this.determineDataHeat(loopId);
        
        // Set in Redis with TTL
        await this.redis.setex(key, effectiveTTL, serialized);
        
        // Track access
        this.trackAccess(key, 'write');
        
        // Add to sync queue if important
        if (loopData.blessed || loopData.drift_rating > 50) {
            this.addToSyncQueue(key, loopData, 'high');
        } else {
            this.addToSyncQueue(key, loopData, 'normal');
        }
        
        // Update related caches
        await this.updateRelatedCaches(loopId, loopData);
        
        this.emit('loop_cached', { loop_id: loopId, ttl: effectiveTTL });
    }
    
    async getLoop(loopId) {
        const key = `${this.config.prefixes.loop}${loopId}`;
        
        try {
            const data = await this.redis.get(key);
            
            if (data) {
                this.memoryStats.hits++;
                this.trackAccess(key, 'read');
                
                // Promote to hot tier if accessed frequently
                await this.promoteIfHot(key);
                
                return JSON.parse(data);
            } else {
                this.memoryStats.misses++;
                return null;
            }
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    async cacheAgent(agentId, agentData, ttl = null) {
        const key = `${this.config.prefixes.agent}${agentId}`;
        const serialized = JSON.stringify({
            ...agentData,
            cached_at: new Date().toISOString()
        });
        
        const effectiveTTL = ttl || this.config.ttl.warm;
        await this.redis.setex(key, effectiveTTL, serialized);
        
        this.trackAccess(key, 'write');
        this.addToSyncQueue(key, agentData, 'normal');
        
        this.emit('agent_cached', { agent_id: agentId, ttl: effectiveTTL });
    }
    
    async cacheWhisper(whisperId, whisperData) {
        const key = `${this.config.prefixes.whisper}${whisperId}`;
        const serialized = JSON.stringify(whisperData);
        
        // Whispers are short-lived
        await this.redis.setex(key, this.config.ttl.hot, serialized);
        
        this.emit('whisper_cached', { whisper_id: whisperId });
    }
    
    async cacheDriftMetrics(entityId, metrics) {
        const key = `${this.config.prefixes.drift}${entityId}`;
        const timestamp = Date.now();
        
        // Store as sorted set for time-series data
        await this.redis.zadd(
            key,
            timestamp,
            JSON.stringify({ timestamp, ...metrics })
        );
        
        // Trim old entries (keep last 1000)
        await this.redis.zremrangebyrank(key, 0, -1001);
        
        // Set TTL on the sorted set
        await this.redis.expire(key, this.config.ttl.warm);
        
        // Cache latest value for quick access
        await this.redis.setex(
            `${key}:latest`,
            this.config.ttl.hot,
            JSON.stringify(metrics)
        );
    }
    
    async cacheEvent(eventType, eventData) {
        const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const key = `${this.config.prefixes.event}${eventType}:${eventId}`;
        
        const event = {
            id: eventId,
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString()
        };
        
        // Store event
        await this.redis.setex(key, this.config.ttl.hot, JSON.stringify(event));
        
        // Add to event stream
        await this.redis.xadd(
            `stream:${eventType}`,
            'MAXLEN', '~', '10000',
            '*',
            'event', JSON.stringify(event)
        );
        
        // Publish for real-time subscribers
        await this.publisher.publish(`events:${eventType}`, JSON.stringify(event));
    }
    
    // Heat Management
    
    determineDataHeat(identifier) {
        const accessCount = this.accessTracking.get(identifier)?.count || 0;
        
        if (accessCount >= this.config.thresholds.hot_access_count) {
            return this.config.ttl.hot;
        } else if (accessCount >= this.config.thresholds.warm_access_count) {
            return this.config.ttl.warm;
        } else {
            return this.config.ttl.cold;
        }
    }
    
    trackAccess(key, type = 'read') {
        const tracking = this.accessTracking.get(key) || {
            count: 0,
            last_access: null,
            first_access: new Date()
        };
        
        tracking.count++;
        tracking.last_access = new Date();
        
        this.accessTracking.set(key, tracking);
        
        // Trim old access tracking entries
        if (this.accessTracking.size > 10000) {
            const oldestEntries = Array.from(this.accessTracking.entries())
                .sort((a, b) => a[1].last_access - b[1].last_access)
                .slice(0, 1000);
            
            oldestEntries.forEach(([key]) => this.accessTracking.delete(key));
        }
    }
    
    async promoteIfHot(key) {
        const tracking = this.accessTracking.get(key);
        if (!tracking) return;
        
        if (tracking.count >= this.config.thresholds.hot_access_count) {
            const ttl = await this.redis.ttl(key);
            if (ttl > 0 && ttl < this.config.ttl.hot) {
                // Extend TTL to hot tier
                await this.redis.expire(key, this.config.ttl.hot);
                this.emit('key_promoted', { key, tier: 'hot' });
            }
        }
    }
    
    // Related Cache Updates
    
    async updateRelatedCaches(loopId, loopData) {
        // Update aggregated metrics
        if (loopData.emotional_tone) {
            await this.redis.hincrby(
                'analytics:tone_counts',
                loopData.emotional_tone,
                1
            );
        }
        
        // Update drift index if present
        if (loopData.drift_rating) {
            await this.redis.zadd(
                'index:loops_by_drift',
                loopData.drift_rating,
                loopId
            );
        }
        
        // Update blessing index
        if (loopData.blessed) {
            await this.redis.sadd('index:blessed_loops', loopId);
        }
        
        // Update time-based indexes
        const hour = new Date().getHours();
        await this.redis.hincrby(
            `analytics:hourly_activity:${hour}`,
            'loops',
            1
        );
    }
    
    // Sync Queue Management
    
    addToSyncQueue(key, data, priority = 'normal') {
        this.syncQueue.set(key, {
            data,
            priority,
            queued_at: new Date(),
            attempts: 0
        });
        
        this.memoryStats.sync_queue_size = this.syncQueue.size;
        
        // Trigger immediate sync if high priority
        if (priority === 'high' && this.syncQueue.size >= 10) {
            this.processSyncQueue();
        }
    }
    
    async processSyncQueue() {
        if (this.syncQueue.size === 0) return;
        
        console.log(`🔄 Processing sync queue (${this.syncQueue.size} items)...`);
        
        // Sort by priority and age
        const entries = Array.from(this.syncQueue.entries())
            .sort((a, b) => {
                if (a[1].priority !== b[1].priority) {
                    return a[1].priority === 'high' ? -1 : 1;
                }
                return a[1].queued_at - b[1].queued_at;
            })
            .slice(0, this.config.thresholds.sync_batch_size);
        
        // Process batch
        const syncPromises = entries.map(async ([key, item]) => {
            try {
                await this.syncToDatabase(key, item.data);
                this.syncQueue.delete(key);
                return { success: true, key };
            } catch (error) {
                item.attempts++;
                if (item.attempts > 3) {
                    this.syncQueue.delete(key);
                    console.error(`Failed to sync ${key} after 3 attempts`);
                }
                return { success: false, key, error };
            }
        });
        
        const results = await Promise.all(syncPromises);
        const successCount = results.filter(r => r.success).length;
        
        console.log(`  ✓ Synced ${successCount}/${entries.length} items`);
        
        this.memoryStats.sync_queue_size = this.syncQueue.size;
        this.emit('sync_completed', { processed: entries.length, success: successCount });
    }
    
    async syncToDatabase(key, data) {
        // This would integrate with PostgresLoopMirror
        // For now, emit event for external handling
        this.emit('sync_to_database', { key, data });
        
        // Simulate database write
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Memory Management
    
    async updateMemoryStats() {
        try {
            // Get memory info from Redis
            const info = await this.redis.info('memory');
            const usedMemory = info.match(/used_memory:(\d+)/);
            if (usedMemory) {
                this.memoryStats.memory_used_mb = parseInt(usedMemory[1]) / 1024 / 1024;
            }
            
            // Count keys by prefix
            let totalKeys = 0;
            let hotKeys = 0;
            let warmKeys = 0;
            
            for (const prefix of Object.values(this.config.prefixes)) {
                const keys = await this.redis.keys(`${prefix}*`);
                totalKeys += keys.length;
                
                // Sample TTLs to categorize
                for (const key of keys.slice(0, 10)) {
                    const ttl = await this.redis.ttl(key);
                    if (ttl <= this.config.ttl.hot) hotKeys++;
                    else if (ttl <= this.config.ttl.warm) warmKeys++;
                }
            }
            
            this.memoryStats.total_keys = totalKeys;
            this.memoryStats.hot_keys = hotKeys;
            this.memoryStats.warm_keys = warmKeys;
            this.memoryStats.cold_keys = totalKeys - hotKeys - warmKeys;
            
        } catch (error) {
            console.error('Error updating memory stats:', error);
        }
    }
    
    async evictColdData() {
        if (this.memoryStats.memory_used_mb < this.config.thresholds.memory_limit_mb * 0.8) {
            return; // No need to evict
        }
        
        console.log('🧹 Running cold data eviction...');
        
        let evicted = 0;
        const scanStream = this.redis.scanStream({
            match: '*',
            count: 100
        });
        
        scanStream.on('data', async (keys) => {
            for (const key of keys) {
                const tracking = this.accessTracking.get(key);
                
                // Evict if not accessed recently
                if (!tracking || 
                    Date.now() - tracking.last_access > this.config.ttl.cold * 1000) {
                    
                    // Save to sync queue before eviction
                    const data = await this.redis.get(key);
                    if (data) {
                        this.addToSyncQueue(key, JSON.parse(data), 'low');
                    }
                    
                    await this.redis.del(key);
                    this.accessTracking.delete(key);
                    evicted++;
                }
            }
        });
        
        scanStream.on('end', () => {
            this.memoryStats.evictions += evicted;
            console.log(`  ✓ Evicted ${evicted} cold keys`);
            this.emit('eviction_completed', { evicted });
        });
    }
    
    // Daemon Services
    
    startMemoryMonitor() {
        this.memoryMonitorInterval = setInterval(async () => {
            await this.updateMemoryStats();
            
            // Emit warning if memory usage is high
            if (this.memoryStats.memory_used_mb > this.config.thresholds.memory_limit_mb * 0.9) {
                this.emit('memory_warning', {
                    used_mb: this.memoryStats.memory_used_mb,
                    limit_mb: this.config.thresholds.memory_limit_mb
                });
            }
        }, 30000); // Every 30 seconds
    }
    
    startSyncService() {
        this.syncInterval = setInterval(() => {
            this.processSyncQueue();
        }, this.config.thresholds.sync_interval);
    }
    
    startEvictionService() {
        this.evictionInterval = setInterval(() => {
            this.evictColdData();
        }, 300000); // Every 5 minutes
    }
    
    // Message Handling
    
    async handleCacheMessage(channel, message) {
        try {
            const data = JSON.parse(message);
            
            switch (channel) {
                case 'cache:invalidate':
                    await this.invalidateCache(data.key || data.pattern);
                    break;
                    
                case 'cache:warm':
                    await this.warmCache(data.keys);
                    break;
                    
                case 'cache:sync':
                    await this.processSyncQueue();
                    break;
            }
        } catch (error) {
            console.error('Error handling cache message:', error);
        }
    }
    
    async invalidateCache(keyOrPattern) {
        if (keyOrPattern.includes('*')) {
            // Pattern-based invalidation
            const keys = await this.redis.keys(keyOrPattern);
            for (const key of keys) {
                await this.redis.del(key);
            }
            console.log(`Invalidated ${keys.length} keys matching ${keyOrPattern}`);
        } else {
            // Single key invalidation
            await this.redis.del(keyOrPattern);
        }
    }
    
    async warmCache(keys) {
        console.log(`🔥 Warming cache with ${keys.length} keys...`);
        
        for (const key of keys) {
            // Extend TTL to keep in cache
            await this.redis.expire(key, this.config.ttl.warm);
        }
    }
    
    // Public API
    
    async getStats() {
        await this.updateMemoryStats();
        
        const hitRate = this.memoryStats.hits / 
                       (this.memoryStats.hits + this.memoryStats.misses) || 0;
        
        return {
            ...this.memoryStats,
            hit_rate: (hitRate * 100).toFixed(2) + '%',
            sync_queue_items: Array.from(this.syncQueue.keys()),
            access_tracking_size: this.accessTracking.size,
            uptime: process.uptime()
        };
    }
    
    async flushAll() {
        console.log('⚠️  Flushing all cache data...');
        
        // Process sync queue first
        await this.processSyncQueue();
        
        // Then flush Redis
        await this.redis.flushdb();
        
        // Clear tracking
        this.accessTracking.clear();
        this.syncQueue.clear();
        
        // Reset stats
        this.memoryStats = {
            total_keys: 0,
            hot_keys: 0,
            warm_keys: 0,
            cold_keys: 0,
            memory_used_mb: 0,
            hits: 0,
            misses: 0,
            evictions: 0,
            sync_queue_size: 0
        };
        
        console.log('  ✓ Cache flushed');
    }
    
    async stop() {
        console.log('🛑 Stopping Loop Memory Cache Daemon...');
        
        // Process remaining sync queue
        await this.processSyncQueue();
        
        // Clear intervals
        if (this.memoryMonitorInterval) clearInterval(this.memoryMonitorInterval);
        if (this.syncInterval) clearInterval(this.syncInterval);
        if (this.evictionInterval) clearInterval(this.evictionInterval);
        
        // Close Redis connections
        await this.subscriber.quit();
        await this.publisher.quit();
        await this.redis.quit();
        
        console.log('  Cache daemon stopped');
    }
}

module.exports = LoopMemoryCacheDaemon;

// Example usage
if (require.main === module) {
    const cacheDaemon = new LoopMemoryCacheDaemon();
    
    cacheDaemon.on('loop_cached', (event) => {
        console.log(`📦 Loop cached: ${event.loop_id} (TTL: ${event.ttl}s)`);
    });
    
    cacheDaemon.on('memory_warning', (event) => {
        console.log(`⚠️  Memory warning: ${event.used_mb}MB / ${event.limit_mb}MB`);
    });
    
    cacheDaemon.on('sync_completed', (event) => {
        console.log(`✅ Sync completed: ${event.success}/${event.processed} items`);
    });
    
    async function demo() {
        try {
            await cacheDaemon.initialize();
            
            // Cache some test data
            await cacheDaemon.cacheLoop('loop_cache_test_001', {
                emotional_tone: 'joy',
                consciousness: { awareness: 0.8 },
                drift_rating: 15.5,
                blessed: false
            });
            
            await cacheDaemon.cacheLoop('loop_cache_test_002', {
                emotional_tone: 'curiosity',
                consciousness: { awareness: 0.9 },
                drift_rating: 75.2,
                blessed: true
            });
            
            // Retrieve from cache
            const loop1 = await cacheDaemon.getLoop('loop_cache_test_001');
            console.log('\nRetrieved loop 1:', loop1);
            
            // Cache drift metrics
            await cacheDaemon.cacheDriftMetrics('loop_cache_test_001', {
                drift_rate: 0.15,
                volatility: 0.3,
                trend: 'increasing'
            });
            
            // Cache event
            await cacheDaemon.cacheEvent('loop_created', {
                loop_id: 'loop_cache_test_003',
                creator: 'demo_user'
            });
            
            // Get stats
            const stats = await cacheDaemon.getStats();
            console.log('\nCache Statistics:', stats);
            
            // Keep running for demo
            setTimeout(async () => {
                const finalStats = await cacheDaemon.getStats();
                console.log('\nFinal Statistics:', finalStats);
                await cacheDaemon.stop();
                process.exit(0);
            }, 10000);
            
        } catch (error) {
            console.error('Demo error:', error);
            process.exit(1);
        }
    }
    
    demo();
}