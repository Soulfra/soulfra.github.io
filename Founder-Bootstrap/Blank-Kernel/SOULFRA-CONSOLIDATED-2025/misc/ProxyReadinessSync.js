#!/usr/bin/env node
/**
 * Proxy Readiness Sync
 * Coordinates frontend proxies with backend service readiness
 */

const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const PortCheckAndConfirm = require('./PortCheckAndConfirm');

class ProxyReadinessSync {
    constructor(proxyPort = 7890) {
        this.proxyPort = proxyPort;
        this.checker = new PortCheckAndConfirm();
        this.proxies = new Map();
        this.server = null;
        
        this.initializeProxies();
    }
    
    initializeProxies() {
        // Define proxy routes
        this.addProxy('/cal', 'cal-riven', 4040);
        this.addProxy('/api/semantic', 'semantic-api', 3666);
        this.addProxy('/ledger', 'consciousness-ledger', 8889);
        this.addProxy('/chat', 'chat-processor', 8080);
        this.addProxy('/tasks', 'task-daemon', 7778);
        this.addProxy('/infinity', 'infinity-router', 9090);
    }
    
    addProxy(path, serviceName, targetPort) {
        this.proxies.set(path, {
            serviceName,
            targetPort,
            proxy: httpProxy.createProxyServer({
                target: `http://localhost:${targetPort}`,
                changeOrigin: true
            }),
            ready: false
        });
    }
    
    async start() {
        console.log(`Starting Proxy Readiness Sync on port ${this.proxyPort}`);
        
        this.server = http.createServer(async (req, res) => {
            // Find matching proxy route
            const route = Array.from(this.proxies.keys()).find(path => 
                req.url.startsWith(path)
            );
            
            if (!route) {
                this.serveDashboard(req, res);
                return;
            }
            
            const proxyConfig = this.proxies.get(route);
            
            // Check if service is ready
            if (!proxyConfig.ready) {
                const isReady = await this.checker.verifyService(proxyConfig.serviceName);
                proxyConfig.ready = isReady;
            }
            
            if (proxyConfig.ready) {
                // Proxy the request
                proxyConfig.proxy.web(req, res, {}, (err) => {
                    console.error(`Proxy error for ${route}:`, err);
                    proxyConfig.ready = false; // Mark as not ready
                    this.serveWaitingPage(req, res, proxyConfig.serviceName);
                });
            } else {
                // Service not ready, show waiting page
                this.serveWaitingPage(req, res, proxyConfig.serviceName);
            }
        });
        
        // Start periodic health checks
        this.startHealthChecks();
        
        this.server.listen(this.proxyPort, () => {
            console.log(`Proxy server running at http://localhost:${this.proxyPort}`);
        });
    }
    
    startHealthChecks() {
        setInterval(async () => {
            for (const [path, config] of this.proxies) {
                const wasReady = config.ready;
                config.ready = await this.checker.verifyService(config.serviceName);
                
                if (!wasReady && config.ready) {
                    console.log(`✓ Service ${config.serviceName} is now ready`);
                } else if (wasReady && !config.ready) {
                    console.log(`✗ Service ${config.serviceName} is no longer responding`);
                }
            }
        }, 5000); // Check every 5 seconds
    }
    
    serveWaitingPage(req, res, serviceName) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Service Starting - Soulfra</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f0f0f0;
        }
        .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .status {
            color: #666;
            margin-top: 20px;
        }
        .retry-info {
            font-size: 14px;
            color: #999;
            margin-top: 10px;
        }
    </style>
    <meta http-equiv="refresh" content="3">
</head>
<body>
    <div class="container">
        <h1>Service Starting</h1>
        <div class="spinner"></div>
        <p class="status">Waiting for <strong>${serviceName}</strong> to be ready...</p>
        <p class="retry-info">This page will automatically refresh every 3 seconds</p>
        <p class="retry-info">Once the service is ready, you'll be redirected automatically</p>
    </div>
