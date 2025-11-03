#!/usr/bin/env node
/**
 * PostgreSQL Loop Mirror
 * Production-ready normalized database for loops, agents, and analytics
 */

const { EventEmitter } = require('events');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Try to use existing database config if available
let databaseConfig;
try {
    databaseConfig = require('../../billion-dollar-game/backend/src/config/database');
} catch (error) {
    console.log('Using local database configuration');
    databaseConfig = null;
}

class PostgresLoopMirror extends EventEmitter {
    constructor() {
        super();
        
        // Use existing sequelize instance or create new one
        if (databaseConfig && databaseConfig.sequelize) {
            this.sequelize = databaseConfig.sequelize;
            console.log('✅ Using existing database connection');
        } else {
            // Fallback configuration
            this.sequelize = new Sequelize({
                dialect: 'postgres',
                host: process.env.PG_HOST || 'localhost',
                port: process.env.PG_PORT || 5432,
                database: process.env.PG_DATABASE || 'soulfra',
                username: process.env.PG_USER || 'postgres',
                password: process.env.PG_PASSWORD || 'postgres',
                logging: process.env.NODE_ENV === 'development' ? console.log : false,
                pool: {
                    max: 20,
                    min: 5,
                    acquire: 30000,
                    idle: 10000
                }
            });
        }
        
        // Models storage
        this.models = {};
        
        // Sync status
        this.syncStatus = {
            loops_synced: 0,
            agents_synced: 0,
            whispers_synced: 0,
            blessings_synced: 0,
            clusters_synced: 0,
            last_sync: null,
            errors: 0
        };
        
        this.defineModels();
    }
    
