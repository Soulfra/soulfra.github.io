// ENTERPRISE MONITORING & ALERTING SYSTEM
// Shows junior devs what real production monitoring looks like

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class EnterpriseMonitoringSystem extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.alerts = new Map();
        this.thresholds = new Map();
        this.subscribers = new Map();
        this.metricHistory = [];
        this.alertHistory = [];
        this.startTime = Date.now();
        
        this.initializeDefaultThresholds();
        this.startMetricCollection();
        this.setupAlertHandlers();
    }

    initializeDefaultThresholds() {
        // Performance thresholds
        this.setThreshold('response_time_p95', { critical: 1000, warning: 500 }); // ms
        this.setThreshold('error_rate', { critical: 0.05, warning: 0.02 }); // 5% critical, 2% warning
        this.setThreshold('memory_usage', { critical: 0.9, warning: 0.8 }); // 90% critical, 80% warning
        this.setThreshold('cpu_usage', { critical: 0.9, warning: 0.8 });
        
        // Business thresholds
        this.setThreshold('failed_executions_per_minute', { critical: 10, warning: 5 });
        this.setThreshold('trust_score_violations_per_hour', { critical: 20, warning: 10 });
        this.setThreshold('revenue_drop_percentage', { critical: 0.3, warning: 0.15 }); // 30% drop critical
        
        // Security thresholds
        this.setThreshold('suspicious_activity_score', { critical: 0.8, warning: 0.6 });
        this.setThreshold('rate_limit_violations_per_minute', { critical: 100, warning: 50 });
    }

    setThreshold(metric, thresholds) {
        this.thresholds.set(metric, thresholds);
    }

    recordMetric(name, value, tags = {}) {
        const timestamp = Date.now();
        const metric = {
            name,
            value,
            timestamp,
            tags
        };

        // Store current value
        this.metrics.set(name, metric);
        
        // Add to history (keep last 1000 points)
        this.metricHistory.push(metric);
        if (this.metricHistory.length > 1000) {
            this.metricHistory.shift();
        }

        // Check for threshold violations
        this.checkThresholds(name, value);
        
        // Emit metric event
        this.emit('metric', metric);
    }

    checkThresholds(metricName, value) {
        const threshold = this.thresholds.get(metricName);
        if (!threshold) return;

        let alertLevel = null;
        let message = '';

        if (value >= threshold.critical) {
            alertLevel = 'critical';
            message = `CRITICAL: ${metricName} is ${value} (threshold: ${threshold.critical})`;
        } else if (value >= threshold.warning) {
            alertLevel = 'warning';
            message = `WARNING: ${metricName} is ${value} (threshold: ${threshold.warning})`;
        }

        if (alertLevel) {
            this.triggerAlert(metricName, alertLevel, message, value);
        }
    }

    triggerAlert(metricName, level, message, value) {
        const alertId = `${metricName}_${level}_${Date.now()}`;
        const alert = {
            id: alertId,
            metric: metricName,
            level,
            message,
            value,
            timestamp: Date.now(),
            resolved: false
        };

        this.alerts.set(alertId, alert);
        this.alertHistory.push(alert);

        // Emit alert event
        this.emit('alert', alert);

        // Send notifications
        this.sendNotifications(alert);

        console.log(`🚨 ALERT [${level.toUpperCase()}]: ${message}`);
    }

    sendNotifications(alert) {
        // Slack notification
        this.sendSlackAlert(alert);
        
        // Email notification (for critical alerts)
        if (alert.level === 'critical') {
            this.sendEmailAlert(alert);
        }
        
        // PagerDuty integration (for critical alerts)
        if (alert.level === 'critical') {
            this.sendPagerDutyAlert(alert);
        }
    }

    sendSlackAlert(alert) {
        // Mock Slack integration
        const webhook = {
            text: `🚨 Soulfra Alert: ${alert.message}`,
            channel: '#soulfra-alerts',
            username: 'Soulfra Monitor',
            icon_emoji: alert.level === 'critical' ? ':fire:' : ':warning:',
            attachments: [{
                color: alert.level === 'critical' ? 'danger' : 'warning',
                fields: [
                    { title: 'Metric', value: alert.metric, short: true },
                    { title: 'Value', value: alert.value, short: true },
                    { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: true }
                ]
            }]
        };

        // In production, send to actual Slack webhook
        console.log('📱 Slack Alert:', JSON.stringify(webhook, null, 2));
    }

    sendEmailAlert(alert) {
        // Mock email integration
        const email = {
            to: 'engineering@soulfra.ai',
            subject: `[CRITICAL] Soulfra Platform Alert: ${alert.metric}`,
            body: `
CRITICAL ALERT TRIGGERED

Metric: ${alert.metric}
Value: ${alert.value}
Message: ${alert.message}
Time: ${new Date(alert.timestamp).toISOString()}

Platform Status: http://localhost:3000/status
Logs: http://localhost:3000/logs

Immediate action required.

- Soulfra Monitoring System
            `
        };

        console.log('📧 Email Alert:', email);
    }

    sendPagerDutyAlert(alert) {
        // Mock PagerDuty integration
        const incident = {
            routing_key: 'soulfra-production-key',
            event_action: 'trigger',
            payload: {
                summary: `Soulfra: ${alert.message}`,
                source: 'soulfra-monitoring',
                severity: 'critical',
                component: alert.metric,
                group: 'platform',
                class: 'performance'
            }
        };

        console.log('📟 PagerDuty Alert:', incident);
    }

    // Business Intelligence Metrics
    trackBusinessMetrics(execution) {
        // Revenue tracking
        this.recordMetric('revenue_per_minute', this.calculateRevenuePerMinute());
        this.recordMetric('executions_per_minute', this.calculateExecutionsPerMinute());
        
        // User engagement
        this.recordMetric('active_users_last_hour', this.getActiveUsersLastHour());
        this.recordMetric('avg_session_duration', this.getAverageSessionDuration());
        
        // Agent performance
        this.recordMetric('avg_agent_response_time', execution.duration);
        this.recordMetric('agent_success_rate', execution.status === 'completed' ? 1 : 0);
        
        // Trust system health
        this.recordMetric('avg_platform_trust_score', this.getAverageTrustScore());
        this.recordMetric('trust_violations_per_hour', this.getTrustViolationsPerHour());
    }

    // System Performance Metrics
    trackSystemMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        this.recordMetric('memory_usage_mb', memUsage.heapUsed / 1024 / 1024);
        this.recordMetric('memory_usage_percentage', memUsage.heapUsed / memUsage.heapTotal);
        this.recordMetric('cpu_user_time', cpuUsage.user);
        this.recordMetric('cpu_system_time', cpuUsage.system);
        
        // Event loop lag
        const start = process.hrtime();
        setImmediate(() => {
            const delta = process.hrtime(start);
            const lag = (delta[0] * 1e9 + delta[1]) / 1e6; // Convert to milliseconds
            this.recordMetric('event_loop_lag_ms', lag);
        });
    }

    // Security Metrics
    trackSecurityMetrics(req, violation = null) {
        if (violation) {
            this.recordMetric('security_violations_per_minute', 1);
            this.recordMetric('suspicious_activity_score', violation.riskScore);
        }
        
        // Rate limiting violations
        if (req.rateLimit && req.rateLimit.remaining <= 0) {
            this.recordMetric('rate_limit_violations_per_minute', 1);
        }
        
        // Failed authentication attempts
        if (req.path.includes('/auth') && !req.body.success) {
            this.recordMetric('failed_auth_attempts_per_minute', 1);
        }
    }

    // Advanced Analytics
    calculateRevenuePerMinute() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentRevenue = this.metricHistory
            .filter(m => m.name === 'execution_revenue' && m.timestamp > oneMinuteAgo)
            .reduce((sum, m) => sum + m.value, 0);
        return recentRevenue;
    }

    calculateExecutionsPerMinute() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentExecutions = this.metricHistory
            .filter(m => m.name === 'agent_execution' && m.timestamp > oneMinuteAgo)
            .length;
        return recentExecutions;
    }

    getActiveUsersLastHour() {
        const oneHourAgo = Date.now() - 3600000;
        const activeUsers = new Set(
            this.metricHistory
                .filter(m => m.name === 'user_activity' && m.timestamp > oneHourAgo)
                .map(m => m.tags.userId)
        );
        return activeUsers.size;
    }

    getAverageTrustScore() {
        const trustScores = this.metricHistory
            .filter(m => m.name === 'user_trust_score')
            .slice(-100) // Last 100 scores
            .map(m => m.value);
        
        return trustScores.length > 0 
            ? trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length 
            : 75;
    }

    // Health Check System
    async performHealthCheck() {
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            uptime: Date.now() - this.startTime,
            services: {},
            metrics: {},
            alerts: {
                active: Array.from(this.alerts.values()).filter(a => !a.resolved).length,
                critical: Array.from(this.alerts.values()).filter(a => !a.resolved && a.level === 'critical').length
            }
        };

        // Check individual services
        health.services.database = await this.checkDatabaseHealth();
        health.services.trust_engine = await this.checkTrustEngineHealth();
        health.services.agent_executor = await this.checkAgentExecutorHealth();
        health.services.payment_processor = await this.checkPaymentProcessorHealth();

        // Calculate overall health
        const unhealthyServices = Object.values(health.services).filter(s => s.status !== 'healthy');
        if (unhealthyServices.length === 0) {
            health.status = 'healthy';
        } else if (unhealthyServices.length <= 1) {
            health.status = 'degraded';
        } else {
            health.status = 'unhealthy';
        }

        // Add key metrics
        health.metrics = {
            response_time_p95: this.getPercentile('response_time', 95),
            error_rate: this.getErrorRate(),
            throughput: this.getThroughput(),
            memory_usage: this.getCurrentMetric('memory_usage_percentage')
        };

        return health;
    }

    async checkDatabaseHealth() {
        // Mock database health check
        return {
            status: 'healthy',
            response_time: Math.random() * 10 + 5, // 5-15ms
            connections: {
                active: Math.floor(Math.random() * 10),
                total: 20
            }
        };
    }

    async checkTrustEngineHealth() {
        return {
            status: 'healthy',
            avg_calculation_time: Math.random() * 50 + 10, // 10-60ms
            trust_scores_calculated: this.metricHistory.filter(m => m.name === 'trust_score_calculation').length
        };
    }

    async checkAgentExecutorHealth() {
        return {
            status: 'healthy',
            concurrent_executions: Math.floor(Math.random() * 20),
            avg_execution_time: Math.random() * 1000 + 500, // 500-1500ms
            success_rate: 0.98
        };
    }

    async checkPaymentProcessorHealth() {
        return {
            status: 'healthy',
            pending_transactions: Math.floor(Math.random() * 5),
            payment_success_rate: 0.999
        };
    }

    // Utility methods
    getPercentile(metricName, percentile) {
        const values = this.metricHistory
            .filter(m => m.name === metricName)
            .map(m => m.value)
            .sort((a, b) => a - b);
        
        if (values.length === 0) return 0;
        
        const index = Math.ceil((percentile / 100) * values.length) - 1;
        return values[index] || 0;
    }

    getErrorRate() {
        const totalRequests = this.metricHistory.filter(m => m.name === 'request').length;
        const errorRequests = this.metricHistory.filter(m => m.name === 'request_error').length;
        return totalRequests > 0 ? errorRequests / totalRequests : 0;
    }

    getThroughput() {
        const fiveMinutesAgo = Date.now() - 300000;
        const recentRequests = this.metricHistory
            .filter(m => m.name === 'request' && m.timestamp > fiveMinutesAgo)
            .length;
        return recentRequests / 5; // requests per minute
    }

    getCurrentMetric(name) {
        const metric = this.metrics.get(name);
        return metric ? metric.value : 0;
    }

    // Automatic incident detection
    detectIncidents() {
        const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
        const criticalAlerts = activeAlerts.filter(a => a.level === 'critical');
        
        if (criticalAlerts.length >= 3) {
            this.createIncident('Multiple critical alerts detected', criticalAlerts);
        }
        
        // Check for cascading failures
        const recentAlerts = activeAlerts.filter(a => a.timestamp > Date.now() - 300000); // Last 5 minutes
        if (recentAlerts.length >= 5) {
            this.createIncident('Potential cascading failure detected', recentAlerts);
        }
    }

    createIncident(description, relatedAlerts) {
        const incident = {
            id: `incident_${Date.now()}`,
            description,
            severity: 'high',
            status: 'open',
            created: Date.now(),
            relatedAlerts: relatedAlerts.map(a => a.id),
            assignee: 'on-call-engineer'
        };

        console.log('🚨🚨🚨 INCIDENT CREATED:', incident);
        
        // Auto-page oncall engineer
        this.sendPagerDutyAlert({
            level: 'critical',
            message: `INCIDENT: ${description}`,
            metric: 'incident_detection'
        });
    }

    // Dashboard data for monitoring UI
    getDashboardData() {
        return {
            overview: {
                status: this.getSystemStatus(),
                uptime: Date.now() - this.startTime,
                activeAlerts: Array.from(this.alerts.values()).filter(a => !a.resolved).length,
                throughput: this.getThroughput()
            },
            metrics: {
                responseTime: this.getMetricTimeSeries('response_time', 24), // Last 24 hours
                errorRate: this.getMetricTimeSeries('error_rate', 24),
                revenue: this.getMetricTimeSeries('revenue_per_minute', 24),
                trustScore: this.getMetricTimeSeries('avg_platform_trust_score', 24)
            },
            alerts: this.alertHistory.slice(-20), // Last 20 alerts
            topErrors: this.getTopErrors(),
            slowestEndpoints: this.getSlowestEndpoints()
        };
    }

    getMetricTimeSeries(metricName, hours) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return this.metricHistory
            .filter(m => m.name === metricName && m.timestamp > cutoff)
            .map(m => ({ timestamp: m.timestamp, value: m.value }));
    }

    getSystemStatus() {
        const criticalAlerts = Array.from(this.alerts.values())
            .filter(a => !a.resolved && a.level === 'critical');
        
        if (criticalAlerts.length > 0) return 'critical';
        
        const warningAlerts = Array.from(this.alerts.values())
            .filter(a => !a.resolved && a.level === 'warning');
        
        return warningAlerts.length > 0 ? 'warning' : 'healthy';
    }

    // Start metric collection
    startMetricCollection() {
        // Collect system metrics every 10 seconds
        setInterval(() => {
            this.trackSystemMetrics();
        }, 10000);

        // Check for incidents every minute
        setInterval(() => {
            this.detectIncidents();
        }, 60000);

        // Clean up old metrics every hour
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 3600000);
    }

    cleanupOldMetrics() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        this.metricHistory = this.metricHistory.filter(m => m.timestamp > cutoff);
        
        // Clean up resolved alerts older than 7 days
        const alertCutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.alertHistory = this.alertHistory.filter(a => 
            !a.resolved || a.timestamp > alertCutoff
        );
    }

    setupAlertHandlers() {
        this.on('alert', (alert) => {
            // Log alert to file
            this.logAlertToFile(alert);
            
            // Update alert dashboard
            this.updateAlertDashboard(alert);
        });
    }

    logAlertToFile(alert) {
        const logEntry = `${new Date(alert.timestamp).toISOString()} [${alert.level.toUpperCase()}] ${alert.message}\n`;
        fs.appendFileSync('logs/alerts.log', logEntry);
    }

    updateAlertDashboard(alert) {
        // In a real implementation, this would update a real-time dashboard
        // For now, we'll just emit a websocket event
        this.emit('dashboard_update', {
            type: 'alert',
            data: alert
        });
    }
}

// Export the monitoring system
module.exports = EnterpriseMonitoringSystem;