</body>
</html>`;
        
        res.writeHead(503, {
            'Content-Type': 'text/html',
            'Retry-After': '3'
        });
        res.end(html);
    }
    
    serveDashboard(req, res) {
        const services = [];
        for (const [path, config] of this.proxies) {
            services.push({
                path,
                serviceName: config.serviceName,
                port: config.targetPort,
                ready: config.ready
            });
        }
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Service Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .service-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .service-card {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #f9f9f9;
        }
        .service-card.ready {
            border-color: #4CAF50;
            background: #f1f8f4;
        }
        .status-icon {
            float: right;
            font-size: 20px;
        }
        .ready .status-icon { color: #4CAF50; }
        .not-ready .status-icon { color: #f44336; }
        a { color: #2196F3; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .refresh-note {
            text-align: center;
            color: #666;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>Soulfra Service Dashboard</h1>
        <div class="service-grid">
            ${services.map(s => `
                <div class="service-card ${s.ready ? 'ready' : 'not-ready'}">
                    <span class="status-icon">${s.ready ? '✓' : '⏳'}</span>
                    <h3>${s.serviceName}</h3>
                    <p>Port: ${s.port}</p>
                    <p>Path: <a href="${s.path}">${s.path}</a></p>
                    <p>Status: ${s.ready ? 'Ready' : 'Starting...'}</p>
                </div>
            `).join('')}
        </div>
        <p class="refresh-note">Auto-refreshes every 5 seconds</p>
    </div>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// Note: http-proxy is not installed by default
// To use this, you would need to install it first
// For now, we'll create a simplified version without the proxy dependency

class SimpleProxyReadinessSync {
    constructor(proxyPort = 7890) {
        this.proxyPort = proxyPort;
        this.checker = new PortCheckAndConfirm();
        this.services = new Map([
            ['/cal', { name: 'cal-riven', port: 4040 }],
            ['/semantic', { name: 'semantic-api', port: 3666 }],
            ['/ledger', { name: 'consciousness-ledger', port: 8889 }],
            ['/chat', { name: 'chat-processor', port: 8080 }],
            ['/tasks', { name: 'task-daemon', port: 7778 }],
            ['/infinity', { name: 'infinity-router', port: 9090 }]
        ]);
    }
    
    async start() {
        console.log(`Starting Simple Proxy Readiness Sync on port ${this.proxyPort}`);
        
        const server = http.createServer(async (req, res) => {
            // Serve dashboard
            const serviceStatuses = [];
            
            for (const [path, config] of this.services) {
                const ready = await this.checker.verifyService(config.name);
                serviceStatuses.push({
                    path,
                    name: config.name,
                    port: config.port,
                    ready,
                    url: ready ? `http://localhost:${config.port}` : null
                });
            }
            
            const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Service Status</title>
    <style>
        body { font-family: Arial; margin: 20px; background: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .ready { color: green; }
        .not-ready { color: red; }
    </style>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <div class="container">
        <h1>Soulfra Service Status</h1>
        <p>Last updated: ${new Date().toLocaleTimeString()}</p>
        <table>
            <tr>
                <th>Service</th>
                <th>Port</th>
                <th>Status</th>
                <th>Access</th>
            </tr>
            ${serviceStatuses.map(s => `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.port}</td>
                    <td class="${s.ready ? 'ready' : 'not-ready'}">
                        ${s.ready ? '✓ Ready' : '⏳ Starting...'}
                    </td>
                    <td>
                        ${s.ready ? `<a href="${s.url}" target="_blank">Open →</a>` : '-'}
                    </td>
                </tr>
            `).join('')}
        </table>
    </div>
</body>
</html>`;
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        });
        
        server.listen(this.proxyPort, () => {
            console.log(`Service status dashboard: http://localhost:${this.proxyPort}`);
        });
    }
}

module.exports = { ProxyReadinessSync, SimpleProxyReadinessSync };

// Run if called directly
if (require.main === module) {
    const sync = new SimpleProxyReadinessSync();
    sync.start();
}