// 🐛 SOULFRA DEBUG EXTRACTION LAYER
// Safely extracts error messages and debug info from isolated vaults
// Provides visibility into failures without compromising security

import EventEmitter from 'events';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { WebSocketServer } from 'ws';
import http from 'http';

class DebugExtractionLayer extends EventEmitter {
    constructor() {
        super();
        this.debugLog = [];
        this.errorLog = [];
        this.vaultErrors = new Map();
        this.serviceErrors = new Map();
        this.debugChannels = new Map();
        this.debugPort = process.env.DEBUG_PORT || 9999;
        this.debugMode = process.env.DEBUG === 'true';
        this.maxLogSize = 10000;
        
        this.initializeDebugServer();
        this.setupErrorInterceptors();
        this.createDebugChannels();
    }

    initializeDebugServer() {
        // Create HTTP server for debug dashboard
        this.debugServer = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            const url = new URL(req.url, `http://localhost:${this.debugPort}`);
            
            try {
                switch (url.pathname) {
                    case '/':
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(this.generateDebugDashboard());
                        break;
                        
                    case '/debug/all':
                        res.writeHead(200);
                        res.end(JSON.stringify({
                            errors: this.getRecentErrors(),
                            debug: this.getRecentDebugLogs(),
                            vaultErrors: Array.from(this.vaultErrors.entries()),
                            serviceErrors: Array.from(this.serviceErrors.entries()),
                            stats: this.getDebugStats()
                        }, null, 2));
                        break;
                        
                    case '/debug/errors':
                        res.writeHead(200);
                        res.end(JSON.stringify(this.getRecentErrors(), null, 2));
                        break;
                        
                    case '/debug/vault-errors':
                        res.writeHead(200);
                        res.end(JSON.stringify(Array.from(this.vaultErrors.entries()), null, 2));
                        break;
                        
                    case '/debug/service-errors':
                        res.writeHead(200);
                        res.end(JSON.stringify(Array.from(this.serviceErrors.entries()), null, 2));
                        break;
                        
                    case '/debug/logs':
                        res.writeHead(200);
                        res.end(JSON.stringify(this.getRecentDebugLogs(), null, 2));
                        break;
                        
                    case '/debug/clear':
                        this.clearDebugLogs();
                        res.writeHead(200);
                        res.end(JSON.stringify({ success: true, message: 'Debug logs cleared' }));
                        break;
                        
                    default:
                        res.writeHead(404);
                        res.end(JSON.stringify({ error: 'Debug endpoint not found' }));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });

        // Create WebSocket server for real-time debug streaming
        this.debugWS = new WebSocketServer({ server: this.debugServer });
        
        this.debugWS.on('connection', (ws) => {
            console.log(chalk.blue('🔍 Debug client connected'));
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial',
                data: {
                    errors: this.getRecentErrors(50),
                    logs: this.getRecentDebugLogs(50)
                }
            }));
            
            // Add to debug channels
            const channelId = `debug_${Date.now()}`;
            this.debugChannels.set(channelId, ws);
            
