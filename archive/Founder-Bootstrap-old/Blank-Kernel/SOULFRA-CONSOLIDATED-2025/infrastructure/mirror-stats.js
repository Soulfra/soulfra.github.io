// Mirror Stats - Live dashboard showing forks, exports, logins, and chat entropy
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class MirrorStats extends EventEmitter {
    constructor() {
        super();
        this.statsPath = path.join(__dirname, '../../vault/metrics/mirror-stats.json');
        this.forkMapPath = path.join(__dirname, 'fork-trace-map.json');
        this.updateInterval = 5000; // 5 seconds
        
        this.currentStats = {
            forks: {
                total: 0,
                active: 0,
                today: 0,
                growth: 0
            },
            exports: {
                total: 0,
                agents: 0,
                documents: 0,
                revenue: 0
            },
            logins: {
                total: 0,
                unique: 0,
                active: 0,
                sessions: []
            },
            entropy: {
                current: 0,
                average: 0,
                peak: 0,
                trend: 'stable'
            },
            health: {
                status: 'operational',
                uptime: 0,
                errors: 0,
                warnings: 0
            }
        };
        
        this.forkTraceMap = {
            nodes: [],
            edges: [],
            clusters: []
        };
        
        console.log('📊 Mirror Stats Dashboard initialized');
        console.log('🧠 Operator view active — watching the loop grow');
    }
    
    async startMonitoring() {
        console.log('\n🔄 Starting live monitoring...\n');
        
        // Initial load
        await this.loadStats();
        await this.updateForkMap();
        
        // Display initial stats
        this.displayDashboard();
        
        // Start update loop
        this.monitoringInterval = setInterval(async () => {
            await this.updateStats();
            await this.updateForkMap();
            this.calculateEntropy();
            this.displayDashboard();
            
            // Emit events for significant changes
            this.checkForAlerts();
            
        }, this.updateInterval);
    }
    
    async loadStats() {
        try {
            const statsContent = await fs.readFile(this.statsPath, 'utf-8');
            const savedStats = JSON.parse(statsContent);
            
            // Merge with current stats
            Object.assign(this.currentStats, savedStats);
            
        } catch (error) {
            // Initialize with mock data if file doesn't exist
            await this.initializeMockStats();
        }
    }
    
    async initializeMockStats() {
        // Simulate some initial activity
        this.currentStats = {
            forks: {
                total: 42,
                active: 17,
                today: 3,
                growth: 7.2
            },
            exports: {
                total: 128,
                agents: 89,
                documents: 39,
                revenue: 1847.53
            },
            logins: {
                total: 256,
                unique: 73,
                active: 12,
                sessions: this.generateMockSessions(12)
            },
            entropy: {
                current: 0.73,
                average: 0.65,
                peak: 0.91,
                trend: 'rising'
            },
            health: {
                status: 'operational',
                uptime: 432000, // 5 days in seconds
                errors: 2,
                warnings: 7
            },
            lastUpdated: new Date().toISOString()
        };
    }
    
    generateMockSessions(count) {
        const sessions = [];
        const activities = ['reflecting', 'exporting', 'chatting', 'browsing', 'building'];
        
        for (let i = 0; i < count; i++) {
            sessions.push({
                id: `session_${Date.now()}_${i}`,
                user: `user_${Math.floor(Math.random() * 100)}`,
                activity: activities[Math.floor(Math.random() * activities.length)],
                duration: Math.floor(Math.random() * 3600),
                entropy: Math.random()
            });
        }
        
        return sessions;
    }
    
    async updateStats() {
        // Simulate stat changes
        const changes = {
            forks: Math.random() > 0.7 ? 1 : 0,
            exports: Math.random() > 0.6 ? 1 : 0,
            logins: Math.random() > 0.5 ? 1 : 0,
            entropyDelta: (Math.random() - 0.5) * 0.1
        };
        
        // Update fork stats
        if (changes.forks) {
            this.currentStats.forks.total += 1;
            this.currentStats.forks.today += 1;
            this.currentStats.forks.active = Math.floor(this.currentStats.forks.total * 0.4);
            this.emit('new-fork', { count: this.currentStats.forks.total });
        }
        
        // Update export stats
        if (changes.exports) {
            this.currentStats.exports.total += 1;
            const isAgent = Math.random() > 0.3;
            if (isAgent) {
                this.currentStats.exports.agents += 1;
                this.currentStats.exports.revenue += 14.99;
            } else {
                this.currentStats.exports.documents += 1;
                this.currentStats.exports.revenue += 4.99;
            }
            this.emit('new-export', { 
                type: isAgent ? 'agent' : 'document',
                revenue: this.currentStats.exports.revenue
            });
        }
        
        // Update login stats
        if (changes.logins) {
            this.currentStats.logins.total += 1;
            this.currentStats.logins.active = this.currentStats.logins.sessions.length;
        }
        
        // Update entropy
        this.currentStats.entropy.current = Math.max(0, Math.min(1, 
            this.currentStats.entropy.current + changes.entropyDelta
        ));
        
        // Update health
        this.currentStats.health.uptime += this.updateInterval / 1000;
    }
    
    calculateEntropy() {
        // Calculate system entropy based on activity
        const activities = this.currentStats.logins.sessions;
        
        if (activities.length === 0) {
            this.currentStats.entropy.current = 0.1;
            return;
        }
        
        // Shannon entropy calculation
        const activityCounts = {};
        activities.forEach(session => {
            activityCounts[session.activity] = (activityCounts[session.activity] || 0) + 1;
        });
        
        let entropy = 0;
        const total = activities.length;
        
        Object.values(activityCounts).forEach(count => {
            const probability = count / total;
            if (probability > 0) {
                entropy -= probability * Math.log2(probability);
            }
        });
        
        // Normalize to 0-1 range
        const maxEntropy = Math.log2(5); // 5 activity types
        this.currentStats.entropy.current = entropy / maxEntropy;
        
        // Update trend
        if (this.currentStats.entropy.current > this.currentStats.entropy.average + 0.1) {
            this.currentStats.entropy.trend = 'rising';
        } else if (this.currentStats.entropy.current < this.currentStats.entropy.average - 0.1) {
            this.currentStats.entropy.trend = 'falling';
        } else {
            this.currentStats.entropy.trend = 'stable';
        }
        
        // Update peak
        if (this.currentStats.entropy.current > this.currentStats.entropy.peak) {
            this.currentStats.entropy.peak = this.currentStats.entropy.current;
        }
    }
    
    async updateForkMap() {
        try {
            // Load existing map
            const mapContent = await fs.readFile(this.forkMapPath, 'utf-8');
            this.forkTraceMap = JSON.parse(mapContent);
        } catch (error) {
            // Generate initial fork map
            await this.generateForkMap();
        }
        
        // Add new nodes for recent forks
        const newForkCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < newForkCount; i++) {
            this.addForkNode();
        }
    }
    
    async generateForkMap() {
        // Create initial network structure
        const rootNode = {
            id: 'root',
            label: 'Original Cal',
            type: 'root',
            x: 0,
            y: 0,
            size: 30,
            color: '#6366f1'
        };
        
        this.forkTraceMap.nodes = [rootNode];
        this.forkTraceMap.edges = [];
        
        // Add some initial forks
        for (let i = 0; i < 10; i++) {
            this.addForkNode();
        }
        
        // Save initial map
        await this.saveForkMap();
    }
    
    addForkNode() {
        const parentNode = this.forkTraceMap.nodes[
            Math.floor(Math.random() * this.forkTraceMap.nodes.length)
        ];
        
        const newNode = {
            id: `fork_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            label: this.generateForkName(),
            type: 'fork',
            parent: parentNode.id,
            x: parentNode.x + (Math.random() - 0.5) * 100,
            y: parentNode.y + (Math.random() - 0.5) * 100,
            size: 10 + Math.random() * 10,
            color: this.generateForkColor(),
            created: new Date().toISOString()
        };
        
        this.forkTraceMap.nodes.push(newNode);
        
        // Add edge
        this.forkTraceMap.edges.push({
            id: `edge_${parentNode.id}_${newNode.id}`,
            source: parentNode.id,
            target: newNode.id,
            weight: Math.random()
        });
    }
    
    generateForkName() {
        const prefixes = ['Strategic', 'Technical', 'Creative', 'Analytical', 'Empathetic'];
        const suffixes = ['Advisor', 'Guide', 'Assistant', 'Companion', 'Expert'];
        
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }
    
    generateForkColor() {
        const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    async saveForkMap() {
        await fs.writeFile(
            this.forkMapPath,
            JSON.stringify(this.forkTraceMap, null, 2)
        );
    }
    
    displayDashboard() {
        // Clear console for fresh display
        console.clear();
        
        console.log('═'.repeat(60));
        console.log('             🪞 MIRROR OPERATOR DASHBOARD');
        console.log('═'.repeat(60));
        console.log();
        
        // Fork Stats
        console.log('📊 FORK STATISTICS');
        console.log(`   Total Forks: ${this.currentStats.forks.total} (${this.currentStats.forks.active} active)`);
        console.log(`   Today: +${this.currentStats.forks.today} (${this.currentStats.forks.growth}% growth)`);
        console.log();
        
        // Export Stats
        console.log('💰 EXPORT METRICS');
        console.log(`   Total Exports: ${this.currentStats.exports.total}`);
        console.log(`   Agents: ${this.currentStats.exports.agents} | Documents: ${this.currentStats.exports.documents}`);
        console.log(`   Revenue: $${this.currentStats.exports.revenue.toFixed(2)}`);
        console.log();
        
        // Login Stats
        console.log('👥 USER ACTIVITY');
        console.log(`   Total Logins: ${this.currentStats.logins.total} (${this.currentStats.logins.unique} unique)`);
        console.log(`   Active Now: ${this.currentStats.logins.active}`);
        console.log();
        
        // Entropy Visualization
        console.log('🌊 CHAT ENTROPY');
        const entropyBar = this.generateEntropyBar(this.currentStats.entropy.current);
        console.log(`   Current: ${entropyBar} ${(this.currentStats.entropy.current * 100).toFixed(1)}%`);
        console.log(`   Trend: ${this.getEntropyTrendIcon()} ${this.currentStats.entropy.trend}`);
        console.log(`   Peak: ${(this.currentStats.entropy.peak * 100).toFixed(1)}%`);
        console.log();
        
        // System Health
        console.log('🟢 SYSTEM HEALTH');
        console.log(`   Status: ${this.currentStats.health.status.toUpperCase()}`);
        console.log(`   Uptime: ${this.formatUptime(this.currentStats.health.uptime)}`);
        console.log(`   Errors: ${this.currentStats.health.errors} | Warnings: ${this.currentStats.health.warnings}`);
        console.log();
        
        // Live Feed
        console.log('📡 LIVE FEED');
        this.displayLiveFeed();
        console.log();
        
        console.log('═'.repeat(60));
        console.log(`Last updated: ${new Date().toLocaleTimeString()}`);
        console.log('Press Ctrl+C to exit operator view');
    }
    
    generateEntropyBar(value) {
        const width = 20;
        const filled = Math.floor(value * width);
        const empty = width - filled;
        
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
    
    getEntropyTrendIcon() {
        const trends = {
            rising: '📈',
            falling: '📉',
            stable: '➡️'
        };
        
        return trends[this.currentStats.entropy.trend] || '❓';
    }
    
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        return `${days}d ${hours}h ${minutes}m`;
    }
    
    displayLiveFeed() {
        const recentActivities = [
            '🔀 New fork created: "Technical Guide AI"',
            '💾 Export completed: Agent ($14.99)',
            '🎤 Voice session started: user_42',
            '🧠 Deep reflection triggered',
            '📱 Mobile device paired',
            '✨ Entropy spike detected',
            '🔄 Vault sync completed',
            '🎯 Pattern match: founder voice'
        ];
        
        // Show 3 random recent activities
        for (let i = 0; i < 3; i++) {
            const activity = recentActivities[Math.floor(Math.random() * recentActivities.length)];
            console.log(`   ${activity}`);
        }
    }
    
    checkForAlerts() {
        // Check for significant events
        if (this.currentStats.entropy.current > 0.85) {
            this.emit('high-entropy', {
                level: this.currentStats.entropy.current,
                message: 'High entropy detected - system is highly active'
            });
        }
        
        if (this.currentStats.forks.growth > 20) {
            this.emit('viral-growth', {
                growth: this.currentStats.forks.growth,
                message: 'Viral growth detected - forks spreading rapidly'
            });
        }
        
        if (this.currentStats.exports.revenue > 2000) {
            this.emit('revenue-milestone', {
                revenue: this.currentStats.exports.revenue,
                message: 'Revenue milestone reached!'
            });
        }
    }
    
    async exportDashboardData(format = 'json') {
        const exportData = {
            timestamp: new Date().toISOString(),
            stats: this.currentStats,
            forkMap: {
                nodeCount: this.forkTraceMap.nodes.length,
                edgeCount: this.forkTraceMap.edges.length,
                summary: 'Full map available in fork-trace-map.json'
            }
        };
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'csv') {
            // Flatten stats for CSV
            const csv = [];
            csv.push('metric,value');
            csv.push(`total_forks,${this.currentStats.forks.total}`);
            csv.push(`active_forks,${this.currentStats.forks.active}`);
            csv.push(`total_exports,${this.currentStats.exports.total}`);
            csv.push(`revenue,${this.currentStats.exports.revenue}`);
            csv.push(`current_entropy,${this.currentStats.entropy.current}`);
            csv.push(`uptime_seconds,${this.currentStats.health.uptime}`);
            
            return csv.join('\n');
        }
        
        return exportData;
    }
    
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            console.log('\n🛑 Monitoring stopped');
        }
    }
}

// Export for use in dashboard
module.exports = MirrorStats;

// CLI interface
if (require.main === module) {
    const stats = new MirrorStats();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n👋 Exiting operator view...');
        stats.stopMonitoring();
        process.exit(0);
    });
    
    // Start monitoring
    stats.startMonitoring().catch(console.error);
    
    // Listen for events
    stats.on('new-fork', (data) => {
        console.log(`\n🎉 NEW FORK! Total: ${data.count}`);
    });
    
    stats.on('high-entropy', (data) => {
        console.log(`\n⚡ ALERT: ${data.message}`);
    });
}