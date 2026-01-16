const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class StatsDaemon extends EventEmitter {
    constructor() {
        super();
        this.vaultPath = path.join(__dirname, '../vault');
        this.statsPath = path.join(this.vaultPath, 'platform-stats.json');
        this.stats = this.loadStats();
        
        this.intervals = {
            collect: null,
            persist: null,
            analyze: null
        };
        
        this.metrics = {
            requests: [],
            revenue: [],
            customers: new Set(),
            agents: new Map()
        };
    }

    loadStats() {
        if (fs.existsSync(this.statsPath)) {
            return JSON.parse(fs.readFileSync(this.statsPath, 'utf8'));
        }
        
        return {
            lifetime: {
                requests: 0,
                revenue: 0,
                customers: 0,
                agents: 0
            },
            daily: {},
            hourly: {},
            realtime: {
                rpm: 0, // requests per minute
                activeUsers: 0,
                revenue: 0
            }
        };
    }

    start() {
        console.log('📊 Stats Daemon started');
        
        // Collect metrics every second
        this.intervals.collect = setInterval(() => {
            this.collectMetrics();
        }, 1000);
        
        // Persist stats every minute
        this.intervals.persist = setInterval(() => {
            this.persistStats();
        }, 60000);
        
        // Analyze trends every 5 minutes
        this.intervals.analyze = setInterval(() => {
            this.analyzeTrends();
        }, 300000);
        
        // Initial collection
        this.collectMetrics();
    }

    stop() {
        Object.values(this.intervals).forEach(interval => {
            if (interval) clearInterval(interval);
        });
        
        this.persistStats();
        console.log('📊 Stats Daemon stopped');
    }

    collectMetrics() {
        // Scan access logs
        const accessLog = path.join(this.vaultPath, 'access-log.json');
        if (fs.existsSync(accessLog)) {
            const logs = JSON.parse(fs.readFileSync(accessLog, 'utf8'));
            const recentLogs = logs.filter(log => {
                const logTime = new Date(log.timestamp).getTime();
                return Date.now() - logTime < 60000; // Last minute
            });
            
            this.metrics.requests = recentLogs;
            this.stats.realtime.rpm = recentLogs.length;
        }
        
        // Scan customer files
        const customersDir = path.join(this.vaultPath, 'customers');
        if (fs.existsSync(customersDir)) {
            const customerFiles = fs.readdirSync(customersDir);
            
            customerFiles.forEach(file => {
                const customerId = file.replace('.json', '');
                this.metrics.customers.add(customerId);
                
                // Check for recent activity
                const customerData = JSON.parse(
                    fs.readFileSync(path.join(customersDir, file), 'utf8')
                );
                
                if (customerData.usage?.length > 0) {
                    const lastUsage = customerData.usage[customerData.usage.length - 1];
                    const lastTime = new Date(lastUsage.timestamp).getTime();
                    
                    if (Date.now() - lastTime < 300000) { // Active in last 5 min
                        this.stats.realtime.activeUsers++;
                    }
                }
            });
            
            this.stats.lifetime.customers = this.metrics.customers.size;
        }
        
        // Calculate revenue
        this.calculateRevenue();
        
        // Emit realtime stats
        this.emit('stats:realtime', this.stats.realtime);
    }

    calculateRevenue() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const hour = now.getHours();
        
        // Initialize daily stats
        if (!this.stats.daily[today]) {
            this.stats.daily[today] = {
                requests: 0,
                revenue: 0,
                customers: new Set(),
                peakRPM: 0
            };
        }
        
        // Initialize hourly stats
        const hourKey = `${today}-${hour}`;
        if (!this.stats.hourly[hourKey]) {
            this.stats.hourly[hourKey] = {
                requests: 0,
                revenue: 0,
                customers: new Set()
            };
        }
        
        // Process recent requests
        this.metrics.requests.forEach(req => {
            const revenue = this.calculateRequestRevenue(req);
            
            this.stats.daily[today].requests++;
        this.stats.daily[today].revenue += revenue;
            this.stats.hourly[hourKey].requests++;
            this.stats.hourly[hourKey].revenue += revenue;
            
            // Track unique customers
            if (req.customerId) {
                this.stats.daily[today].customers.add(req.customerId);
                this.stats.hourly[hourKey].customers.add(req.customerId);
            }
        });
        
        // Update peak RPM
        if (this.stats.realtime.rpm > this.stats.daily[today].peakRPM) {
            this.stats.daily[today].peakRPM = this.stats.realtime.rpm;
        }
        
        // Update lifetime stats
        this.stats.lifetime.requests = Object.values(this.stats.daily)
            .reduce((sum, day) => sum + day.requests, 0);
        
        this.stats.lifetime.revenue = Object.values(this.stats.daily)
            .reduce((sum, day) => sum + day.revenue, 0);
        
        // Calculate realtime revenue (last hour)
        const lastHour = Object.entries(this.stats.hourly)
            .filter(([key]) => {
                const hourTime = new Date(key.split('-').slice(0, 3).join('-') + 'T' + key.split('-')[3] + ':00:00').getTime();
                return Date.now() - hourTime < 3600000;
            })
            .reduce((sum, [, data]) => sum + data.revenue, 0);
        
        this.stats.realtime.revenue = lastHour;
    }

    calculateRequestRevenue(request) {
        // Base rate: $0.01 per request
        let revenue = 0.01;
        
        // Add complexity multiplier
        if (request.promptLength > 1000) {
            revenue *= 1.5;
        }
        
        // Add premium agent multiplier
        if (request.agentType === 'premium') {
            revenue *= 2;
        }
        
        return revenue;
    }

    analyzeTrends() {
        const trends = {
            growth: this.calculateGrowth(),
            peakHours: this.findPeakHours(),
            topCustomers: this.getTopCustomers(),
            agentPerformance: this.analyzeAgentPerformance()
        };
        
        // Log trends
        const trendsFile = path.join(this.vaultPath, 'platform-trends.json');
        fs.writeFileSync(trendsFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            trends
        }, null, 2));
        
        // Emit trends
        this.emit('stats:trends', trends);
        
        // Check for anomalies
        this.detectAnomalies(trends);
    }

    calculateGrowth() {
        const days = Object.keys(this.stats.daily).sort();
        
        if (days.length < 2) {
            return { daily: 0, weekly: 0 };
        }
        
        const today = days[days.length - 1];
        const yesterday = days[days.length - 2];
        
        const dailyGrowth = this.stats.daily[today].revenue > 0
            ? ((this.stats.daily[today].revenue - this.stats.daily[yesterday].revenue) / 
               this.stats.daily[yesterday].revenue * 100)
            : 0;
        
        // Calculate weekly growth
        let weeklyGrowth = 0;
        if (days.length >= 7) {
            const weekAgo = days[days.length - 7];
            const lastWeekRevenue = days.slice(-7, -1)
                .reduce((sum, day) => sum + this.stats.daily[day].revenue, 0);
            
            const previousWeekRevenue = days.slice(-14, -7)
                .reduce((sum, day) => sum + (this.stats.daily[day]?.revenue || 0), 0);
            
            if (previousWeekRevenue > 0) {
                weeklyGrowth = ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue * 100);
            }
        }
        
        return {
            daily: Math.round(dailyGrowth * 100) / 100,
            weekly: Math.round(weeklyGrowth * 100) / 100
        };
    }

    findPeakHours() {
        const hourlyStats = {};
        
        Object.entries(this.stats.hourly).forEach(([key, data]) => {
            const hour = parseInt(key.split('-')[3]);
            if (!hourlyStats[hour]) {
                hourlyStats[hour] = {
                    requests: 0,
                    revenue: 0,
                    count: 0
                };
            }
            
            hourlyStats[hour].requests += data.requests;
            hourlyStats[hour].revenue += data.revenue;
            hourlyStats[hour].count++;
        });
        
        // Calculate averages and find peaks
        const hours = Object.entries(hourlyStats)
            .map(([hour, data]) => ({
                hour: parseInt(hour),
                avgRequests: data.requests / data.count,
                avgRevenue: data.revenue / data.count
            }))
            .sort((a, b) => b.avgRevenue - a.avgRevenue);
        
        return hours.slice(0, 3); // Top 3 peak hours
    }

    getTopCustomers() {
        const customerStats = {};
        
        // Aggregate customer data
        const customersDir = path.join(this.vaultPath, 'customers');
        if (fs.existsSync(customersDir)) {
            fs.readdirSync(customersDir).forEach(file => {
                const customerId = file.replace('.json', '');
                const data = JSON.parse(fs.readFileSync(path.join(customersDir, file), 'utf8'));
                
                customerStats[customerId] = {
                    requests: data.usage?.length || 0,
                    revenue: (data.usage?.length || 0) * 0.01, // Simplified
                    lastActive: data.usage?.[data.usage.length - 1]?.timestamp
                };
            });
        }
        
        // Sort by revenue
        return Object.entries(customerStats)
            .sort(([, a], [, b]) => b.revenue - a.revenue)
            .slice(0, 10)
            .map(([customerId, stats]) => ({
                customerId,
                ...stats
            }));
    }

    analyzeAgentPerformance() {
        // Placeholder for agent performance metrics
        return {
            totalAgents: this.metrics.agents.size,
            activeAgents: Array.from(this.metrics.agents.values())
                .filter(agent => agent.lastUsed && Date.now() - agent.lastUsed < 3600000).length,
            topPerforming: []
        };
    }

    detectAnomalies(trends) {
        const anomalies = [];
        
        // Sudden traffic spike
        if (this.stats.realtime.rpm > this.stats.lifetime.requests / 1440 * 5) {
            anomalies.push({
                type: 'traffic_spike',
                severity: 'warning',
                message: `Traffic spike detected: ${this.stats.realtime.rpm} RPM`,
                timestamp: new Date().toISOString()
            });
        }
        
        // Revenue drop
        if (trends.growth.daily < -20) {
            anomalies.push({
                type: 'revenue_drop',
                severity: 'alert',
                message: `Daily revenue dropped by ${Math.abs(trends.growth.daily)}%`,
                timestamp: new Date().toISOString()
            });
        }
        
        if (anomalies.length > 0) {
            this.emit('stats:anomalies', anomalies);
            
            // Log anomalies
            const anomalyLog = path.join(this.vaultPath, 'anomalies.json');
            let existingAnomalies = [];
            
            if (fs.existsSync(anomalyLog)) {
                existingAnomalies = JSON.parse(fs.readFileSync(anomalyLog, 'utf8'));
            }
            
            existingAnomalies.push(...anomalies);
            fs.writeFileSync(anomalyLog, JSON.stringify(existingAnomalies, null, 2));
        }
    }

    persistStats() {
        // Clean up Set objects for JSON serialization
        const cleanStats = JSON.parse(JSON.stringify(this.stats, (key, value) => {
            if (value instanceof Set) {
                return { _type: 'Set', values: Array.from(value) };
            }
            return value;
        }));
        
        fs.writeFileSync(this.statsPath, JSON.stringify(cleanStats, null, 2));
        
        // Emit persistence event
        this.emit('stats:persisted', {
            timestamp: new Date().toISOString(),
            stats: this.stats
        });
    }

    getRealtimeStats() {
        return this.stats.realtime;
    }

    getDailyStats(date) {
        return this.stats.daily[date] || null;
    }

    getLifetimeStats() {
        return this.stats.lifetime;
    }
}

// Start daemon if run directly
if (require.main === module) {
    const daemon = new StatsDaemon();
    
    daemon.on('stats:realtime', (stats) => {
        console.log('📊 Realtime:', stats);
    });
    
    daemon.on('stats:anomalies', (anomalies) => {
        console.log('⚠️  Anomalies detected:', anomalies);
    });
    
    daemon.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        daemon.stop();
        process.exit(0);
    });
}

module.exports = StatsDaemon;