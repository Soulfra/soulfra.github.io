// 🔍 SOULFRA HEALTH & DISCOVERY SYSTEM
// Cross-Ring Monitoring and Service Discovery
// Provides health monitoring, service discovery, and system orchestration across all architecture rings

import EventEmitter from 'events';
import http from 'http';
import https from 'https';
import chalk from 'chalk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class SoulfrHealthDiscoverySystem extends EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.healthChecks = new Map();
        this.serviceEndpoints = new Map();
        this.topologyMap = new Map();
        this.metrics = new Map();
        this.alerts = [];
        this.checkInterval = 30000; // 30 seconds
        this.rings = {
            outer: 'api-gateway',
            middle: 'service-mesh', 
            inner: 'vault-protection'
        };
        
        this.initializeDiscoverySystem();
        this.startHealthMonitoring();
        this.startMetricsCollection();
    }

    initializeDiscoverySystem() {
        // Initialize ring topology
        this.topologyMap.set('outer-ring', {
            name: 'API Gateway Router',
            services: ['api-gateway', 'web-server', 'websocket-server'],
            port: 3000,
            healthEndpoint: '/health',
            dependencies: ['middle-ring']
        });

        this.topologyMap.set('middle-ring', {
            name: 'Service Mesh',
            services: ['service-mesh', 'load-balancer', 'circuit-breaker'],
            port: 7777,
            healthEndpoint: '/mesh/health',
            dependencies: ['inner-ring', 'runtime-services']
        });

        this.topologyMap.set('inner-ring', {
            name: 'Vault Protection',
            services: ['vault-system', 'agent-isolation', 'security-monitor'],
            port: 8888,
            healthEndpoint: '/vault/health',
            dependencies: []
        });

        this.topologyMap.set('runtime-services', {
            name: 'Soulfra Runtime Services',
            services: ['soulfra-runtime', 'consciousness-debates', 'economic-mirror', 'payment-processor'],
            dependencies: []
        });

        console.log(chalk.blue('🔍 Health & Discovery System initialized'));
        console.log(chalk.gray(`   Monitoring ${this.topologyMap.size} service rings`));
    }

    registerService(serviceName, config) {
        const serviceId = crypto.randomUUID();
        const service = {
            id: serviceId,
            name: serviceName,
            host: config.host || 'localhost',
            port: config.port,
            healthEndpoint: config.healthEndpoint || '/health',
            ring: config.ring || 'runtime-services',
            tags: config.tags || [],
            metadata: config.metadata || {},
            registeredAt: Date.now(),
            lastHealthCheck: null,
            healthy: false,
            consecutiveFailures: 0,
            totalChecks: 0,
            totalFailures: 0
        };

        this.services.set(serviceId, service);
        this.serviceEndpoints.set(serviceName, service);

        console.log(chalk.green(`✅ Service registered: ${serviceName} (${config.host}:${config.port})`));
        
        // Immediate health check
        this.performHealthCheck(serviceId);
        
        this.emit('service_registered', service);
        return serviceId;
    }

    unregisterService(serviceName) {
        const service = this.serviceEndpoints.get(serviceName);
        if (service) {
            this.services.delete(service.id);
            this.serviceEndpoints.delete(serviceName);
            this.healthChecks.delete(service.id);
            
            console.log(chalk.yellow(`❌ Service unregistered: ${serviceName}`));
            this.emit('service_unregistered', service);
        }
    }

    async performHealthCheck(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;

        const healthUrl = `http://${service.host}:${service.port}${service.healthEndpoint}`;
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(healthUrl, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Soulfra-Health-Check/1.0',
                    'X-Health-Check': 'true'
                }
            });

            clearTimeout(timeoutId);
            
            const responseTime = Date.now() - startTime;
            const healthy = response.ok;
            
            // Parse health response
            let healthData = {};
            try {
                healthData = await response.json();
            } catch (e) {
                healthData = { status: response.ok ? 'ok' : 'error' };
            }

            const healthCheck = {
                serviceId,
                serviceName: service.name,
                timestamp: Date.now(),
                healthy,
                responseTime,
                statusCode: response.status,
                healthData,
                error: null
            };

            this.recordHealthCheck(serviceId, healthCheck);
            
            if (healthy) {
                service.consecutiveFailures = 0;
            } else {
                service.consecutiveFailures++;
                this.handleServiceFailure(service, healthCheck);
            }

        } catch (error) {
            const responseTime = Date.now() - startTime;
            const healthCheck = {
                serviceId,
                serviceName: service.name,
                timestamp: Date.now(),
                healthy: false,
                responseTime,
                statusCode: null,
                healthData: null,
                error: error.message
            };

            this.recordHealthCheck(serviceId, healthCheck);
            service.consecutiveFailures++;
            this.handleServiceFailure(service, healthCheck);
        }

        service.totalChecks++;
        service.lastHealthCheck = Date.now();
    }

    recordHealthCheck(serviceId, healthCheck) {
        if (!this.healthChecks.has(serviceId)) {
            this.healthChecks.set(serviceId, []);
        }

        const checks = this.healthChecks.get(serviceId);
        checks.push(healthCheck);

        // Keep only last 100 checks
        if (checks.length > 100) {
            checks.splice(0, checks.length - 100);
        }

        const service = this.services.get(serviceId);
        if (service) {
            service.healthy = healthCheck.healthy;
            if (!healthCheck.healthy) {
                service.totalFailures++;
            }
        }

        // Update metrics
        this.updateHealthMetrics(serviceId, healthCheck);
    }

    handleServiceFailure(service, healthCheck) {
        console.warn(chalk.yellow(`⚠️  Service ${service.name} health check failed (${service.consecutiveFailures} consecutive)`));
        
        if (service.consecutiveFailures >= 3) {
            this.generateAlert({
                type: 'service_unhealthy',
                severity: 'warning',
                service: service.name,
                message: `Service ${service.name} has failed ${service.consecutiveFailures} consecutive health checks`,
                timestamp: Date.now(),
                details: healthCheck
            });
        }

        if (service.consecutiveFailures >= 5) {
            this.generateAlert({
                type: 'service_critical',
                severity: 'critical',
                service: service.name,
                message: `Service ${service.name} is critically unhealthy`,
                timestamp: Date.now(),
                details: healthCheck
            });

            // Trigger circuit breaker
            this.emit('service_critical', service);
        }
    }

    generateAlert(alert) {
        this.alerts.push(alert);
        
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts.splice(0, this.alerts.length - 1000);
        }

        console.error(chalk.red(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`));
        this.emit('alert', alert);
    }

    updateHealthMetrics(serviceId, healthCheck) {
        const service = this.services.get(serviceId);
        if (!service) return;

        const metricsKey = `service_${service.name}`;
        
        if (!this.metrics.has(metricsKey)) {
            this.metrics.set(metricsKey, {
                service: service.name,
                totalRequests: 0,
                successfulRequests: 0,
                avgResponseTime: 0,
                responseTimes: [],
                uptime: 0,
                lastUpdated: Date.now()
            });
        }

        const metrics = this.metrics.get(metricsKey);
        metrics.totalRequests++;
        
        if (healthCheck.healthy) {
            metrics.successfulRequests++;
        }

        // Update response times
        metrics.responseTimes.push(healthCheck.responseTime);
        if (metrics.responseTimes.length > 50) {
            metrics.responseTimes.splice(0, metrics.responseTimes.length - 50);
        }

        metrics.avgResponseTime = metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length;
        metrics.uptime = (metrics.successfulRequests / metrics.totalRequests) * 100;
        metrics.lastUpdated = Date.now();
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.performAllHealthChecks();
        }, this.checkInterval);

        console.log(chalk.blue(`🔄 Health monitoring started (interval: ${this.checkInterval}ms)`));
    }

    async performAllHealthChecks() {
        const promises = Array.from(this.services.keys()).map(serviceId => 
            this.performHealthCheck(serviceId).catch(error => 
                console.error(chalk.red(`Health check error for ${serviceId}:`, error.message))
            )
        );

        await Promise.allSettled(promises);
    }

    startMetricsCollection() {
        setInterval(() => {
            this.collectSystemMetrics();
            this.cleanupOldData();
        }, 60000); // Every minute

        console.log(chalk.blue('📊 Metrics collection started'));
    }

    collectSystemMetrics() {
        const systemMetrics = {
            timestamp: Date.now(),
            services: {
                total: this.services.size,
                healthy: Array.from(this.services.values()).filter(s => s.healthy).length,
                unhealthy: Array.from(this.services.values()).filter(s => !s.healthy).length
            },
            rings: {
                outer: this.getRingHealth('outer-ring'),
                middle: this.getRingHealth('middle-ring'),
                inner: this.getRingHealth('inner-ring'),
                runtime: this.getRingHealth('runtime-services')
            },
            alerts: {
                total: this.alerts.length,
                critical: this.alerts.filter(a => a.severity === 'critical').length,
                warning: this.alerts.filter(a => a.severity === 'warning').length
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                cpu: process.cpuUsage()
            }
        };

        this.metrics.set('system_overview', systemMetrics);
    }

    getRingHealth(ringName) {
        const ring = this.topologyMap.get(ringName);
        if (!ring) return { healthy: false, services: 0 };

        const ringServices = Array.from(this.services.values())
            .filter(s => s.ring === ringName || ring.services.includes(s.name));

        return {
            healthy: ringServices.every(s => s.healthy),
            services: ringServices.length,
            healthyServices: ringServices.filter(s => s.healthy).length,
            avgResponseTime: ringServices.reduce((sum, s) => {
                const metrics = this.metrics.get(`service_${s.name}`);
                return sum + (metrics ? metrics.avgResponseTime : 0);
            }, 0) / (ringServices.length || 1)
        };
    }

    cleanupOldData() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        // Clean old alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo);
        
        // Clean old health check data
        for (const [serviceId, checks] of this.healthChecks) {
            const recentChecks = checks.filter(check => check.timestamp > oneHourAgo);
            this.healthChecks.set(serviceId, recentChecks);
        }
    }

    // Service Discovery Methods
    discoverService(serviceName) {
        return this.serviceEndpoints.get(serviceName);
    }

    discoverServicesByTag(tag) {
        return Array.from(this.services.values())
            .filter(service => service.tags.includes(tag) && service.healthy);
    }

    discoverServicesByRing(ringName) {
        return Array.from(this.services.values())
            .filter(service => service.ring === ringName && service.healthy);
    }

    getServiceEndpoint(serviceName) {
        const service = this.discoverService(serviceName);
        if (service && service.healthy) {
            return `http://${service.host}:${service.port}`;
        }
        return null;
    }

    // Public API Methods
    getSystemHealth() {
        return {
            healthy: Array.from(this.services.values()).every(s => s.healthy),
            services: this.services.size,
            healthyServices: Array.from(this.services.values()).filter(s => s.healthy).length,
            rings: {
                outer: this.getRingHealth('outer-ring'),
                middle: this.getRingHealth('middle-ring'),
                inner: this.getRingHealth('inner-ring'),
                runtime: this.getRingHealth('runtime-services')
            },
            alerts: this.alerts.length,
            uptime: process.uptime(),
            timestamp: Date.now()
        };
    }

    getServiceList() {
        return Array.from(this.services.values()).map(service => ({
            id: service.id,
            name: service.name,
            endpoint: `${service.host}:${service.port}`,
            ring: service.ring,
            healthy: service.healthy,
            responseTime: this.metrics.get(`service_${service.name}`)?.avgResponseTime || 0,
            uptime: this.metrics.get(`service_${service.name}`)?.uptime || 0,
            lastCheck: service.lastHealthCheck
        }));
    }

    getServiceDetails(serviceName) {
        const service = this.serviceEndpoints.get(serviceName);
        if (!service) return null;

        const healthHistory = this.healthChecks.get(service.id) || [];
        const metrics = this.metrics.get(`service_${serviceName}`) || {};

        return {
            service,
            metrics,
            healthHistory: healthHistory.slice(-10), // Last 10 checks
            alerts: this.alerts.filter(alert => alert.service === serviceName).slice(-10)
        };
    }

    getAlerts(severity = null) {
        if (severity) {
            return this.alerts.filter(alert => alert.severity === severity);
        }
        return this.alerts;
    }

    getTopology() {
        return {
            rings: Array.from(this.topologyMap.entries()).map(([name, config]) => ({
                name,
                ...config,
                health: this.getRingHealth(name)
            })),
            serviceMap: Array.from(this.services.values()).reduce((map, service) => {
                if (!map[service.ring]) map[service.ring] = [];
                map[service.ring].push({
                    name: service.name,
                    endpoint: `${service.host}:${service.port}`,
                    healthy: service.healthy
                });
                return map;
            }, {})
        };
    }

    // Auto-register common Soulfra services
    autoRegisterSoulfrServices() {
        const commonServices = [
            { name: 'api-gateway', port: 3000, ring: 'outer-ring', tags: ['gateway', 'public'] },
            { name: 'service-mesh', port: 7777, ring: 'middle-ring', tags: ['mesh', 'internal'] },
            { name: 'vault-protection', port: 8888, ring: 'inner-ring', tags: ['vault', 'security'] },
            { name: 'soulfra-runtime', port: 8080, ring: 'runtime-services', tags: ['runtime', 'core'] },
            { name: 'consciousness-debates', port: 8081, ring: 'runtime-services', tags: ['ai', 'debates'] },
            { name: 'economic-mirror', port: 8082, ring: 'runtime-services', tags: ['economics', 'mirror'] },
            { name: 'payment-processor', port: 8083, ring: 'runtime-services', tags: ['payment', 'legal'] }
        ];

        for (const service of commonServices) {
            this.registerService(service.name, service);
        }

        console.log(chalk.green(`🚀 Auto-registered ${commonServices.length} Soulfra services`));
    }

    shutdown() {
        console.log(chalk.yellow('🛑 Shutting down Health & Discovery System...'));
        
        // Clear all intervals
        clearInterval(this.healthMonitoringInterval);
        clearInterval(this.metricsCollectionInterval);
        
        console.log(chalk.green('✅ Health & Discovery System shutdown complete'));
    }
}

