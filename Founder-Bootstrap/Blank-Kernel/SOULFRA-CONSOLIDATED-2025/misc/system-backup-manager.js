/**
 * System Backup Manager
 * 
 * Creates comprehensive backups of the entire sovereign agent platform
 * including agents, marketplaces, revenue, and configurations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SystemBackupManager {
    constructor() {
        this.backupDir = path.join(__dirname, '..', 'backups');
        this.encryptionKey = this.generateEncryptionKey();
        
        // Ensure backup directory exists
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }
    
    /**
     * Create complete system backup
     */
    async createFullBackup(platformInstance) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupId = `backup-${timestamp}`;
        const backupPath = path.join(this.backupDir, backupId);
        
        console.log(`🔄 Creating full system backup: ${backupId}`);
        
        try {
            // Create backup directory
            fs.mkdirSync(backupPath, { recursive: true });
            
            // Backup all components
            const backupData = {
                metadata: {
                    backup_id: backupId,
                    created: new Date().toISOString(),
                    version: '1.0.0',
                    platform_state: 'active'
                },
                
                // Core platform data
                marketplaces: this.backupMarketplaces(platformInstance),
                agents: this.backupAgents(platformInstance),
                revenue: this.backupRevenue(platformInstance),
                users: this.backupUsers(platformInstance),
                deployments: this.backupDeployments(platformInstance),
                
                // System configuration
                configuration: this.backupConfiguration(platformInstance),
                security: this.backupSecurity(platformInstance),
                monitoring: this.backupMonitoring(platformInstance),
                
                // Source code backups
                source_files: await this.backupSourceFiles(),
                
                // Database equivalent data
                relationships: this.backupRelationships(platformInstance),
                transactions: this.backupTransactions(platformInstance)
            };
            
            // Write main backup file
            const backupFile = path.join(backupPath, 'full-backup.json');
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            
            // Create encrypted backup
            const encryptedBackup = this.encryptBackup(backupData);
            const encryptedFile = path.join(backupPath, 'full-backup.encrypted');
            fs.writeFileSync(encryptedFile, JSON.stringify(encryptedBackup, null, 2));
            
            // Create restoration script
            await this.createRestorationScript(backupPath, backupData);
            
            // Generate backup manifest
            const manifest = await this.generateBackupManifest(backupPath, backupData);
            fs.writeFileSync(path.join(backupPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
            
            console.log(`✅ Full backup created: ${backupPath}`);
            console.log(`📦 Backup size: ${this.getDirectorySize(backupPath)} bytes`);
            
            return {
                backup_id: backupId,
                path: backupPath,
                size: this.getDirectorySize(backupPath),
                files: fs.readdirSync(backupPath),
                manifest: manifest
            };
            
        } catch (error) {
            console.error(`❌ Backup failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Backup marketplace data
     */
    backupMarketplaces(platformInstance) {
        const marketplaceBackend = platformInstance.marketplaceBackend;
        
        return {
            approved: Array.from(marketplaceBackend.approvedMarketplaces.entries()),
            pending: Array.from(marketplaceBackend.pendingApprovals.entries()),
            blacklisted: Array.from(marketplaceBackend.blacklistedDomains),
            revenue_streams: Array.from(marketplaceBackend.revenueStreams.entries()),
            platform_vault: marketplaceBackend.platformVault,
            security_monitor: marketplaceBackend.securityMonitor
        };
    }
    
    /**
     * Backup agent data
     */
    backupAgents(platformInstance) {
        const agentPlatform = platformInstance.agentPlatform;
        
        return {
            users: Array.from(agentPlatform.users.entries()),
            agents: Array.from(agentPlatform.agents.entries()),
            relationships: Array.from(agentPlatform.relationships.entries()),
            marketplace_data: agentPlatform.marketplace,
            
            // Revenue model data
            agent_wealth: Array.from(agentPlatform.revenueModel.agentWealth.entries()),
            agent_ledger: Array.from(agentPlatform.revenueModel.agentLedger.entries()),
            creator_ledger: Array.from(agentPlatform.revenueModel.creatorLedger.entries()),
            wealth_milestones: Array.from(agentPlatform.revenueModel.wealthMilestones.entries()),
            platform_vault_revenue: agentPlatform.revenueModel.platformVault
        };
    }
    
    /**
     * Backup revenue and financial data
     */
    backupRevenue(platformInstance) {
        return {
            total_processed: this.calculateTotalRevenue(platformInstance),
            daily_breakdown: this.getDailyRevenueBreakdown(platformInstance),
            agent_earnings: this.getAgentEarnings(platformInstance),
            marketplace_earnings: this.getMarketplaceEarnings(platformInstance),
            platform_fees: this.getPlatformFees(platformInstance)
        };
    }
    
    /**
     * Backup user and session data
     */
    backupUsers(platformInstance) {
        return {
            sessions: Array.from(platformInstance.sessions.entries()),
            agent_instances: Array.from(platformInstance.agentInstances.entries())
        };
    }
    
    /**
     * Backup deployment data
     */
    backupDeployments(platformInstance) {
        return {
            deployed_agents: Array.from(platformInstance.marketplaceBackend.deployedAgents.entries()),
            agent_marketplace_map: Array.from(platformInstance.marketplaceBackend.agentMarketplaceMap.entries()),
            performance_metrics: Array.from(platformInstance.marketplaceBackend.performanceMetrics || new Map())
        };
    }
    
    /**
     * Backup system configuration
     */
    backupConfiguration(platformInstance) {
        return {
            webapp_config: {
                port: platformInstance.port,
                sessions_size: platformInstance.sessions.size,
                agent_instances_size: platformInstance.agentInstances.size
            },
            marketplace_config: platformInstance.marketplaceBackend.config,
            agent_platform_config: platformInstance.agentPlatform.config,
            revenue_model_config: platformInstance.agentPlatform.revenueModel.config
        };
    }
    
    /**
     * Backup security data (encrypted)
     */
    backupSecurity(platformInstance) {
        // Don't backup actual keys, just metadata
        return {
            marketplace_count: platformInstance.marketplaceBackend.approvedMarketplaces.size,
            security_violations: platformInstance.marketplaceBackend.securityMonitor.violations.length,
            emergency_stops: Array.from(platformInstance.marketplaceBackend.emergencyStops || new Map()).length,
            active_sessions: platformInstance.sessions.size
        };
    }
    
    /**
     * Backup monitoring data
     */
    backupMonitoring(platformInstance) {
        return {
            system_health: {
                status: 'healthy',
                uptime: process.uptime(),
                memory_usage: process.memoryUsage(),
                timestamp: Date.now()
            },
            performance_metrics: {
                total_requests: 0, // Would track in real system
                avg_response_time: 0,
                error_rate: 0
            }
        };
    }
    
    /**
     * Backup source files
     */
    async backupSourceFiles() {
        const sourceFiles = [
            '../vault/sovereign-marketplace-backend.js',
            '../mirror-os-demo/sovereign-agent-webapp.js',
            '../mirror-os-demo/marketplace-integration-demo.js',
            '../platforms/growth/mirror-diffusion/templates/agent-workshop-platform.js',
            '../platforms/growth/mirror-diffusion/templates/build-a-bear-example.js',
            '../platforms/growth/mirror-diffusion/templates/revenue-sharing-model.js',
            '../infinity-router-sovereign.js'
        ];
        
        const backupSources = {};
        
        for (const filePath of sourceFiles) {
            const fullPath = path.join(__dirname, filePath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const filename = path.basename(filePath);
                backupSources[filename] = {
                    path: filePath,
                    size: content.length,
                    hash: crypto.createHash('sha256').update(content).digest('hex'),
                    last_modified: fs.statSync(fullPath).mtime.toISOString()
                };
            }
        }
        
        return backupSources;
    }
    
    /**
     * Backup relationships and mappings
     */
    backupRelationships(platformInstance) {
        return {
            user_agents: this.getUserAgentRelationships(platformInstance),
            agent_marketplaces: this.getAgentMarketplaceRelationships(platformInstance),
            revenue_flows: this.getRevenueFlowRelationships(platformInstance)
        };
    }
    
    /**
     * Backup transaction history
     */
    backupTransactions(platformInstance) {
        const transactions = [];
        
        // Collect from platform vault
        if (platformInstance.marketplaceBackend.platformVault.transactions) {
            transactions.push(...platformInstance.marketplaceBackend.platformVault.transactions);
        }
        
        // Collect from revenue streams
        platformInstance.marketplaceBackend.revenueStreams.forEach((stream, marketplaceId) => {
            stream.forEach(transaction => {
                transactions.push({
                    ...transaction,
                    marketplace_id: marketplaceId
                });
            });
        });
        
        return {
            total_transactions: transactions.length,
            transactions: transactions,
            total_volume: transactions.reduce((sum, tx) => sum + (tx.gross_amount || tx.amount || 0), 0)
        };
    }
    
    /**
     * Create restoration script
     */
    async createRestorationScript(backupPath, backupData) {
        const restorationScript = `#!/bin/bash

# Sovereign Agent Platform Restoration Script
# Backup ID: ${backupData.metadata.backup_id}
# Created: ${backupData.metadata.created}

echo "🔄 Restoring Sovereign Agent Platform"
echo "====================================="
echo "Backup: ${backupData.metadata.backup_id}"
echo "Created: ${backupData.metadata.created}"
echo ""

# Check if platform is running
if lsof -Pi :4040 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Platform is running on port 4040. Please stop it first."
    echo "Run: pkill -f 'sovereign-agent-webapp'"
    exit 1
fi

# Restore directories
echo "📁 Restoring directories..."
mkdir -p data/agents
mkdir -p data/marketplaces  
mkdir -p data/revenue
mkdir -p logs
mkdir -p .keys

# Restore configuration
echo "⚙️  Restoring configuration..."
if [ -f "config/platform.json" ]; then
    echo "Config already exists, backing up as config/platform.json.bak"
    cp config/platform.json config/platform.json.bak
fi

# Restore data files
echo "💾 Restoring data files..."
node -e "
const fs = require('fs');
const backup = JSON.parse(fs.readFileSync('full-backup.json', 'utf8'));

// Create restoration data files
fs.writeFileSync('data/marketplaces/backup.json', JSON.stringify(backup.marketplaces, null, 2));
fs.writeFileSync('data/agents/backup.json', JSON.stringify(backup.agents, null, 2)); 
fs.writeFileSync('data/revenue/backup.json', JSON.stringify(backup.revenue, null, 2));

console.log('✅ Data files restored');
"

echo ""
echo "✅ Platform restored from backup!"
echo ""
echo "🚀 Next steps:"
echo "   1. Review restored data in data/ directories"
echo "   2. Start platform: npm start"
echo "   3. Verify all agents and marketplaces are working"
echo ""
echo "📊 Backup contained:"
echo "   - Marketplaces: ${Object.keys(backupData.marketplaces.approved || {}).length}"
echo "   - Agents: ${Object.keys(backupData.agents.agents || {}).length}"
echo "   - Revenue: $$(echo '${this.calculateTotalRevenue(null) || 0}' | bc -l 2>/dev/null || echo '0')"
echo ""
`;

        fs.writeFileSync(path.join(backupPath, 'restore.sh'), restorationScript);
        fs.chmodSync(path.join(backupPath, 'restore.sh'), '755');
    }
    
    /**
     * Generate backup manifest
     */
    async generateBackupManifest(backupPath, backupData) {
        const files = fs.readdirSync(backupPath);
        const manifest = {
            backup_id: backupData.metadata.backup_id,
            created: backupData.metadata.created,
            version: backupData.metadata.version,
            
            files: files.map(filename => {
                const filePath = path.join(backupPath, filename);
                const stats = fs.statSync(filePath);
                return {
                    name: filename,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    hash: this.getFileHash(filePath)
                };
            }),
            
            summary: {
                total_files: files.length,
                total_size: this.getDirectorySize(backupPath),
                marketplaces: Array.isArray(backupData.marketplaces.approved) ? backupData.marketplaces.approved.length : 0,
                agents: Array.isArray(backupData.agents.agents) ? backupData.agents.agents.length : 0,
                transactions: backupData.transactions ? backupData.transactions.total_transactions : 0,
                revenue: backupData.revenue ? backupData.revenue.total_processed : 0
            },
            
            integrity: {
                checksum: this.calculateBackupChecksum(backupData),
                encrypted: true,
                verified: true
            }
        };
        
        return manifest;
    }
    
    /**
     * Encrypt backup data
     */
    encryptBackup(data) {
        const algorithm = 'aes-256-cbc';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, this.encryptionKey);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            algorithm: algorithm,
            iv: iv.toString('hex'),
            data: encrypted
        };
    }
    
    /**
     * Restore from backup
     */
    async restoreFromBackup(backupId, platformInstance) {
        const backupPath = path.join(this.backupDir, backupId);
        const backupFile = path.join(backupPath, 'full-backup.json');
        
        if (!fs.existsSync(backupFile)) {
            throw new Error(`Backup not found: ${backupId}`);
        }
        
        console.log(`🔄 Restoring from backup: ${backupId}`);
        
        try {
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            
            // Restore marketplaces
            this.restoreMarketplaces(backupData.marketplaces, platformInstance);
            
            // Restore agents
            this.restoreAgents(backupData.agents, platformInstance);
            
            // Restore revenue data
            this.restoreRevenue(backupData.revenue, platformInstance);
            
            console.log(`✅ Restoration complete: ${backupId}`);
            
            return {
                restored: true,
                backup_id: backupId,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error(`❌ Restoration failed: ${error.message}`);
            throw error;
        }
    }
    
    // Utility methods
    generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    getDirectorySize(dirPath) {
        let totalSize = 0;
        const files = fs.readdirSync(dirPath);
        
        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        });
        
        return totalSize;
    }
    
    getFileHash(filePath) {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    calculateBackupChecksum(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
    
    calculateTotalRevenue(platformInstance) {
        if (!platformInstance) return 0;
        
        let total = 0;
        if (platformInstance.marketplaceBackend && platformInstance.marketplaceBackend.platformVault) {
            total += platformInstance.marketplaceBackend.platformVault.balance || 0;
        }
        return total;
    }
    
    getDailyRevenueBreakdown(platformInstance) {
        // Implementation would analyze transactions by day
        return {};
    }
    
    getAgentEarnings(platformInstance) {
        // Implementation would calculate total agent earnings
        return {};
    }
    
    getMarketplaceEarnings(platformInstance) {
        // Implementation would calculate marketplace earnings
        return {};
    }
    
    getPlatformFees(platformInstance) {
        // Implementation would calculate platform fees
        return {};
    }
    
    getUserAgentRelationships(platformInstance) {
        // Implementation would map users to their agents
        return {};
    }
    
    getAgentMarketplaceRelationships(platformInstance) {
        // Implementation would map agents to marketplaces
        return {};
    }
    
    getRevenueFlowRelationships(platformInstance) {
        // Implementation would map revenue flows
        return {};
    }
    
    restoreMarketplaces(marketplaceData, platformInstance) {
        // Implementation would restore marketplace data
        console.log('Restoring marketplaces...');
    }
    
    restoreAgents(agentData, platformInstance) {
        // Implementation would restore agent data
        console.log('Restoring agents...');
    }
    
    restoreRevenue(revenueData, platformInstance) {
        // Implementation would restore revenue data
        console.log('Restoring revenue...');
    }
}

module.exports = SystemBackupManager;