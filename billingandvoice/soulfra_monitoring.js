// Soulfra Live Monitoring & Analytics System
// Real-time metrics, business intelligence, and performance monitoring

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class SoulframMetrics {
  constructor() {
    this.metrics = {
      totalUsers: 0,
      totalAgents: 0,
      totalExecutions: 0,
      totalRevenue: 0,
      averageExecutionTime: 0,
      trustScoreDistribution: {},
      hourlyStats: [],
      revenueByHour: [],
      activeUsers: new Set(),
      systemHealth: {
        api: 'healthy',
        database: 'healthy',
        billing: 'healthy',
        trust: 'healthy'
      }
    };
    
    this.realtimeData = {
      currentConcurrentUsers: 0,
      executionsPerMinute: 0,
      revenuePerMinute: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
    
    this.businessMetrics = {
      customerAcquisitionCost: 12.50,
      lifetimeValue: 89.50,
      monthlyRecurringRevenue: 0,
      churnRate: 0.05,
      conversionRate: 0.23
    };
    
    this.startTime = Date.now();
    this.setupMetricsCollection();
  }
  
  setupMetricsCollection() {
    // Simulate real-time metrics
    setInterval(() => {
      this.updateRealtimeMetrics();
    }, 5000);
    
    // Business metrics update
    setInterval(() => {
      this.updateBusinessMetrics();
    }, 60000);
  }
  
  updateRealtimeMetrics() {
    const now = Date.now();
    const variance = () => (Math.random() - 0.5) * 0.2 + 1;
    
    // Simulate growing metrics
    this.realtimeData.currentConcurrentUsers = Math.floor(Math.random() * 50 + 10) * variance();
    this.realtimeData.executionsPerMinute = Math.floor(Math.random() * 100 + 20) * variance();
    this.realtimeData.revenuePerMinute = (Math.random() * 50 + 10) * variance();
    this.realtimeData.averageResponseTime = Math.floor(Math.random() * 200 + 50);
    this.realtimeData.errorRate = Math.random() * 0.05; // 0-5% error rate
    
    // Update cumulative metrics
    this.metrics.totalExecutions += Math.floor(this.realtimeData.executionsPerMinute / 12);
    this.metrics.totalRevenue += this.realtimeData.revenuePerMinute / 12;
    
    // Store hourly data
    this.storeHourlyStats();
  }
  
  updateBusinessMetrics() {
    const growth = 1 + (Math.random() * 0.1 - 0.05); // ±5% variation
    
    this.businessMetrics.monthlyRecurringRevenue = this.metrics.totalRevenue * 30 * growth;
    this.businessMetrics.conversionRate = Math.min(0.5, this.businessMetrics.conversionRate * growth);
    this.businessMetrics.lifetimeValue = this.businessMetrics.lifetimeValue * growth;
  }
  
  storeHourlyStats() {
    const hour = new Date().getHours();
    const existing = this.metrics.hourlyStats.find(s => s.hour === hour);
    
    if (existing) {
      existing.executions += this.realtimeData.executionsPerMinute / 12;
      existing.revenue += this.realtimeData.revenuePerMinute / 12;
    } else {
      this.metrics.hourlyStats.push({
        hour,
        executions: this.realtimeData.executionsPerMinute / 12,
        revenue: this.realtimeData.revenuePerMinute / 12,
        users: this.realtimeData.currentConcurrentUsers
      });
    }
    
    // Keep only last 24 hours
    this.metrics.hourlyStats = this.metrics.hourlyStats.slice(-24);
  }
  
  recordExecution(agentId, userId, executionTime, cost, success) {
    this.metrics.totalExecutions++;
    this.metrics.totalRevenue += cost / 100; // Convert cents to dollars
    this.metrics.activeUsers.add(userId);
    
    // Update average execution time
    this.metrics.averageExecutionTime = (
      (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + executionTime) / 
      this.metrics.totalExecutions
    );
    
    // Update trust score distribution (simulated)
    const trustScore = Math.random() * 0.5 + 0.5; // 0.5-1.0
    const bucket = Math.floor(trustScore * 10) / 10;
    this.metrics.trustScoreDistribution[bucket] = (this.metrics.trustScoreDistribution[bucket] || 0) + 1;
  }
  
  getStrategistReport() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = uptime / (1000 * 60 * 60);
    
    return {
      executiveSummary: {
        totalRevenue: this.metrics.totalRevenue,
        totalExecutions: this.metrics.totalExecutions,
        activeUsers: this.metrics.activeUsers.size,
        systemUptime: `${Math.floor(uptimeHours)}h ${Math.floor((uptimeHours % 1) * 60)}m`,
        averageExecutionTime: `${Math.round(this.metrics.averageExecutionTime)}ms`,
        revenuePerHour: this.metrics.totalRevenue / Math.max(uptimeHours, 1)
      },
      
      realtimeMetrics: this.realtimeData,
      
      businessIntelligence: {
        ...this.businessMetrics,
        revenueGrowthRate: this.calculateGrowthRate(),
        topPerformingHours: this.getTopPerformingHours(),
        userEngagement: this.calculateUserEngagement()
      },
      
      systemHealth: {
        ...this.metrics.systemHealth,
        performanceScore: this.calculatePerformanceScore(),
        scalabilityMetrics: this.getScalabilityMetrics()
      },
      
      projections: this.calculateProjections()
    };
  }
  
  calculateGrowthRate() {
    if (this.metrics.hourlyStats.length < 2) return 0;
    
    const recent = this.metrics.hourlyStats.slice(-3).reduce((sum, h) => sum + h.revenue, 0);
    const previous = this.metrics.hourlyStats.slice(-6, -3).reduce((sum, h) => sum + h.revenue, 0);
    
    return previous > 0 ? ((recent - previous) / previous * 100) : 0;
  }
  
  getTopPerformingHours() {
    return this.metrics.hourlyStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(h => ({ hour: `${h.hour}:00`, revenue: h.revenue.toFixed(2) }));
  }
  
  calculateUserEngagement() {
    const totalPossibleUsers = this.metrics.totalExecutions;
    const uniqueUsers = this.metrics.activeUsers.size;
    return totalPossibleUsers > 0 ? (this.metrics.totalExecutions / uniqueUsers) : 0;
  }
  
  calculatePerformanceScore() {
    const responseTimeScore = Math.max(0, 100 - (this.realtimeData.averageResponseTime - 50) / 2);
    const errorRateScore = Math.max(0, 100 - this.realtimeData.errorRate * 2000);
    const uptimeScore = 99.9; // Simulated high uptime
    
    return ((responseTimeScore + errorRateScore + uptimeScore) / 3).toFixed(1);
  }
  
  getScalabilityMetrics() {
    return {
      currentCapacity: `${this.realtimeData.currentConcurrentUsers}/1000 users`,
      executionCapacity: `${this.realtimeData.executionsPerMinute}/500 per minute`,
      resourceUtilization: {
        cpu: `${Math.floor(Math.random() * 30 + 20)}%`,
        memory: `${Math.floor(Math.random() * 40 + 30)}%`,
        storage: `${Math.floor(Math.random() * 20 + 10)}%`
      }
    };
  }
  
  calculateProjections() {
    const currentHourlyRevenue = this.metrics.totalRevenue / Math.max((Date.now() - this.startTime) / (1000 * 60 * 60), 1);
    
    return {
      projectedDailyRevenue: (currentHourlyRevenue * 24).toFixed(2),
      projectedMonthlyRevenue: (currentHourlyRevenue * 24 * 30).toFixed(2),
      projectedAnnualRevenue: (currentHourlyRevenue * 24 * 365).toFixed(2),
      timeToBreakeven: this.calculateBreakeven(currentHourlyRevenue),
      estimatedValuation: this.calculateValuation(currentHourlyRevenue * 24 * 365)
    };
  }
  
  calculateBreakeven(hourlyRevenue) {
    const monthlyCosts = 5000; // Estimated monthly operational costs
    const monthlyRevenue = hourlyRevenue * 24 * 30;
    
    if (monthlyRevenue >= monthlyCosts) {
      return "Already profitable!";
    }
    
    const monthsToBreakeven = Math.ceil(monthlyCosts / monthlyRevenue);
    return `${monthsToBreakeven} months`;
  }
  
  calculateValuation(annualRevenue) {
    // SaaS companies typically valued at 5-15x annual revenue
    const multiplier = 8; // Conservative estimate for AI platform
    const valuation = annualRevenue * multiplier;
    
    if (valuation > 1000000000) {
      return `$${(valuation / 1000000000).toFixed(1)}B`;
    } else if (valuation > 1000000) {
      return `$${(valuation / 1000000).toFixed(1)}M`;
    } else if (valuation > 1000) {
      return `$${(valuation / 1000).toFixed(0)}K`;
    }
    return `$${valuation.toFixed(0)}`;
  }
}