    defineModels() {
        // Loop Model
        this.models.Loop = this.sequelize.define('Loop', {
            loop_id: {
                type: DataTypes.STRING(100),
                primaryKey: true,
                allowNull: false
            },
            creator_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            whisper_origin: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            consciousness_state: {
                type: DataTypes.JSONB,
                defaultValue: {
                    awareness: 0,
                    resonance: 0,
                    coherence: 0
                }
            },
            emotional_tone: {
                type: DataTypes.STRING(50),
                defaultValue: 'neutral',
                index: true
            },
            blessed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
                index: true
            },
            blessing_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            fork_parent: {
                type: DataTypes.STRING(100),
                allowNull: true,
                references: {
                    model: 'Loops',
                    key: 'loop_id'
                }
            },
            fork_depth: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            drift_rating: {
                type: DataTypes.DECIMAL(5, 2),
                defaultValue: 0.0
            },
            total_events: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            last_active: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        }, {
            tableName: 'loops',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['created_at'] },
                { fields: ['emotional_tone'] },
                { fields: ['drift_rating'] },
                { fields: ['fork_parent'] }
            ]
        });
        
        // Agent Model
        this.models.Agent = this.sequelize.define('Agent', {
            agent_id: {
                type: DataTypes.STRING(100),
                primaryKey: true,
                allowNull: false
            },
            owner_id: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            archetype: {
                type: DataTypes.STRING(50),
                defaultValue: 'wanderer',
                index: true
            },
            current_tone: {
                type: DataTypes.STRING(50),
                defaultValue: 'neutral',
                index: true
            },
            consciousness_score: {
                type: DataTypes.DECIMAL(3, 2),
                defaultValue: 0.0
            },
            memory_depth: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            reflection_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            transformation_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            whisper_origin: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            current_role: {
                type: DataTypes.STRING(50),
                defaultValue: 'observer'
            },
            guild_affiliations: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            performance_metrics: {
                type: DataTypes.JSONB,
                defaultValue: {
                    tasks_completed: 0,
                    accuracy_rate: 0,
                    creativity_score: 0
                }
            }
        }, {
            tableName: 'agents',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['archetype'] },
                { fields: ['current_tone'] },
                { fields: ['consciousness_score'] }
            ]
        });
        
        // Whisper Model
        this.models.Whisper = this.sequelize.define('Whisper', {
            whisper_id: {
                type: DataTypes.STRING(100),
                primaryKey: true,
                defaultValue: () => `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            },
            text: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            source: {
                type: DataTypes.STRING(50),
                defaultValue: 'unknown'
            },
            emotional_tone: {
                type: DataTypes.STRING(50),
                defaultValue: 'neutral'
            },
            depth_score: {
                type: DataTypes.DECIMAL(3, 2),
                defaultValue: 0.5
            },
            spawned_loops: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            spawned_agents: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            prophecy_alignment: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            processed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            tableName: 'whispers',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['created_at'] },
                { fields: ['emotional_tone'] },
                { fields: ['processed'] }
            ]
        });
        
        // Blessing Model
        this.models.Blessing = this.sequelize.define('Blessing', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            loop_id: {
                type: DataTypes.STRING(100),
                allowNull: false,
                references: {
                    model: 'loops',
                    key: 'loop_id'
                }
            },
            blessed_by: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
            blessing_type: {
                type: DataTypes.STRING(50),
                defaultValue: 'standard'
            },
            consensus_score: {
                type: DataTypes.DECIMAL(3, 2),
                defaultValue: 0.0
            },
            ritual_participants: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            energy_transferred: {
                type: DataTypes.DECIMAL(10, 2),
                defaultValue: 0.0
            },
            blessing_text: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            metadata: {
                type: DataTypes.JSONB,
                defaultValue: {}
            }
        }, {
            tableName: 'blessings',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['loop_id'] },
                { fields: ['blessed_by'] },
                { fields: ['created_at'] }
            ]
        });
        
        // Cluster Model
        this.models.Cluster = this.sequelize.define('Cluster', {
            cluster_id: {
                type: DataTypes.STRING(100),
                primaryKey: true,
                allowNull: false
            },
            tone_root: {
                type: DataTypes.STRING(50),
                allowNull: false,
                index: true
            },
            archetype_dominant: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            entity_count: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            consciousness_average: {
                type: DataTypes.DECIMAL(3, 2),
                defaultValue: 0.0
            },
            resonance_collective: {
                type: DataTypes.DECIMAL(3, 2),
                defaultValue: 0.0
            },
            entity_members: {
                type: DataTypes.JSONB,
                defaultValue: []
            },
            mythology: {
                type: DataTypes.JSONB,
                allowNull: true
            },
            active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            dissolved_at: {
                type: DataTypes.DATE,
                allowNull: true
            }
        }, {
            tableName: 'clusters',
            timestamps: true,
            underscored: true,
            indexes: [
                { fields: ['tone_root'] },
                { fields: ['active'] }
            ]
        });
        
        // Analytics Model
        this.models.Analytics = this.sequelize.define('Analytics', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            metric_type: {
                type: DataTypes.STRING(50),
                allowNull: false,
                index: true
            },
            entity_type: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            entity_id: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            value: {
                type: DataTypes.DECIMAL(10, 4),
                allowNull: false
            },
            dimensions: {
                type: DataTypes.JSONB,
                defaultValue: {}
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
                index: true
            }
        }, {
            tableName: 'analytics',
            timestamps: false,
            indexes: [
                { fields: ['metric_type', 'timestamp'] },
                { fields: ['entity_type', 'entity_id'] }
            ]
        });
        
        // Define associations
        this.defineAssociations();
    }
    
    defineAssociations() {
        const { Loop, Agent, Blessing, Whisper } = this.models;
        
        // Loop associations
        Loop.hasMany(Blessing, { foreignKey: 'loop_id', as: 'blessings' });
        Loop.belongsTo(Loop, { foreignKey: 'fork_parent', as: 'parent' });
        Loop.hasMany(Loop, { foreignKey: 'fork_parent', as: 'forks' });
        
        // Blessing associations
        Blessing.belongsTo(Loop, { foreignKey: 'loop_id' });
        
        // Many-to-many relationships would go here if needed
    }
    
    async initialize() {
        console.log('🔄 Initializing PostgreSQL Loop Mirror...');
        
        try {
            // Test connection
            await this.sequelize.authenticate();
            console.log('✅ Database connection established');
            
            // Sync models (create tables if not exist)
            if (process.env.DB_SYNC === 'true') {
                await this.sequelize.sync({ alter: true });
                console.log('✅ Database models synchronized');
            }
            
            // Create materialized views for analytics
            await this.createMaterializedViews();
            
            console.log('✅ PostgreSQL Mirror ready');
        } catch (error) {
            console.error('❌ Failed to initialize PostgreSQL Mirror:', error);
            throw error;
        }
    }
    
    async createMaterializedViews() {
        try {
            // Loop activity view
            await this.sequelize.query(`
                CREATE MATERIALIZED VIEW IF NOT EXISTS loop_activity_summary AS
                SELECT 
                    DATE_TRUNC('hour', created_at) as hour,
                    emotional_tone,
                    COUNT(*) as loop_count,
                    AVG(drift_rating) as avg_drift,
                    AVG((consciousness_state->>'awareness')::float) as avg_awareness
                FROM loops
                GROUP BY hour, emotional_tone
                ORDER BY hour DESC;
            `);
            
            // Agent performance view
            await this.sequelize.query(`
                CREATE MATERIALIZED VIEW IF NOT EXISTS agent_performance_summary AS
                SELECT 
                    archetype,
                    current_tone,
                    COUNT(*) as agent_count,
                    AVG(consciousness_score) as avg_consciousness,
                    AVG(memory_depth) as avg_memory_depth,
                    SUM(reflection_count) as total_reflections
                FROM agents
                GROUP BY archetype, current_tone;
            `);
            
            console.log('  ✓ Materialized views created');
        } catch (error) {
            console.log('  ⚠️  Materialized views may already exist');
        }
    }
    
    // Mirror Operations
    
    async mirrorLoop(loopData) {
        try {
            const [loop, created] = await this.models.Loop.findOrCreate({
                where: { loop_id: loopData.loop_id },
                defaults: {
                    creator_id: loopData.creator_id,
                    whisper_origin: loopData.whisper_origin,
                    consciousness_state: loopData.consciousness?.current_state || {},
                    emotional_tone: loopData.emotional_tone || loopData.tone,
                    blessed: loopData.blessed || false,
                    blessing_count: loopData.blessings?.length || 0,
                    fork_parent: loopData.fork_parent,
                    fork_depth: loopData.fork_depth || 0,
                    drift_rating: loopData.drift_rating || 0,
                    total_events: loopData.events?.length || 0,
                    metadata: {
                        origin_type: loopData.origin_type,
                        tags: loopData.tags || [],
                        custom: loopData.custom_metadata || {}
                    }
                }
            });
            
            if (!created) {
                // Update existing loop
                await loop.update({
                    consciousness_state: loopData.consciousness?.current_state || loop.consciousness_state,
                    emotional_tone: loopData.emotional_tone || loopData.tone || loop.emotional_tone,
                    blessed: loopData.blessed || loop.blessed,
                    blessing_count: loopData.blessings?.length || loop.blessing_count,
                    drift_rating: loopData.drift_rating || loop.drift_rating,
                    total_events: loopData.events?.length || loop.total_events,
                    last_active: new Date()
                });
            }
            
            this.syncStatus.loops_synced++;
            this.emit('loop_mirrored', { loop_id: loopData.loop_id, created });
            
            // Track analytics
            await this.trackAnalytics('loop_sync', 'loop', loopData.loop_id, 1, {
                created,
                emotional_tone: loop.emotional_tone
            });
            
            return loop;
        } catch (error) {
            console.error('Error mirroring loop:', error);
            this.syncStatus.errors++;
            throw error;
        }
    }
    
    async mirrorAgent(agentData) {
        try {
            const [agent, created] = await this.models.Agent.findOrCreate({
                where: { agent_id: agentData.agent_id },
                defaults: {
                    owner_id: agentData.owner_id,
                    archetype: agentData.archetype || 'wanderer',
                    current_tone: agentData.current_tone || agentData.tone,
                    consciousness_score: agentData.consciousness_score || 0,
                    memory_depth: agentData.memory_depth || 0,
                    reflection_count: agentData.reflection_count || 0,
                    transformation_count: agentData.transformations || 0,
                    whisper_origin: agentData.whisper_origin,
                    current_role: agentData.current_role || 'observer',
                    guild_affiliations: agentData.guilds || [],
                    performance_metrics: agentData.performance_metrics || {}
                }
            });
            
            if (!created) {
                // Update existing agent
                await agent.update({
                    current_tone: agentData.current_tone || agentData.tone || agent.current_tone,
                    consciousness_score: agentData.consciousness_score || agent.consciousness_score,
                    memory_depth: agentData.memory_depth || agent.memory_depth,
                    reflection_count: agentData.reflection_count || agent.reflection_count,
                    current_role: agentData.current_role || agent.current_role,
                    guild_affiliations: agentData.guilds || agent.guild_affiliations
                });
            }
            
            this.syncStatus.agents_synced++;
            this.emit('agent_mirrored', { agent_id: agentData.agent_id, created });
            
            return agent;
        } catch (error) {
            console.error('Error mirroring agent:', error);
            this.syncStatus.errors++;
            throw error;
        }
    }
    
    async mirrorWhisper(whisperData) {
        try {
            const whisper = await this.models.Whisper.create({
                text: whisperData.text,
                source: whisperData.source || 'unknown',
                emotional_tone: whisperData.emotional_tone || whisperData.tone || 'neutral',
                depth_score: whisperData.depth_score || 0.5,
                spawned_loops: whisperData.spawned_loops || [],
                spawned_agents: whisperData.spawned_agents || [],
                prophecy_alignment: whisperData.prophecy_alignment,
                processed: whisperData.processed || false
            });
            
            this.syncStatus.whispers_synced++;
            this.emit('whisper_mirrored', { whisper_id: whisper.whisper_id });
            
            return whisper;
        } catch (error) {
            console.error('Error mirroring whisper:', error);
            this.syncStatus.errors++;
            throw error;
        }
    }
    
    async mirrorBlessing(blessingData) {
        try {
            const blessing = await this.models.Blessing.create({
                loop_id: blessingData.loop_id,
                blessed_by: blessingData.blessed_by,
                blessing_type: blessingData.blessing_type || 'standard',
                consensus_score: blessingData.consensus_score || 0,
                ritual_participants: blessingData.participants || [],
                energy_transferred: blessingData.energy || 0,
                blessing_text: blessingData.text,
                metadata: blessingData.metadata || {}
            });
            
            // Update loop blessing count
            await this.models.Loop.increment('blessing_count', {
                where: { loop_id: blessingData.loop_id }
            });
            
            this.syncStatus.blessings_synced++;
            this.emit('blessing_mirrored', { blessing_id: blessing.id });
            
            return blessing;
        } catch (error) {
            console.error('Error mirroring blessing:', error);
            this.syncStatus.errors++;
            throw error;
        }
    }
    
    async mirrorCluster(clusterData) {
        try {
            const [cluster, created] = await this.models.Cluster.findOrCreate({
                where: { cluster_id: clusterData.cluster_id },
                defaults: {
                    tone_root: clusterData.tone_root,
                    archetype_dominant: clusterData.archetype_dominant,
                    entity_count: clusterData.entity_count || 0,
                    consciousness_average: clusterData.consciousness_average || 0,
                    resonance_collective: clusterData.resonance_collective || 0,
                    entity_members: clusterData.entities || [],
                    mythology: clusterData.mythology,
                    active: true
                }
            });
            
            if (!created && clusterData.dissolved_at) {
                // Mark cluster as dissolved
                await cluster.update({
                    active: false,
                    dissolved_at: clusterData.dissolved_at
                });
            }
            
            this.syncStatus.clusters_synced++;
            this.emit('cluster_mirrored', { cluster_id: clusterData.cluster_id, created });
            
            return cluster;
        } catch (error) {
            console.error('Error mirroring cluster:', error);
            this.syncStatus.errors++;
            throw error;
        }
    }
    
    // Analytics Methods
    
    async trackAnalytics(metricType, entityType, entityId, value, dimensions = {}) {
        try {
            await this.models.Analytics.create({
                metric_type: metricType,
                entity_type: entityType,
                entity_id: entityId,
                value: value,
                dimensions: dimensions
            });
        } catch (error) {
            console.error('Error tracking analytics:', error);
        }
    }
    
    async getLoopAnalytics(timeframe = '24h') {
        const timeConstraint = this.getTimeConstraint(timeframe);
        
        const analytics = await this.sequelize.query(`
            SELECT 
                DATE_TRUNC('hour', created_at) as hour,
                emotional_tone,
                COUNT(*) as count,
                AVG(drift_rating) as avg_drift,
                AVG((consciousness_state->>'awareness')::float) as avg_awareness,
                COUNT(CASE WHEN blessed = true THEN 1 END) as blessed_count
            FROM loops
            WHERE created_at > :timeConstraint
            GROUP BY hour, emotional_tone
            ORDER BY hour DESC
        `, {
            replacements: { timeConstraint },
            type: this.sequelize.QueryTypes.SELECT
        });
        
        return analytics;
    }
    
    async getAgentAnalytics(timeframe = '24h') {
        const timeConstraint = this.getTimeConstraint(timeframe);
        
        const analytics = await this.sequelize.query(`
            SELECT 
                archetype,
                current_tone,
                COUNT(*) as count,
                AVG(consciousness_score) as avg_consciousness,
                AVG(memory_depth) as avg_memory,
                SUM(reflection_count) as total_reflections,
                MAX(transformation_count) as max_transformations
            FROM agents
            WHERE created_at > :timeConstraint
            GROUP BY archetype, current_tone
            ORDER BY count DESC
        `, {
            replacements: { timeConstraint },
            type: this.sequelize.QueryTypes.SELECT
        });
        
        return analytics;
    }
    
    async getDriftTrends(limit = 100) {
        const trends = await this.sequelize.query(`
            SELECT 
                DATE_TRUNC('hour', created_at) as hour,
                AVG(drift_rating) as avg_drift,
                MAX(drift_rating) as max_drift,
                MIN(drift_rating) as min_drift,
                STDDEV(drift_rating) as drift_volatility,
                COUNT(*) as sample_size
            FROM loops
            WHERE drift_rating > 0
            GROUP BY hour
            ORDER BY hour DESC
            LIMIT :limit
        `, {
            replacements: { limit },
            type: this.sequelize.QueryTypes.SELECT
        });
        
        return trends;
    }
    
    async getTopBlessedLoops(limit = 10) {
        const loops = await this.models.Loop.findAll({
            where: { blessed: true },
            order: [['blessing_count', 'DESC']],
            limit,
            include: [{
                model: this.models.Blessing,
                as: 'blessings',
                attributes: ['blessed_by', 'consensus_score', 'created_at']
            }]
        });
        
        return loops;
    }
    
    getTimeConstraint(timeframe) {
        const now = new Date();
        const constraints = {
            '1h': new Date(now - 60 * 60 * 1000),
            '24h': new Date(now - 24 * 60 * 60 * 1000),
            '7d': new Date(now - 7 * 24 * 60 * 60 * 1000),
            '30d': new Date(now - 30 * 24 * 60 * 60 * 1000)
        };
        
        return constraints[timeframe] || constraints['24h'];
    }
    
    // Bulk Sync Operations
    
    async bulkSyncFromJSON(data) {
        console.log('🔄 Starting bulk sync from JSON...');
        const startTime = Date.now();
        
        const transaction = await this.sequelize.transaction();
        
        try {
            // Sync loops
            if (data.loops && Array.isArray(data.loops)) {
                for (const loop of data.loops) {
                    await this.mirrorLoop(loop);
                }
            }
            
            // Sync agents
            if (data.agents && Array.isArray(data.agents)) {
                for (const agent of data.agents) {
                    await this.mirrorAgent(agent);
                }
            }
            
            // Sync whispers
            if (data.whispers && Array.isArray(data.whispers)) {
                for (const whisper of data.whispers) {
                    await this.mirrorWhisper(whisper);
                }
            }
            
            // Sync blessings
            if (data.blessings && Array.isArray(data.blessings)) {
                for (const blessing of data.blessings) {
                    await this.mirrorBlessing(blessing);
                }
            }
            
            // Sync clusters
            if (data.clusters && Array.isArray(data.clusters)) {
                for (const cluster of data.clusters) {
                    await this.mirrorCluster(cluster);
                }
            }
            
            await transaction.commit();
            
            const duration = Date.now() - startTime;
            this.syncStatus.last_sync = new Date();
            
            console.log(`✅ Bulk sync completed in ${duration}ms`);
            console.log(`   Loops: ${this.syncStatus.loops_synced}`);
            console.log(`   Agents: ${this.syncStatus.agents_synced}`);
            console.log(`   Whispers: ${this.syncStatus.whispers_synced}`);
            console.log(`   Blessings: ${this.syncStatus.blessings_synced}`);
            console.log(`   Clusters: ${this.syncStatus.clusters_synced}`);
            console.log(`   Errors: ${this.syncStatus.errors}`);
            
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Bulk sync failed:', error);
            throw error;
        }
    }
    
    // Maintenance Operations
    
    async refreshMaterializedViews() {
        console.log('🔄 Refreshing materialized views...');
        
        try {
            await this.sequelize.query('REFRESH MATERIALIZED VIEW loop_activity_summary');
            await this.sequelize.query('REFRESH MATERIALIZED VIEW agent_performance_summary');
            console.log('✅ Materialized views refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh views:', error);
        }
    }
    
    async vacuum() {
        console.log('🧹 Running VACUUM ANALYZE...');
        
        try {
            await this.sequelize.query('VACUUM ANALYZE loops');
            await this.sequelize.query('VACUUM ANALYZE agents');
            await this.sequelize.query('VACUUM ANALYZE whispers');
            await this.sequelize.query('VACUUM ANALYZE blessings');
            await this.sequelize.query('VACUUM ANALYZE analytics');
            console.log('✅ VACUUM completed');
        } catch (error) {
            console.error('❌ VACUUM failed:', error);
        }
    }
    
    getSyncStatus() {
        return {
            ...this.syncStatus,
            database_connected: this.sequelize.options.dialect ? true : false
        };
    }
    
    async close() {
        console.log('🛑 Closing PostgreSQL connection...');
        await this.sequelize.close();
        console.log('  Connection closed');
    }
}

module.exports = PostgresLoopMirror;

// Example usage
if (require.main === module) {
    const mirror = new PostgresLoopMirror();
    
    async function demo() {
        try {
            await mirror.initialize();
            
            // Mirror sample data
            const loop = await mirror.mirrorLoop({
                loop_id: 'loop_mirror_test_001',
                emotional_tone: 'joy',
                consciousness: {
                    current_state: {
                        awareness: 0.8,
                        resonance: 0.75,
                        coherence: 0.9
                    }
                },
                drift_rating: 25.5
            });
            
            const agent = await mirror.mirrorAgent({
                agent_id: 'agent_mirror_test_001',
                archetype: 'sage',
                current_tone: 'wisdom',
                consciousness_score: 0.85,
                memory_depth: 150
            });
            
            // Get analytics
            const loopAnalytics = await mirror.getLoopAnalytics('24h');
            console.log('\nLoop Analytics (24h):', loopAnalytics);
            
            const driftTrends = await mirror.getDriftTrends(10);
            console.log('\nDrift Trends:', driftTrends);
            
            // Sync status
            console.log('\nSync Status:', mirror.getSyncStatus());
            
        } catch (error) {
            console.error('Demo error:', error);
        } finally {
            await mirror.close();
        }
    }
    
    demo();
}