// Export class
export { SoulfrHealthDiscoverySystem };

// Start system if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const healthSystem = new SoulfrHealthDiscoverySystem();
    
    // Auto-register Soulfra services
    healthSystem.autoRegisterSoulfrServices();
    
    // Create a simple HTTP server for health system API
    const server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        try {
            switch (url.pathname) {
                case '/health':
                    res.writeHead(200);
                    res.end(JSON.stringify(healthSystem.getSystemHealth()));
                    break;
                    
                case '/services':
                    res.writeHead(200);
                    res.end(JSON.stringify(healthSystem.getServiceList()));
                    break;
                    
                case '/topology':
                    res.writeHead(200);
                    res.end(JSON.stringify(healthSystem.getTopology()));
                    break;
                    
                case '/alerts':
                    const severity = url.searchParams.get('severity');
                    res.writeHead(200);
                    res.end(JSON.stringify(healthSystem.getAlerts(severity)));
                    break;
                    
                default:
                    if (url.pathname.startsWith('/service/')) {
                        const serviceName = url.pathname.split('/')[2];
                        const details = healthSystem.getServiceDetails(serviceName);
                        if (details) {
                            res.writeHead(200);
                            res.end(JSON.stringify(details));
                        } else {
                            res.writeHead(404);
                            res.end(JSON.stringify({ error: 'Service not found' }));
                        }
                    } else {
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: 'Endpoint not found' }));
                    }
            }
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    });
    
    const port = process.env.HEALTH_PORT || 9090;
    server.listen(port, () => {
        console.log(chalk.green.bold(`\n🔍 SOULFRA HEALTH & DISCOVERY SYSTEM ONLINE`));
        console.log(chalk.blue(`   Health API: http://localhost:${port}/health`));
        console.log(chalk.blue(`   Service List: http://localhost:${port}/services`));
        console.log(chalk.blue(`   Topology: http://localhost:${port}/topology`));
        console.log(chalk.blue(`   Alerts: http://localhost:${port}/alerts`));
        console.log(chalk.gray(`   Service Discovery: /service/{name}`));
        console.log(chalk.green(`\n✅ Monitoring ${healthSystem.services.size} services across all rings\n`));
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Health & Discovery System...');
        healthSystem.shutdown();
        server.close();
        process.exit(0);
    });
}