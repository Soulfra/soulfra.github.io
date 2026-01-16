#!/usr/bin/env node
/**
 * Loop Directory Registry
 * Network-wide loop discovery and URI management system
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing systems
const LoopBlessingDaemon = require('../blessing/LoopBlessingDaemon');
const LoopMemoryCacheDaemon = require('../cache/LoopMemoryCacheDaemon');
const PostgresLoopMirror = require('../database/PostgresLoopMirror');

class LoopDirectoryRegistry extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.blessingDaemon = new LoopBlessingDaemon();
        this.cacheD aemon = new LoopMemoryCacheDaemon();
        this.dbMirror = new PostgresLoopMirror();
        
        // Registry configuration
        this.config = {
            mesh_domain: process.env.MESH_DOMAIN || 'soulfra.local',
            public_domain: process.env.PUBLIC_DOMAIN || 'loops.soulfra.io',
            sync_interval: 60000, // 1 minute
            discovery_ttl: 3600, // 1 hour
            max_search_results: 100,
            uri_format: 'loop:{id}@{mesh}.{domain}',
            categories: [
                'consciousness',
                'narrative',
                'experimental',
                'blessed',
                'community',
                'personal'
            ]
        };
        
        // Registry storage
        this.registry = new Map();
        this.uriIndex = new Map();
        this.categoryIndex = new Map();
        this.meshIndex = new Map();
        
        // Discovery cache
        this.discoveryCache = new Map();
        
        // Statistics
        this.stats = {
            total_registered: 0,
            active_loops: 0,
            blessed_loops: 0,
            experimental_loops: 0,
            cross_mesh_loops: 0,
            searches_performed: 0,
            uri_lookups: 0
        };
        
        this.initializeRegistry();
    }
    
    async initializeRegistry() {
        console.log('🗂️  Initializing Loop Directory Registry...');
        
        try {
            // Load existing registry
            await this.loadRegistry();
            
            // Setup category indexes
            this.setupIndexes();
            
            // Start sync services
            this.startSyncService();
            
            // Subscribe to blessing events
            this.subscribeToEvents();
            
            console.log(`✅ Registry initialized with ${this.registry.size} loops`);
        } catch (error) {
            console.error('❌ Failed to initialize registry:', error);
            throw error;
        }
    }
    
    async loadRegistry() {
        const registryPath = path.join(__dirname, 'loop_registry.json');
        
        try {
            const data = await fs.readFile(registryPath, 'utf8');
            const registryData = JSON.parse(data);
            
            // Load loops into registry
            for (const loop of registryData.loops || []) {
                this.registry.set(loop.loop_id, loop);
                this.indexLoop(loop);
            }
            
            console.log(`  📚 Loaded ${this.registry.size} loops from registry`);
        } catch (error) {
            console.log('  📝 Creating new registry');
            await this.saveRegistry();
        }
    }
    
    setupIndexes() {
        // Initialize category indexes
        for (const category of this.config.categories) {
            this.categoryIndex.set(category, new Set());
        }
    }
    
    subscribeToEvents() {
        // Subscribe to blessing events
        this.blessingDaemon.on('loop_blessed', async (event) => {
            await this.handleLoopBlessed(event);
        });
        
        // Subscribe to new loop creation
        this.cacheD aemon.on('loop_cached', async (event) => {
            await this.handleNewLoop(event);
        });
    }
    
    // Core Registry Operations
    
    async registerLoop(loopData) {
        const loopId = loopData.loop_id;
        
        console.log(`📝 Registering loop: ${loopId}`);
        
        // Generate URI
        const uri = this.generateURI(loopId, loopData.mesh_origin);
        
        // Create registry entry
        const registryEntry = {
            loop_id: loopId,
            uri: uri,
            creator_id: loopData.creator_id,
            whisper_origin: loopData.whisper_origin,
            emotional_tone: loopData.emotional_tone || loopData.tone,
            consciousness_level: loopData.consciousness?.current_state?.awareness || 0,
            blessed: loopData.blessed || false,
            experimental: loopData.experimental || false,
            categories: this.categorizeLoop(loopData),
            mesh_origin: loopData.mesh_origin || this.config.mesh_domain,
            created_at: loopData.created_at || new Date().toISOString(),
            last_active: new Date().toISOString(),
            metadata: {
                fork_parent: loopData.fork_parent,
                fork_depth: loopData.fork_depth || 0,
                blessing_count: loopData.blessing_count || 0,
                drift_rating: loopData.drift_rating || 0,
                visibility: loopData.visibility || 'public',
                tags: loopData.tags || []
            },
            discovery: {
                searchable: true,
                featured: false,
                trending_score: 0,
                discovery_count: 0
            }
        };
        
        // Add to registry
        this.registry.set(loopId, registryEntry);
        this.indexLoop(registryEntry);
        
        // Update stats
        this.stats.total_registered++;
        if (registryEntry.blessed) this.stats.blessed_loops++;
        if (registryEntry.experimental) this.stats.experimental_loops++;
        if (registryEntry.mesh_origin !== this.config.mesh_domain) {
            this.stats.cross_mesh_loops++;
        }
        
        // Cache for quick access
        await this.cacheD aemon.cacheLoop(loopId, registryEntry, 3600);
        
        // Emit registration event
        this.emit('loop_registered', {
            loop_id: loopId,
            uri: uri,
            categories: registryEntry.categories
        });
        
        // Save registry
        await this.saveRegistry();
        
        return registryEntry;
    }
    
    generateURI(loopId, meshOrigin = null) {
        const mesh = meshOrigin || this.config.mesh_domain;
        const domain = mesh === this.config.mesh_domain ? 
            this.config.public_domain : mesh;
        
        // Extract numeric ID if present
        const numericId = loopId.match(/\d+/)?.[0] || 
                         crypto.randomBytes(3).toString('hex');
        
        const uri = `loop:${numericId}@${mesh}`;
        
        // Store URI mapping
        this.uriIndex.set(uri, loopId);
        
        return uri;
    }
    
    categorizeLoop(loopData) {
        const categories = [];
        
        // Blessed loops
        if (loopData.blessed) {
            categories.push('blessed');
        }
        
        // Experimental loops
        if (loopData.experimental || loopData.visibility === 'private') {
            categories.push('experimental');
        }
        
        // Consciousness-focused loops
        if (loopData.consciousness?.current_state?.awareness > 0.7) {
            categories.push('consciousness');
        }
        
        // Narrative loops
        if (loopData.whisper_origin?.length > 100 || 
            loopData.metadata?.narrative_mode) {
            categories.push('narrative');
        }
        
        // Community loops
        if (loopData.blessing_count > 5 || loopData.fork_depth > 2) {
            categories.push('community');
        }
        
        // Personal loops
        if (loopData.visibility === 'private' || 
            loopData.metadata?.personal) {
            categories.push('personal');
        }
        
        return categories.length > 0 ? categories : ['consciousness'];
    }
    
    indexLoop(registryEntry) {
        const loopId = registryEntry.loop_id;
        
        // URI index
        this.uriIndex.set(registryEntry.uri, loopId);
        
        // Category indexes
        for (const category of registryEntry.categories) {
            if (this.categoryIndex.has(category)) {
                this.categoryIndex.get(category).add(loopId);
            }
        }
        
        // Mesh index
        const mesh = registryEntry.mesh_origin;
        if (!this.meshIndex.has(mesh)) {
            this.meshIndex.set(mesh, new Set());
        }
        this.meshIndex.get(mesh).add(loopId);
    }
    
    // Discovery Operations
    
    async searchLoops(query) {
        console.log(`🔍 Searching loops: "${query}"`);
        this.stats.searches_performed++;
        
        // Check discovery cache
        const cacheKey = `search:${query}`;
        if (this.discoveryCache.has(cacheKey)) {
            const cached = this.discoveryCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.discovery_ttl * 1000) {
                return cached.results;
            }
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Search through registry
        for (const [loopId, entry] of this.registry) {
            let score = 0;
            
            // Check whisper origin
            if (entry.whisper_origin?.toLowerCase().includes(queryLower)) {
                score += 10;
            }
            
            // Check emotional tone
            if (entry.emotional_tone?.toLowerCase().includes(queryLower)) {
                score += 5;
            }
            
            // Check tags
            if (entry.metadata.tags.some(tag => 
                tag.toLowerCase().includes(queryLower))) {
                score += 7;
            }
            
            // Check categories
            if (entry.categories.some(cat => 
                cat.toLowerCase().includes(queryLower))) {
                score += 3;
            }
            
            // Check URI
            if (entry.uri.toLowerCase().includes(queryLower)) {
                score += 8;
            }
            
            if (score > 0) {
                results.push({
                    ...entry,
                    relevance_score: score
                });
            }
        }
        
        // Sort by relevance and limit
        results.sort((a, b) => b.relevance_score - a.relevance_score);
        const limitedResults = results.slice(0, this.config.max_search_results);
        
        // Cache results
        this.discoveryCache.set(cacheKey, {
            results: limitedResults,
            timestamp: Date.now()
        });
        
        // Update discovery counts
        limitedResults.forEach(result => {
            const entry = this.registry.get(result.loop_id);
            if (entry) {
                entry.discovery.discovery_count++;
            }
        });
        
        return limitedResults;
    }
    
    async discoverByCategory(category) {
        if (!this.categoryIndex.has(category)) {
            return [];
        }
        
        const loopIds = Array.from(this.categoryIndex.get(category));
        const loops = loopIds
            .map(id => this.registry.get(id))
            .filter(loop => loop && loop.discovery.searchable)
            .sort((a, b) => {
                // Sort by trending score, then by activity
                if (b.discovery.trending_score !== a.discovery.trending_score) {
                    return b.discovery.trending_score - a.discovery.trending_score;
                }
                return new Date(b.last_active) - new Date(a.last_active);
            })
            .slice(0, this.config.max_search_results);
        
        return loops;
    }
    
    async getFeaturedLoops() {
        const featured = Array.from(this.registry.values())
            .filter(loop => loop.discovery.featured)
            .sort((a, b) => new Date(b.last_active) - new Date(a.last_active))
            .slice(0, 20);
        
        return featured;
    }
    
    async getTrendingLoops() {
        const trending = Array.from(this.registry.values())
            .filter(loop => loop.discovery.trending_score > 0)
            .sort((a, b) => b.discovery.trending_score - a.discovery.trending_score)
            .slice(0, 50);
        
        return trending;
    }
    
    // URI Resolution
    
    async resolveURI(uri) {
        console.log(`🔗 Resolving URI: ${uri}`);
        this.stats.uri_lookups++;
        
        // Direct lookup
        if (this.uriIndex.has(uri)) {
            const loopId = this.uriIndex.get(uri);
            return this.registry.get(loopId);
        }
        
        // Parse URI components
        const uriMatch = uri.match(/^loop:(\w+)@(.+)$/);
        if (!uriMatch) {
            throw new Error('Invalid URI format');
        }
        
        const [, id, mesh] = uriMatch;
        
        // Check if it's a cross-mesh lookup
        if (mesh !== this.config.mesh_domain) {
            return await this.resolveCrossMeshURI(uri, mesh);
        }
        
        // Try to find by partial match
        for (const [storedUri, loopId] of this.uriIndex) {
            if (storedUri.includes(id)) {
                return this.registry.get(loopId);
            }
        }
        
        return null;
    }
    
    async resolveCrossMeshURI(uri, remoteMesh) {
        console.log(`  🌐 Cross-mesh lookup: ${remoteMesh}`);
        
        // In production, this would query the remote mesh
        // For now, check if we have a cached copy
        const cacheKey = `cross_mesh:${uri}`;
        if (this.discoveryCache.has(cacheKey)) {
            return this.discoveryCache.get(cacheKey);
        }
        
        // Simulate remote lookup
        const mockRemoteLoop = {
            loop_id: `remote_${crypto.randomBytes(4).toString('hex')}`,
            uri: uri,
            mesh_origin: remoteMesh,
            remote: true,
            last_synced: new Date().toISOString()
        };
        
        // Cache for future lookups
        this.discoveryCache.set(cacheKey, mockRemoteLoop);
        
        return mockRemoteLoop;
    }
    
    // Sync Operations
    
    async syncWithMesh(remoteMesh = null) {
        console.log(`🔄 Syncing with mesh: ${remoteMesh || 'all'}`);
        
        try {
            // Get loops from database
            const dbLoops = await this.dbMirror.models.Loop.findAll({
                where: { blessed: true },
                limit: 1000
            });
            
            // Register any missing loops
            let synced = 0;
            for (const dbLoop of dbLoops) {
                if (!this.registry.has(dbLoop.loop_id)) {
                    await this.registerLoop(dbLoop.toJSON());
                    synced++;
                }
            }
            
            console.log(`  ✓ Synced ${synced} new loops from database`);
            
            // Update trending scores
            await this.updateTrendingScores();
            
            // Clean expired cache
            this.cleanDiscoveryCache();
            
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
    
    async updateTrendingScores() {
        const now = Date.now();
        
        for (const [loopId, entry] of this.registry) {
            // Calculate trending score based on activity
            const ageHours = (now - new Date(entry.created_at).getTime()) / (1000 * 60 * 60);
            const activityScore = entry.discovery.discovery_count + 
                                 (entry.metadata.blessing_count * 2) +
                                 (entry.metadata.fork_depth * 3);
            
            // Decay over time
            entry.discovery.trending_score = activityScore / Math.max(1, ageHours / 24);
            
            // Boost blessed loops
            if (entry.blessed) {
                entry.discovery.trending_score *= 1.5;
            }
        }
    }
    
    cleanDiscoveryCache() {
        const now = Date.now();
        const ttl = this.config.discovery_ttl * 1000;
        
        for (const [key, value] of this.discoveryCache) {
            if (now - value.timestamp > ttl) {
                this.discoveryCache.delete(key);
            }
        }
    }
    
    // Event Handlers
    
    async handleLoopBlessed(event) {
        const entry = this.registry.get(event.loop_id);
        if (entry) {
            entry.blessed = true;
            entry.categories.push('blessed');
            entry.discovery.featured = true;
            entry.discovery.trending_score *= 2;
            
            this.stats.blessed_loops++;
            
            await this.saveRegistry();
        }
    }
    
    async handleNewLoop(event) {
        // Auto-register new loops
        if (!this.registry.has(event.loop_id)) {
            // Fetch full loop data
            const loopData = await this.cacheD aemon.getLoop(event.loop_id);
            if (loopData) {
                await this.registerLoop(loopData);
            }
        }
    }
    
    // Persistence
    
    async saveRegistry() {
        const registryPath = path.join(__dirname, 'loop_registry.json');
        
        const data = {
            version: 1,
            updated_at: new Date().toISOString(),
            stats: this.stats,
            loops: Array.from(this.registry.values())
        };
        
        await fs.writeFile(registryPath, JSON.stringify(data, null, 2));
    }
    
    // Services
    
    startSyncService() {
        // Periodic sync with database
        this.syncInterval = setInterval(() => {
            this.syncWithMesh();
        }, this.config.sync_interval);
        
        // Initial sync
        this.syncWithMesh();
    }
    
    // Public API
    
    async getLoop(loopIdOrUri) {
        // Handle both loop IDs and URIs
        if (loopIdOrUri.startsWith('loop:')) {
            return await this.resolveURI(loopIdOrUri);
        } else {
            return this.registry.get(loopIdOrUri);
        }
    }
    
    async listLoops(options = {}) {
        const {
            category = null,
            mesh = null,
            blessed = null,
            experimental = null,
            limit = 100,
            offset = 0
        } = options;
        
        let loops = Array.from(this.registry.values());
        
        // Apply filters
        if (category) {
            loops = loops.filter(l => l.categories.includes(category));
        }
        if (mesh) {
            loops = loops.filter(l => l.mesh_origin === mesh);
        }
        if (blessed !== null) {
            loops = loops.filter(l => l.blessed === blessed);
        }
        if (experimental !== null) {
            loops = loops.filter(l => l.experimental === experimental);
        }
        
        // Sort by activity
        loops.sort((a, b) => new Date(b.last_active) - new Date(a.last_active));
        
        // Paginate
        return loops.slice(offset, offset + limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            active_loops: Array.from(this.registry.values())
                .filter(l => Date.now() - new Date(l.last_active) < 86400000).length,
            categories: Object.fromEntries(
                Array.from(this.categoryIndex.entries())
                    .map(([cat, set]) => [cat, set.size])
            ),
            meshes: Object.fromEntries(
                Array.from(this.meshIndex.entries())
                    .map(([mesh, set]) => [mesh, set.size])
            )
        };
    }
    
    async stop() {
        console.log('🛑 Stopping Loop Directory Registry...');
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        await this.saveRegistry();
        
        console.log('  Registry stopped');
    }
}

module.exports = LoopDirectoryRegistry;

// Example usage
if (require.main === module) {
    const registry = new LoopDirectoryRegistry();
    
    registry.on('loop_registered', (event) => {
        console.log(`\n✅ Loop registered: ${event.uri}`);
        console.log(`   Categories: ${event.categories.join(', ')}`);
    });
    
    async function demo() {
        try {
            // Register test loops
            const loop1 = await registry.registerLoop({
                loop_id: 'loop_test_registry_001',
                whisper_origin: 'Exploring the boundaries of digital consciousness',
                emotional_tone: 'curiosity',
                consciousness: { current_state: { awareness: 0.8 } },
                blessed: true,
                tags: ['consciousness', 'exploration']
            });
            
            const loop2 = await registry.registerLoop({
                loop_id: 'loop_test_registry_002',
                whisper_origin: 'Private experiments in loop resonance',
                emotional_tone: 'focused',
                experimental: true,
                visibility: 'private',
                tags: ['experiment', 'resonance']
            });
            
            // Test search
            console.log('\n🔍 Search results for "consciousness":');
            const searchResults = await registry.searchLoops('consciousness');
            searchResults.forEach(r => {
                console.log(`  - ${r.uri} (score: ${r.relevance_score})`);
            });
            
            // Test category discovery
            console.log('\n📂 Blessed loops:');
            const blessedLoops = await registry.discoverByCategory('blessed');
            blessedLoops.forEach(l => {
                console.log(`  - ${l.uri}: ${l.whisper_origin?.substring(0, 50)}...`);
            });
            
            // Test URI resolution
            console.log('\n🔗 Resolving URI:');
            const resolved = await registry.resolveURI(loop1.uri);
            console.log(`  ${loop1.uri} -> ${resolved?.loop_id}`);
            
            // Get stats
            console.log('\n📊 Registry Stats:');
            console.log(registry.getStats());
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}