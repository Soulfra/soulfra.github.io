/**
 * Production Database
 * 
 * Handles persistent storage for the sovereign agent platform.
 * Stores agents, marketplaces, revenue transactions, and system data.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProductionDatabase {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'data', 'database');
        this.connected = false;
        
        // Database tables (using JSON files for simplicity)
        this.tables = {
            agents: new Map(),
            marketplaces: new Map(),
            revenue_transactions: new Map(),
            agent_deployments: new Map(),
            backup_metadata: new Map(),
            arweave_transactions: new Map(),
            user_sessions: new Map(),
            system_config: new Map()
        };
        
        // Database statistics
        this.stats = {
            total_records: 0,
            total_size: 0,
            last_backup: null,
            last_migration: null,
            connections: 1
        };
        
        // Ensure database directory exists
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
    }
    
    /**
     * Initialize database
     */
    async initialize() {
        try {
            console.log('🗄️  Initializing production database...');
            
            // Load existing data
            await this.loadAllTables();
            
            // Run any pending migrations
            await this.runMigrations();
            
            // Start auto-save
            this.startAutoSave();
            
            this.connected = true;
            console.log('✅ Production database initialized');
            
            return {
                connected: true,
                tables: Object.keys(this.tables).length,
                records: this.stats.total_records
            };
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Store agent data
     */
    async storeAgent(agent) {
        const agentRecord = {
            id: agent.id,
            name: agent.name,
            creator: agent.creator,
            created: agent.created || Date.now(),
            
            identity: agent.identity,
            ownership: agent.ownership,
            capabilities: agent.capabilities,
            personality: agent.personality,
            
            state: agent.state,
            wallet: agent.wallet,
            sovereign: agent.sovereign,
            
            // Database metadata
            stored_at: Date.now(),
            updated_at: Date.now(),
            version: 1
        };
        
        this.tables.agents.set(agent.id, agentRecord);
        await this.saveTable('agents');
        
        console.log(`💾 Stored agent: ${agent.id}`);
        return agentRecord;
    }
    
    /**
     * Store marketplace data
     */
    async storeMarketplace(marketplace) {
        const marketplaceRecord = {
            id: marketplace.id,
            domain: marketplace.domain,
            name: marketplace.name,
            type: marketplace.type,
            tier: marketplace.tier,
            
            approved: marketplace.approved,
            approved_at: marketplace.approvedAt,
            features: marketplace.features,
            
            api_key: marketplace.apiKey,
            metrics: marketplace.metrics,
            
            // Database metadata
            stored_at: Date.now(),
            updated_at: Date.now(),
            version: 1
        };
        
        this.tables.marketplaces.set(marketplace.id, marketplaceRecord);
        await this.saveTable('marketplaces');
        
        console.log(`💾 Stored marketplace: ${marketplace.id}`);
        return marketplaceRecord;
    }
    
    /**
     * Store revenue transaction
     */
    async storeRevenueTransaction(transaction) {
        const revenueRecord = {
            id: transaction.id,
            agent_id: transaction.agent_id,
            marketplace_id: transaction.marketplace_id,
            
            gross_amount: transaction.gross_amount || transaction.amount,
            splits: transaction.splits,
            type: transaction.type,
            
            metadata: transaction.metadata,
            agent_signature: transaction.agent_signature || transaction.agentSignature,
            
            // Database metadata
            stored_at: Date.now(),
            processed_at: transaction.timestamp,
            version: 1
        };
        
        this.tables.revenue_transactions.set(transaction.id, revenueRecord);
        await this.saveTable('revenue_transactions');
        
        console.log(`💾 Stored revenue transaction: ${transaction.id}`);
        return revenueRecord;
    }
    
    /**
     * Store agent deployment
     */
    async storeAgentDeployment(deployment) {
        const deploymentRecord = {
            id: deployment.id,
            agent_id: deployment.agent_id,
            marketplace_id: deployment.marketplace_id,
            
            config: deployment.config,
            autonomy_level: deployment.autonomy_level,
            access_token: deployment.access_token,
            
            status: deployment.status,
            health: deployment.health,
            metrics: deployment.metrics,
            
            // Database metadata
            deployed_at: deployment.deployed_at,
            stored_at: Date.now(),
            updated_at: Date.now(),
            version: 1
        };
        
        this.tables.agent_deployments.set(deployment.id, deploymentRecord);
        await this.saveTable('agent_deployments');
        
        console.log(`💾 Stored agent deployment: ${deployment.id}`);
        return deploymentRecord;
    }
    
    /**
     * Store backup metadata
     */
    async storeBackupMetadata(backup) {
        const backupRecord = {
            backup_id: backup.backup_id,
            path: backup.path,
            size: backup.size,
            files: backup.files,
            manifest: backup.manifest,
            
            // Database metadata
            created_at: Date.now(),
            stored_at: Date.now(),
            version: 1
        };
        
        this.tables.backup_metadata.set(backup.backup_id, backupRecord);
        await this.saveTable('backup_metadata');
        
        console.log(`💾 Stored backup metadata: ${backup.backup_id}`);
        return backupRecord;
    }
    
    /**
     * Store Arweave transaction
     */
    async storeArweaveTransaction(transaction) {
        const arweaveRecord = {
            transaction_id: transaction.transaction_id,
            data_type: transaction.type,
            size: transaction.size,
            cost: transaction.cost,
            
            status: transaction.status || 'pending',
            created_at: transaction.created || Date.now(),
            
            // Database metadata
            stored_at: Date.now(),
            version: 1
        };
        
        this.tables.arweave_transactions.set(transaction.transaction_id, arweaveRecord);
        await this.saveTable('arweave_transactions');
        
        console.log(`💾 Stored Arweave transaction: ${transaction.transaction_id}`);
        return arweaveRecord;
    }
    
    /**
     * Get agent by ID
     */
    async getAgent(agentId) {
        return this.tables.agents.get(agentId);
    }
    
    /**
     * Get all agents
     */
    async getAllAgents() {
        return Array.from(this.tables.agents.values());
    }
    
    /**
     * Get marketplace by ID
     */
    async getMarketplace(marketplaceId) {
        return this.tables.marketplaces.get(marketplaceId);
    }
    
    /**
     * Get all marketplaces
     */
    async getAllMarketplaces() {
        return Array.from(this.tables.marketplaces.values());
    }
    
    /**
     * Get agent deployment
     */
    async getAgentDeployment(agentId) {
        return Array.from(this.tables.agent_deployments.values())
            .filter(d => d.agent_id === agentId);
    }
    
    /**
     * Get agent metrics
     */
    async getAgentMetrics(agentId) {
        const deployments = await this.getAgentDeployment(agentId);
        const transactions = Array.from(this.tables.revenue_transactions.values())
            .filter(t => t.agent_id === agentId);
        
        return {
            deployments: deployments.length,
            total_revenue: transactions.reduce((sum, t) => sum + t.gross_amount, 0),
            transactions: transactions.length,
            last_activity: Math.max(...transactions.map(t => t.processed_at))
        };
    }
    
    /**
     * Get recent transactions
     */
    async getRecentTransactions(hours = 24) {
        const since = Date.now() - (hours * 60 * 60 * 1000);
        
        return Array.from(this.tables.revenue_transactions.values())
            .filter(t => t.processed_at > since)
            .sort((a, b) => b.processed_at - a.processed_at);
    }
    
    /**
     * Get revenue analytics
     */
    async getRevenueAnalytics() {
        const transactions = Array.from(this.tables.revenue_transactions.values());
        
        const analytics = {
            total_transactions: transactions.length,
            total_revenue: transactions.reduce((sum, t) => sum + t.gross_amount, 0),
            
            by_agent: new Map(),
            by_marketplace: new Map(),
            by_day: new Map(),
            
            average_transaction: 0,
            revenue_growth: 0
        };
        
        // Calculate by agent
        transactions.forEach(t => {
            const agentRevenue = analytics.by_agent.get(t.agent_id) || 0;
            analytics.by_agent.set(t.agent_id, agentRevenue + t.gross_amount);
        });
        
        // Calculate by marketplace
        transactions.forEach(t => {
            const marketplaceRevenue = analytics.by_marketplace.get(t.marketplace_id) || 0;
            analytics.by_marketplace.set(t.marketplace_id, marketplaceRevenue + t.gross_amount);
        });
        
        // Calculate by day
        transactions.forEach(t => {
            const day = new Date(t.processed_at).toDateString();
            const dayRevenue = analytics.by_day.get(day) || 0;
            analytics.by_day.set(day, dayRevenue + t.gross_amount);
        });
        
        analytics.average_transaction = analytics.total_revenue / Math.max(analytics.total_transactions, 1);
        
        return analytics;
    }
    
    /**
     * Run database migrations
     */
    async runMigrations() {
        try {
            console.log('🔄 Running database migrations...');
            
            // Migration 1: Add version fields
            await this.migration_001_add_versions();
            
            // Migration 2: Update agent structure
            await this.migration_002_update_agents();
            
            // Migration 3: Add indexes
            await this.migration_003_add_indexes();
            
            this.stats.last_migration = Date.now();
            console.log('✅ Database migrations completed');
            
        } catch (error) {
            console.error('❌ Database migration failed:', error);
            throw error;
        }
    }
    
    async migration_001_add_versions() {
        // Add version field to all records
        for (const [tableName, table] of Object.entries(this.tables)) {
            if (table instanceof Map) {
                for (const [key, record] of table.entries()) {
                    if (!record.version) {
                        record.version = 1;
                        record.migrated_at = Date.now();
                    }
                }
            }
        }
    }
    
    async migration_002_update_agents() {
        // Update agent structure for new features
        for (const [agentId, agent] of this.tables.agents.entries()) {
            if (!agent.sovereign) {
                agent.sovereign = {
                    sovereignId: agent.identity?.sovereignId || null,
                    agentId: agentId,
                    vaultPath: null,
                    traceToken: null
                };
            }
        }
    }
    
    async migration_003_add_indexes() {
        // Create indexes for faster queries (in a real DB, this would create actual indexes)
        this.indexes = {
            agents_by_creator: new Map(),
            transactions_by_agent: new Map(),
            deployments_by_marketplace: new Map()
        };
        
        // Build indexes
        this.tables.agents.forEach((agent, id) => {
            if (!this.indexes.agents_by_creator.has(agent.creator)) {
                this.indexes.agents_by_creator.set(agent.creator, []);
            }
            this.indexes.agents_by_creator.get(agent.creator).push(id);
        });
        
        this.tables.revenue_transactions.forEach((tx, id) => {
            if (!this.indexes.transactions_by_agent.has(tx.agent_id)) {
                this.indexes.transactions_by_agent.set(tx.agent_id, []);
            }
            this.indexes.transactions_by_agent.get(tx.agent_id).push(id);
        });
    }
    
    /**
     * Create database backup
     */
    async createBackup() {
        try {
            const backupId = 'db-backup-' + Date.now();
            const backupPath = path.join(this.dbPath, 'backups', backupId);
            
            if (!fs.existsSync(path.dirname(backupPath))) {
                fs.mkdirSync(path.dirname(backupPath), { recursive: true });
            }
            
            // Ensure backup directory itself exists
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }
            
            // Save all tables
            for (const [tableName, table] of Object.entries(this.tables)) {
                if (table instanceof Map) {
                    const tableData = Array.from(table.entries());
                    const tablePath = path.join(backupPath, `${tableName}.json`);
                    fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2));
                }
            }
            
            // Save metadata
            const metadata = {
                backup_id: backupId,
                created: Date.now(),
                stats: this.stats,
                tables: Object.keys(this.tables).length,
                records: this.stats.total_records
            };
            
            fs.writeFileSync(path.join(backupPath, 'metadata.json'), JSON.stringify(metadata, null, 2));
            
            this.stats.last_backup = Date.now();
            console.log(`✅ Database backup created: ${backupId}`);
            
            return {
                backup_id: backupId,
                path: backupPath,
                size: this.getDirectorySize(backupPath),
                metadata: metadata
            };
            
        } catch (error) {
            console.error('❌ Database backup failed:', error);
            throw error;
        }
    }
    
    /**
     * Load all tables from disk
     */
    async loadAllTables() {
        for (const tableName of Object.keys(this.tables)) {
            await this.loadTable(tableName);
        }
        
        this.updateStats();
    }
    
    /**
     * Load specific table
     */
    async loadTable(tableName) {
        try {
            const tablePath = path.join(this.dbPath, `${tableName}.json`);
            
            if (fs.existsSync(tablePath)) {
                const data = JSON.parse(fs.readFileSync(tablePath, 'utf8'));
                
                // Convert array back to Map
                if (Array.isArray(data)) {
                    this.tables[tableName] = new Map(data);
                } else {
                    // Handle old format
                    this.tables[tableName] = new Map(Object.entries(data));
                }
                
                console.log(`📖 Loaded table: ${tableName} (${this.tables[tableName].size} records)`);
            }
            
        } catch (error) {
            console.warn(`⚠️ Failed to load table ${tableName}:`, error.message);
            this.tables[tableName] = new Map();
        }
    }
    
    /**
     * Save specific table
     */
    async saveTable(tableName) {
        try {
            const tablePath = path.join(this.dbPath, `${tableName}.json`);
            const tableData = Array.from(this.tables[tableName].entries());
            
            fs.writeFileSync(tablePath, JSON.stringify(tableData, null, 2));
            this.updateStats();
            
        } catch (error) {
            console.error(`❌ Failed to save table ${tableName}:`, error);
            throw error;
        }
    }
    
    /**
     * Start auto-save process
     */
    startAutoSave() {
        // Save all tables every 5 minutes
        setInterval(async () => {
            try {
                for (const tableName of Object.keys(this.tables)) {
                    await this.saveTable(tableName);
                }
                console.log('💾 Auto-save completed');
            } catch (error) {
                console.error('❌ Auto-save failed:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    /**
     * Update database statistics
     */
    updateStats() {
        this.stats.total_records = Object.values(this.tables)
            .reduce((sum, table) => sum + (table instanceof Map ? table.size : 0), 0);
        
        this.stats.total_size = this.getDirectorySize(this.dbPath);
    }
    
    /**
     * Get database status
     */
    getStatus() {
        return {
            connected: this.connected,
            tables: Object.keys(this.tables).length,
            records: this.stats.total_records,
            size: this.stats.total_size
        };
    }
    
    /**
     * Get detailed database status
     */
    async getDetailedStatus() {
        const tableStats = {};
        
        for (const [tableName, table] of Object.entries(this.tables)) {
            if (table instanceof Map) {
                tableStats[tableName] = {
                    records: table.size,
                    last_updated: Date.now() // Would track actual last update in production
                };
            }
        }
        
        return {
            ...this.getStatus(),
            stats: this.stats,
            tables: tableStats,
            indexes: this.indexes ? Object.keys(this.indexes).length : 0
        };
    }
    
    /**
     * Check if database is healthy
     */
    async isHealthy() {
        try {
            // Check if we can read/write
            const testPath = path.join(this.dbPath, 'health_check.json');
            fs.writeFileSync(testPath, JSON.stringify({ test: Date.now() }));
            fs.unlinkSync(testPath);
            
            return true;
        } catch (error) {
            console.error('❌ Database health check failed:', error);
            return false;
        }
    }
    
    /**
     * Get connection count
     */
    async getConnectionCount() {
        return this.stats.connections;
    }
    
    /**
     * Utility methods
     */
    getDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const files = fs.readdirSync(dirPath);
            
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    totalSize += this.getDirectorySize(filePath);
                } else {
                    totalSize += stats.size;
                }
            });
        } catch (error) {
            // Directory might not exist
        }
        
        return totalSize;
    }
}

module.exports = ProductionDatabase;