            ws.on('close', () => {
                this.debugChannels.delete(channelId);
            });
        });

        this.debugServer.listen(this.debugPort, () => {
            console.log(chalk.green.bold(`🐛 DEBUG EXTRACTION LAYER ONLINE`));
            console.log(chalk.blue(`   Debug Dashboard: http://localhost:${this.debugPort}`));
            console.log(chalk.blue(`   Error API: http://localhost:${this.debugPort}/debug/errors`));
            console.log(chalk.blue(`   Vault Errors: http://localhost:${this.debugPort}/debug/vault-errors`));
            console.log(chalk.gray(`   Debug Mode: ${this.debugMode ? 'ENABLED' : 'DISABLED'}`));
        });
    }

    setupErrorInterceptors() {
        // Global error handlers
        process.on('uncaughtException', (error, origin) => {
            this.captureError({
                type: 'uncaught_exception',
                error: error.message,
                stack: error.stack,
                origin,
                timestamp: Date.now()
            });
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.captureError({
                type: 'unhandled_rejection',
                error: reason?.message || String(reason),
                stack: reason?.stack,
                promise: String(promise),
                timestamp: Date.now()
            });
        });

        // Console interceptors
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleLog = console.log;

        console.error = (...args) => {
            this.captureError({
                type: 'console_error',
                message: args.join(' '),
                timestamp: Date.now(),
                source: 'console'
            });
            originalConsoleError.apply(console, args);
        };

        console.warn = (...args) => {
            this.captureDebug({
                type: 'console_warn',
                message: args.join(' '),
                timestamp: Date.now(),
                source: 'console'
            });
            originalConsoleWarn.apply(console, args);
        };

        if (this.debugMode) {
            console.log = (...args) => {
                this.captureDebug({
                    type: 'console_log',
                    message: args.join(' '),
                    timestamp: Date.now(),
                    source: 'console'
                });
                originalConsoleLog.apply(console, args);
            };
        }
    }

    createDebugChannels() {
        // Create debug channels for different components
        this.createChannel('vault', {
            errorThreshold: 5,
            autoAlert: true
        });
        
        this.createChannel('service-mesh', {
            errorThreshold: 10,
            autoAlert: true
        });
        
        this.createChannel('api-gateway', {
            errorThreshold: 20,
            autoAlert: false
        });
        
        this.createChannel('consciousness', {
            errorThreshold: 3,
            autoAlert: true
        });
    }

    createChannel(name, config = {}) {
        this.debugChannels.set(name, {
            name,
            config,
            errors: [],
            logs: [],
            errorCount: 0,
            created: Date.now()
        });
    }

    captureError(error) {
        // Add to error log
        this.errorLog.push({
            ...error,
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        // Trim log if too large
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.splice(0, this.errorLog.length - this.maxLogSize);
        }

        // Broadcast to WebSocket clients
        this.broadcastToDebugClients({
            type: 'error',
            data: error
        });

        // Log to file if critical
        if (error.type === 'uncaught_exception' || error.type === 'vault_emergency_stop') {
            this.logToFile('critical-errors.log', error);
        }

        this.emit('error_captured', error);
    }

    captureDebug(log) {
        if (!this.debugMode && log.type !== 'console_warn') return;

        // Add to debug log
        this.debugLog.push({
            ...log,
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

        // Trim log if too large
        if (this.debugLog.length > this.maxLogSize) {
            this.debugLog.splice(0, this.debugLog.length - this.maxLogSize);
        }

        // Broadcast to WebSocket clients
        this.broadcastToDebugClients({
            type: 'debug',
            data: log
        });
    }

    captureVaultError(vaultId, error) {
        if (!this.vaultErrors.has(vaultId)) {
            this.vaultErrors.set(vaultId, []);
        }

        const vaultError = {
            ...error,
            vaultId,
            timestamp: Date.now(),
            id: `vault_err_${Date.now()}`
        };

        this.vaultErrors.get(vaultId).push(vaultError);
        this.captureError({
            ...vaultError,
            type: 'vault_error'
        });

        // Check for emergency conditions
        const vaultErrorCount = this.vaultErrors.get(vaultId).length;
        if (vaultErrorCount > 5) {
            this.emit('vault_critical', { vaultId, errorCount: vaultErrorCount });
        }
    }

    captureServiceError(serviceName, error) {
        if (!this.serviceErrors.has(serviceName)) {
            this.serviceErrors.set(serviceName, []);
        }

        const serviceError = {
            ...error,
            serviceName,
            timestamp: Date.now(),
            id: `service_err_${Date.now()}`
        };

        this.serviceErrors.get(serviceName).push(serviceError);
        this.captureError({
            ...serviceError,
            type: 'service_error'
        });
    }

    broadcastToDebugClients(message) {
        for (const [id, ws] of this.debugChannels) {
            if (ws.readyState === 1) { // WebSocket.OPEN
                try {
                    ws.send(JSON.stringify(message));
                } catch (error) {
                    console.error('Debug broadcast error:', error);
                }
            }
        }
    }

    getRecentErrors(limit = 100) {
        return this.errorLog.slice(-limit).reverse();
    }

    getRecentDebugLogs(limit = 100) {
        return this.debugLog.slice(-limit).reverse();
    }

    getDebugStats() {
        return {
            totalErrors: this.errorLog.length,
            totalLogs: this.debugLog.length,
            vaultErrorCount: Array.from(this.vaultErrors.values()).reduce((sum, errors) => sum + errors.length, 0),
            serviceErrorCount: Array.from(this.serviceErrors.values()).reduce((sum, errors) => sum + errors.length, 0),
            debugChannels: this.debugChannels.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }

    clearDebugLogs() {
        this.debugLog = [];
        this.errorLog = [];
        this.vaultErrors.clear();
        this.serviceErrors.clear();
    }

    logToFile(filename, data) {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logPath = path.join(logDir, filename);
        const logEntry = `[${new Date().toISOString()}] ${JSON.stringify(data)}\n`;
        
        fs.appendFile(logPath, logEntry, (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    }

    generateDebugDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Debug Dashboard</title>
    <style>
        body {
            font-family: 'SF Mono', Monaco, monospace;
            background: #0a0a0a;
            color: #0f0;
            margin: 0;
            padding: 20px;
        }
        h1 { 
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
            margin-bottom: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat {
            background: #1a1a1a;
            border: 1px solid #0f0;
            padding: 15px;
            border-radius: 5px;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
        }
        .error-log, .debug-log {
            background: #1a1a1a;
            border: 1px solid #333;
            padding: 15px;
            margin-bottom: 20px;
            height: 300px;
            overflow-y: auto;
            font-size: 12px;
        }
        .error-entry {
            color: #f00;
            margin-bottom: 10px;
            padding: 5px;
            border-left: 3px solid #f00;
            padding-left: 10px;
        }
        .debug-entry {
            color: #888;
            margin-bottom: 5px;
        }
        .controls {
            margin-bottom: 20px;
        }
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 10px 20px;
            font-weight: bold;
            cursor: pointer;
            margin-right: 10px;
        }
        button:hover {
            background: #0a0;
        }
        .live-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #0f0;
            border-radius: 50%;
            animation: pulse 2s infinite;
            margin-left: 10px;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🐛 Soulfra Debug Dashboard <span class="live-indicator"></span></h1>
        
        <div class="controls">
            <button onclick="clearLogs()">Clear Logs</button>
            <button onclick="downloadLogs()">Download Logs</button>
            <button onclick="toggleAutoScroll()">Toggle Auto-Scroll</button>
        </div>
        
        <div class="stats" id="stats">
            <div class="stat">
                <div>Total Errors</div>
                <div class="stat-value" id="totalErrors">0</div>
            </div>
            <div class="stat">
                <div>Vault Errors</div>
                <div class="stat-value" id="vaultErrors">0</div>
            </div>
            <div class="stat">
                <div>Service Errors</div>
                <div class="stat-value" id="serviceErrors">0</div>
            </div>
            <div class="stat">
                <div>Uptime</div>
                <div class="stat-value" id="uptime">0s</div>
            </div>
        </div>
        
        <h2>Error Log</h2>
        <div class="error-log" id="errorLog"></div>
        
        <h2>Debug Log</h2>
        <div class="debug-log" id="debugLog"></div>
    </div>
    
    <script>
        let autoScroll = true;
        const ws = new WebSocket('ws://localhost:${this.debugPort}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'initial') {
                updateLogs(data.data.errors, data.data.logs);
            } else if (data.type === 'error') {
                addError(data.data);
            } else if (data.type === 'debug') {
                addDebug(data.data);
            }
            
            updateStats();
        };
        
        function updateLogs(errors, logs) {
            const errorLog = document.getElementById('errorLog');
            const debugLog = document.getElementById('debugLog');
            
            errorLog.innerHTML = errors.map(e => 
                '<div class="error-entry">' + formatError(e) + '</div>'
            ).join('');
            
            debugLog.innerHTML = logs.map(l => 
                '<div class="debug-entry">' + formatDebug(l) + '</div>'
            ).join('');
        }
        
        function addError(error) {
            const errorLog = document.getElementById('errorLog');
            const entry = document.createElement('div');
            entry.className = 'error-entry';
            entry.innerHTML = formatError(error);
            errorLog.insertBefore(entry, errorLog.firstChild);
            
            if (autoScroll) errorLog.scrollTop = 0;
        }
        
        function addDebug(log) {
            const debugLog = document.getElementById('debugLog');
            const entry = document.createElement('div');
            entry.className = 'debug-entry';
            entry.innerHTML = formatDebug(log);
            debugLog.insertBefore(entry, debugLog.firstChild);
            
            if (autoScroll) debugLog.scrollTop = 0;
        }
        
        function formatError(error) {
            const time = new Date(error.timestamp).toLocaleTimeString();
            return '[' + time + '] ' + error.type + ': ' + (error.error || error.message || 'Unknown error');
        }
        
        function formatDebug(log) {
            const time = new Date(log.timestamp).toLocaleTimeString();
            return '[' + time + '] ' + log.type + ': ' + log.message;
        }
        
        function updateStats() {
            fetch('/debug/all')
                .then(res => res.json())
                .then(data => {
                    document.getElementById('totalErrors').textContent = data.stats.totalErrors;
                    document.getElementById('vaultErrors').textContent = data.stats.vaultErrorCount;
                    document.getElementById('serviceErrors').textContent = data.stats.serviceErrorCount;
                    document.getElementById('uptime').textContent = Math.floor(data.stats.uptime) + 's';
                });
        }
        
        function clearLogs() {
            fetch('/debug/clear', { method: 'POST' })
                .then(() => {
                    document.getElementById('errorLog').innerHTML = '';
                    document.getElementById('debugLog').innerHTML = '';
                    updateStats();
                });
        }
        
        function downloadLogs() {
            fetch('/debug/all')
                .then(res => res.json())
                .then(data => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'soulfra-debug-' + Date.now() + '.json';
                    a.click();
                });
        }
        
        function toggleAutoScroll() {
            autoScroll = !autoScroll;
            alert('Auto-scroll ' + (autoScroll ? 'enabled' : 'disabled'));
        }
        
        setInterval(updateStats, 5000);
        updateStats();
    </script>
</body>
</html>`;
    }

    // Public API for other components to use
    attachToVaultSystem(vaultSystem) {
        vaultSystem.on('policy_violation', (data) => {
            this.captureVaultError(data.vaultId, {
                type: 'policy_violation',
                violation: data.violation
            });
        });

        vaultSystem.on('vault_emergency_stop', (data) => {
            this.captureVaultError(data.vaultId, {
                type: 'emergency_stop',
                reason: data.reason,
                critical: true
            });
        });

        const originalTerminateAgent = vaultSystem.terminateAgent.bind(vaultSystem);
        vaultSystem.terminateAgent = (agentId) => {
            this.captureDebug({
                type: 'agent_termination',
                agentId,
                source: 'vault_system'
            });
            return originalTerminateAgent(agentId);
        };
    }

    attachToServiceMesh(serviceMesh) {
        serviceMesh.on('service_critical', (service) => {
            this.captureServiceError(service.name, {
                type: 'service_critical',
                consecutiveFailures: service.consecutiveFailures
            });
        });

        serviceMesh.on('circuit_breaker_open', (data) => {
            this.captureServiceError(data.service, {
                type: 'circuit_breaker_open'
            });
        });
    }

    attachToAPIGateway(apiGateway) {
        // Attach to API gateway error handling
        const app = apiGateway.app;
        
        app.use((err, req, res, next) => {
            this.captureError({
                type: 'api_gateway_error',
                path: req.path,
                method: req.method,
                error: err.message,
                stack: err.stack
            });
            next(err);
        });
    }

    extractVaultLogs(vaultId) {
        return this.vaultErrors.get(vaultId) || [];
    }

    extractServiceLogs(serviceName) {
        return this.serviceErrors.get(serviceName) || [];
    }

    getErrorSummary() {
        const summary = {
            criticalErrors: this.errorLog.filter(e => 
                e.type === 'uncaught_exception' || 
                e.type === 'vault_emergency_stop' ||
                e.critical
            ),
            vaultSummary: {},
            serviceSummary: {}
        };

        for (const [vaultId, errors] of this.vaultErrors) {
            summary.vaultSummary[vaultId] = {
                errorCount: errors.length,
                lastError: errors[errors.length - 1]
            };
        }

        for (const [serviceName, errors] of this.serviceErrors) {
            summary.serviceSummary[serviceName] = {
                errorCount: errors.length,
                lastError: errors[errors.length - 1]
            };
        }

        return summary;
    }

    shutdown() {
        console.log(chalk.yellow('🛑 Shutting down Debug Extraction Layer...'));
        
        if (this.debugServer) {
            this.debugServer.close();
        }
        
        if (this.debugWS) {
            this.debugWS.close();
        }
        
        // Write final logs to file
        const finalLogs = {
            errors: this.errorLog,
            debug: this.debugLog,
            vaultErrors: Array.from(this.vaultErrors.entries()),
            serviceErrors: Array.from(this.serviceErrors.entries()),
            shutdown: Date.now()
        };
        
        this.logToFile('final-debug-dump.json', finalLogs);
        
        console.log(chalk.green('✅ Debug Extraction Layer shutdown complete'));
    }
}

// Export class
export { DebugExtractionLayer };

// Start debug server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const debugLayer = new DebugExtractionLayer();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        debugLayer.shutdown();
        process.exit(0);
    });
    
    // Example of capturing some test errors
    setTimeout(() => {
        debugLayer.captureError({
            type: 'test_error',
            message: 'This is a test error for debugging',
            source: 'debug_test'
        });
        
        debugLayer.captureVaultError('test-vault-001', {
            type: 'test_vault_error',
            message: 'Vault isolation test failure'
        });
        
        debugLayer.captureServiceError('test-service', {
            type: 'test_service_error', 
            message: 'Service connection test failure'
        });
    }, 2000);
}