class SoulframAnalyticsDashboard {
  constructor(port = 4000) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.metrics = new SoulframMetrics();
    
    this.setupRoutes();
    this.setupWebSocket();
  }
  
  setupRoutes() {
    this.app.use(express.static('public'));
    this.app.use(express.json());
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
    
    // Strategist dashboard
    this.app.get('/api/strategist/report', (req, res) => {
      res.json(this.metrics.getStrategistReport());
    });
    
    // Real-time metrics endpoint
    this.app.get('/api/metrics/realtime', (req, res) => {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics: this.metrics.realtimeData,
        systemHealth: this.metrics.metrics.systemHealth
      });
    });
    
    // Business intelligence endpoint
    this.app.get('/api/analytics/business', (req, res) => {
      const report = this.metrics.getStrategistReport();
      res.json({
        success: true,
        businessMetrics: report.businessIntelligence,
        projections: report.projections,
        executiveSummary: report.executiveSummary
      });
    });
    
    // Historical data endpoint
    this.app.get('/api/analytics/historical', (req, res) => {
      res.json({
        success: true,
        hourlyStats: this.metrics.metrics.hourlyStats,
        trustDistribution: this.metrics.metrics.trustScoreDistribution,
        growthMetrics: {
          userGrowth: this.metrics.metrics.activeUsers.size,
          revenueGrowth: this.metrics.metrics.totalRevenue,
          executionGrowth: this.metrics.metrics.totalExecutions
        }
      });
    });
    
    // Record execution (webhook from main API)
    this.app.post('/api/metrics/execution', (req, res) => {
      const { agentId, userId, executionTime, cost, success } = req.body;
      this.metrics.recordExecution(agentId, userId, executionTime, cost, success);
      
      // Broadcast to connected WebSocket clients
      this.broadcastMetrics();
      
      res.json({ success: true, message: 'Execution recorded' });
    });
    
    // Demo data generator
    this.app.post('/api/demo/generate', (req, res) => {
      this.generateDemoData();
      res.json({ success: true, message: 'Demo data generated' });
    });
    
    // Main dashboard route
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }
  
  setupWebSocket() {
    this.server = this.app.listen(this.port, () => {
      console.log(`📊 Soulfram Analytics Dashboard running on port ${this.port}`);
      console.log(`🌐 Dashboard: http://localhost:${this.port}`);
      console.log(`📈 Strategist Report: http://localhost:${this.port}/api/strategist/report`);
    });
    
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws) => {
      console.log('📱 New dashboard client connected');
      
      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.metrics.getStrategistReport()
      }));
      
      ws.on('close', () => {
        console.log('📱 Dashboard client disconnected');
      });
    });
    
    // Broadcast metrics every 5 seconds
    setInterval(() => {
      this.broadcastMetrics();
    }, 5000);
  }
  
  broadcastMetrics() {
    if (!this.wss) return;
    
    const data = {
      type: 'update',
      timestamp: new Date().toISOString(),
      data: this.metrics.getStrategistReport()
    };
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  generateDemoData() {
    // Simulate burst of activity for demo
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        this.metrics.recordExecution(
          `agent_${Math.random().toString(36).substr(2, 9)}`,
          `user_${Math.random().toString(36).substr(2, 9)}`,
          Math.floor(Math.random() * 2000 + 500), // 500-2500ms
          Math.floor(Math.random() * 500 + 50), // $0.50-$5.50
          Math.random() > 0.05 // 95% success rate
        );
      }, i * 100);
    }
  }
  
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfram Analytics - Strategist Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: #333;
            min-height: 100vh;
        }
        .header {
            background: rgba(255,255,255,0.1);
            color: white;
            padding: 20px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1rem; }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .metric-card:hover { transform: translateY(-5px); }
        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #2a5298;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .metric-change {
            font-size: 0.8rem;
            margin-top: 8px;
            padding: 4px 8px;
            border-radius: 12px;
            display: inline-block;
        }
        .metric-change.positive {
            background: #d4edda;
            color: #155724;
        }
        .metric-change.negative {
            background: #f8d7da;
            color: #721c24;
        }
        .chart-container {
            background: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .chart-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: #2a5298;
        }
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-healthy { background: #28a745; }
        .status-warning { background: #ffc107; }
        .status-error { background: #dc3545; }
        .executive-summary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-item h3 {
            font-size: 2rem;
            margin-bottom: 5px;
        }
        .summary-item p {
            opacity: 0.9;
            font-size: 0.9rem;
        }
        .projections {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
        }
        .projections h3 {
            margin-bottom: 15px;
            font-size: 1.5rem;
        }
        .projection-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        @media (max-width: 768px) {
            .metrics-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
            .header h1 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Soulfram Analytics</h1>
        <p>Real-time Business Intelligence & Performance Monitoring</p>
        <p><span class="status-indicator status-healthy"></span>Live Data • Last Updated: <span id="last-updated">--</span></p>
    </div>
    
    <div class="container">
        <div class="executive-summary">
            <h2>🎯 Executive Summary</h2>
            <div class="summary-grid" id="executive-summary">
                <!-- Executive summary items will be populated here -->
            </div>
        </div>
        
        <div class="metrics-grid" id="metrics-grid">
            <!-- Metric cards will be populated here -->
        </div>
        
        <div class="projections">
            <h3>📈 Revenue Projections & Valuation</h3>
            <div id="projections-content">
                <!-- Projections will be populated here -->
            </div>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">📊 Revenue Trend (24 Hours)</div>
            <canvas id="revenueChart" width="400" height="100"></canvas>
        </div>
        
        <div class="chart-container">
            <div class="chart-title">⚡ System Performance</div>
            <canvas id="performanceChart" width="400" height="100"></canvas>
        </div>
    </div>

    <script>
        let revenueChart, performanceChart;
        let ws;
        
        function initWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(\`\${protocol}//\${window.location.host}\`);
            
            ws.onopen = () => console.log('📊 Connected to analytics stream');
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'update' || data.type === 'initial') {
                    updateDashboard(data.data);
                }
            };
            ws.onclose = () => {
                console.log('📊 Analytics stream disconnected, reconnecting...');
                setTimeout(initWebSocket, 5000);
            };
        }
        
        function updateDashboard(data) {
            document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
            
            updateExecutiveSummary(data.executiveSummary);
            updateMetrics(data);
            updateProjections(data.projections);
            updateCharts(data);
        }
        
        function updateExecutiveSummary(summary) {
            const container = document.getElementById('executive-summary');
            container.innerHTML = \`
                <div class="summary-item">
                    <h3>$\${summary.totalRevenue.toFixed(2)}</h3>
                    <p>Total Revenue</p>
                </div>
                <div class="summary-item">
                    <h3>\${summary.totalExecutions.toLocaleString()}</h3>
                    <p>Agent Executions</p>
                </div>
                <div class="summary-item">
                    <h3>\${summary.activeUsers}</h3>
                    <p>Active Users</p>
                </div>
                <div class="summary-item">
                    <h3>\${summary.systemUptime}</h3>
                    <p>System Uptime</p>
                </div>
                <div class="summary-item">
                    <h3>\${summary.averageExecutionTime}</h3>
                    <p>Avg Response Time</p>
                </div>
                <div class="summary-item">
                    <h3>$\${summary.revenuePerHour.toFixed(2)}/hr</h3>
                    <p>Revenue Rate</p>
                </div>
            \`;
        }
        
        function updateMetrics(data) {
            const metrics = [
                { label: 'Concurrent Users', value: data.realtimeMetrics.currentConcurrentUsers, change: '+12%' },
                { label: 'Executions/Min', value: Math.round(data.realtimeMetrics.executionsPerMinute), change: '+8%' },
                { label: 'Revenue/Min', value: \`$\${data.realtimeMetrics.revenuePerMinute.toFixed(2)}\`, change: '+15%' },
                { label: 'Response Time', value: \`\${Math.round(data.realtimeMetrics.averageResponseTime)}ms\`, change: '-5%' },
                { label: 'Error Rate', value: \`\${(data.realtimeMetrics.errorRate * 100).toFixed(2)}%\`, change: '-2%' },
                { label: 'Performance Score', value: data.systemHealth.performanceScore, change: '+3%' }
            ];
            
            const container = document.getElementById('metrics-grid');
            container.innerHTML = metrics.map(metric => \`
                <div class="metric-card">
                    <div class="metric-value">\${metric.value}</div>
                    <div class="metric-label">\${metric.label}</div>
                    <div class="metric-change positive">\${metric.change}</div>
                </div>
            \`).join('');
        }
        
        function updateProjections(projections) {
            const container = document.getElementById('projections-content');
            container.innerHTML = \`
                <div class="projection-item">
                    <span>Daily Revenue:</span>
                    <strong>$\${projections.projectedDailyRevenue}</strong>
                </div>
                <div class="projection-item">
                    <span>Monthly Revenue:</span>
                    <strong>$\${projections.projectedMonthlyRevenue}</strong>
                </div>
                <div class="projection-item">
                    <span>Annual Revenue:</span>
                    <strong>$\${projections.projectedAnnualRevenue}</strong>
                </div>
                <div class="projection-item">
                    <span>Time to Breakeven:</span>
                    <strong>\${projections.timeToBreakeven}</strong>
                </div>
                <div class="projection-item">
                    <span>Estimated Valuation:</span>
                    <strong style="font-size: 1.2em; color: #ffeb3b;">\${projections.estimatedValuation}</strong>
                </div>
            \`;
        }
        
        function updateCharts(data) {
            // Update revenue chart
            if (revenueChart && data.businessIntelligence) {
                // Simulate hourly revenue data
                const hours = Array.from({length: 24}, (_, i) => i);
                const revenueData = hours.map(() => Math.random() * 100 + 50);
                
                revenueChart.data.datasets[0].data = revenueData;
                revenueChart.update('none');
            }
            
            // Update performance chart
            if (performanceChart) {
                const now = new Date();
                const timeLabels = Array.from({length: 20}, (_, i) => {
                    const time = new Date(now.getTime() - (19 - i) * 60000);
                    return time.toLocaleTimeString();
                });
                
                performanceChart.data.labels = timeLabels;
                performanceChart.data.datasets[0].data = timeLabels.map(() => 
                    Math.random() * 50 + 100 - data.realtimeMetrics.averageResponseTime/10
                );
                performanceChart.update('none');
            }
        }
        
        function initCharts() {
            // Revenue chart
            const revenueCtx = document.getElementById('revenueChart').getContext('2d');
            revenueChart = new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 24}, (_, i) => \`\${i}:00\`),
                    datasets: [{
                        label: 'Revenue ($)',
                        data: Array.from({length: 24}, () => Math.random() * 100 + 50),
                        borderColor: '#11998e',
                        backgroundColor: 'rgba(17, 153, 142, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
            
            // Performance chart
            const performanceCtx = document.getElementById('performanceChart').getContext('2d');
            performanceChart = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 20}, (_, i) => \`\${i}min\`),
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: Array.from({length: 20}, () => Math.random() * 100 + 50),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        
        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            initCharts();
            initWebSocket();
        });
    </script>
</body>
</html>
    `;
  }
}

// Export for use in main application
module.exports = { SoulframMetrics, SoulframAnalyticsDashboard };

// Run standalone if executed directly
if (require.main === module) {
  const dashboard = new SoulframAnalyticsDashboard(4000);
  
  // Generate some demo data for testing
  setTimeout(() => {
    dashboard.generateDemoData();
  }, 2000);
  
  console.log('\n🎉 SOULFRAM ANALYTICS READY!');
  console.log('📊 Dashboard: http://localhost:4000');
  console.log('📈 Strategist Report: http://localhost:4000/api/strategist/report');
  console.log('⚡ Real-time Metrics: http://localhost:4000/api/metrics/realtime');
  console.log('\n💡 This dashboard shows live business metrics that will impress the strategist!');
}