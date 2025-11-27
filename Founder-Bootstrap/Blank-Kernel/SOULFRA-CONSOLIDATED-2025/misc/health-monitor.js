#!/usr/bin/env node

/**
 * Health Monitor - External Source of Truth
 * 
 * Continuously monitors platform status and writes to readable files
 * This gives Claude a decentralized way to see what's actually running
 */

const fs = require('fs').promises;
const http = require('http');
const path = require('path');

class HealthMonitor {
    constructor() {
        this.services = [
            { name: 'Cal Interface', port: 4040, endpoint: '/' },
            { name: 'Infinity Router', port: 5050, endpoint: '/' },
            { name: 'Semantic API', port: 3666, endpoint: '/api/system/health' },
            { name: 'Main Dashboard', port: 3000, endpoint: '/' },
            { name: 'MirrorOS', port: 3080, endpoint: '/health' }
        ];
        
        this.statusFile = './platform-status.json';
        this.logFile = './health-monitor.log';
        this.isRunning = false;
    }
    
    async checkService(service) {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: service.port,
                path: service.endpoint,
                method: 'GET',
                timeout: 3000
            }, (res) => {
                resolve({
                    ...service,
                    status: 'online',
                    statusCode: res.statusCode,
                    timestamp: new Date().toISOString()
                });
            });
            
            req.on('error', () => {
                resolve({
                    ...service,
                    status: 'offline',
                    statusCode: null,
                    timestamp: new Date().toISOString()
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    ...service,
                    status: 'timeout',
                    statusCode: null,
                    timestamp: new Date().toISOString()
                });
            });
            
            req.end();
        });
    }
    
    async checkAllServices() {
        const results = await Promise.all(
            this.services.map(service => this.checkService(service))
        );
        
        const status = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: results,
            summary: {
                total: results.length,
                online: results.filter(s => s.status === 'online').length,
                offline: results.filter(s => s.status === 'offline').length,
                timeout: results.filter(s => s.status === 'timeout').length
            }
        };
        
        // Write to status file
        await fs.writeFile(this.statusFile, JSON.stringify(status, null, 2));
        
        // Log to file
        const logEntry = `${status.timestamp} - Online: ${status.summary.online}/${status.summary.total} - ${results.map(s => `${s.name}:${s.status}`).join(', ')}\n`;
        await fs.appendFile(this.logFile, logEntry);
        
        // Console output
        console.log(`🔍 ${status.timestamp} - ${status.summary.online}/${status.summary.total} services online`);
        results.forEach(service => {
            const emoji = service.status === 'online' ? '✅' : '❌';
            console.log(`   ${emoji} ${service.name} (${service.port}): ${service.status}`);
        });
        
        return status;
    }
    
    async start() {
        console.log('🔍 Starting Health Monitor...');
        console.log(`📊 Monitoring ${this.services.length} services`);
        console.log(`📝 Status file: ${path.resolve(this.statusFile)}`);
        console.log(`📋 Log file: ${path.resolve(this.logFile)}`);
        
        this.isRunning = true;
        
        // Initial check
        await this.checkAllServices();
        
        // Check every 10 seconds
        const interval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(interval);
                return;
            }
            
            try {
                await this.checkAllServices();
            } catch (error) {
                console.error('❌ Health check failed:', error.message);
            }
        }, 10000);
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping Health Monitor...');
            this.isRunning = false;
            clearInterval(interval);
            process.exit(0);
        });
    }
    
    async generateReport() {
        try {
            const status = await this.checkAllServices();
            
            const report = `
# Soulfra Platform Health Report
Generated: ${status.timestamp}

## Service Status (${status.summary.online}/${status.summary.total} online)

${status.services.map(service => 
    `- **${service.name}** (port ${service.port}): ${service.status === 'online' ? '✅ ONLINE' : '❌ OFFLINE'}`
).join('\n')}

## Quick Access URLs
${status.services.filter(s => s.status === 'online').map(service => 
    `- [${service.name}](http://localhost:${service.port})`
).join('\n')}

## System Health
- Total Services: ${status.summary.total}
- Online: ${status.summary.online}
- Offline: ${status.summary.offline}
- Monitor Uptime: ${Math.floor(status.uptime)} seconds

---
*This report updates every 10 seconds. Check platform-status.json for real-time data.*
`;
            
            await fs.writeFile('./platform-health-report.md', report);
            console.log('📋 Health report generated: platform-health-report.md');
            
            return report;
            
        } catch (error) {
            console.error('❌ Failed to generate report:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new HealthMonitor();
    
    const command = process.argv[2];
    
    if (command === 'check') {
        // Single check
        monitor.checkAllServices().then(() => process.exit(0));
    } else if (command === 'report') {
        // Generate report
        monitor.generateReport().then(() => process.exit(0));
    } else {
        // Start continuous monitoring
        monitor.start();
    }
}

module.exports = HealthMonitor;