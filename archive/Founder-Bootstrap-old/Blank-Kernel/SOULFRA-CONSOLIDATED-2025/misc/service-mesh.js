// 🕸️ SOULFRA SERVICE MESH
// Middle Ring - Internal Service Communication Layer
// Handles service discovery, load balancing, circuit breaking, and secure inter-service communication

import EventEmitter from 'events';
import http from 'http';
import https from 'https';
import WebSocket, { WebSocketServer } from 'ws';
import crypto from 'crypto';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

class SoulfrServiceMesh extends EventEmitter {
    constructor() {
        super();
        this.services = new Map();
        this.connections = new Map();
        this.circuitBreakers = new Map();
        this.loadBalancers = new Map();
        this.messageQueue = new Map();
        this.healthChecks = new Map();
        this.meshSecret = this.generateMeshSecret();
        this.meshPort = process.env.MESH_PORT || 7777;
        this.wsServer = null;
        
        this.initializeMesh();
        this.startHealthMonitoring();
        this.startMessageProcessing();
    }

    generateMeshSecret() {
        return crypto.randomBytes(32).toString('hex');
    }

    initializeMesh() {
        // Create WebSocket server for mesh communication
        this.wsServer = new WebSocketServer({ 
            port: this.meshPort,
            verifyClient: (info) => this.verifyMeshClient(info)
        });

        this.wsServer.on('connection', (ws, request) => {
            this.handleServiceConnection(ws, request);
        });

        console.log(chalk.blue(`🕸️  Service Mesh initialized on port ${this.meshPort}`));
        console.log(chalk.gray(`   Mesh Secret: ${this.meshSecret.substring(0, 8)}...`));
    }

    verifyMeshClient(info) {
        // Verify mesh authentication
        const url = new URL(info.req.url, `ws://localhost:${this.meshPort}`);
        const auth = url.searchParams.get('auth');
        return auth === this.meshSecret;
    }

    handleServiceConnection(ws, request) {
        const url = new URL(request.url, `ws://localhost:${this.meshPort}`);
        const serviceName = url.searchParams.get('service');
        const servicePort = url.searchParams.get('port');
        const serviceHost = url.searchParams.get('host') || 'localhost';
        
        if (!serviceName) {
            ws.close(1008, 'Service name required');
            return;
        }

        // Register service
        const serviceInfo = {
            name: serviceName,
            host: serviceHost,
            port: parseInt(servicePort),
            connection: ws,
            healthy: true,
            lastHeartbeat: Date.now(),
            messageCount: 0,
            errorCount: 0
        };

        this.services.set(serviceName, serviceInfo);
        this.connections.set(ws, serviceInfo);
        
        console.log(chalk.green(`✅ Service registered: ${serviceName} (${serviceHost}:${servicePort})`));

        // Setup heartbeat
        const heartbeatInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            } else {
                this.unregisterService(serviceName);
                clearInterval(heartbeatInterval);
            }
        }, 30000);

        // Handle messages
        ws.on('message', (data) => {
            this.handleMeshMessage(serviceName, data);
        });

        ws.on('pong', () => {
            serviceInfo.lastHeartbeat = Date.now();
        });

        ws.on('close', () => {
            this.unregisterService(serviceName);
            clearInterval(heartbeatInterval);
        });

        ws.on('error', (error) => {
            console.error(chalk.red(`Service ${serviceName} error:`, error.message));
            serviceInfo.errorCount++;
        });

        // Send welcome message
        this.sendToService(serviceName, {
            type: 'mesh_welcome',
            services: Array.from(this.services.keys()),
            mesh_id: this.meshSecret.substring(0, 8)
        });

        // Broadcast service availability
        this.broadcastToAll({
            type: 'service_available',
            service: serviceName,
            endpoint: `${serviceHost}:${servicePort}`
        }, [serviceName]);

        this.emit('service_registered', serviceInfo);
    }

    unregisterService(serviceName) {
        const service = this.services.get(serviceName);
        if (service) {
            this.services.delete(serviceName);
            this.connections.delete(service.connection);
            
            console.log(chalk.yellow(`❌ Service unregistered: ${serviceName}`));
            
            // Broadcast service unavailability
            this.broadcastToAll({
                type: 'service_unavailable',
                service: serviceName
            });

            this.emit('service_unregistered', { name: serviceName });
        }
    }

    handleMeshMessage(fromService, data) {
        try {
            const message = JSON.parse(data);
            const service = this.services.get(fromService);
            
            if (service) {
                service.messageCount++;
                service.lastHeartbeat = Date.now();
            }

            switch (message.type) {
                case 'service_request':
                    this.handleServiceRequest(fromService, message);
                    break;
                    
                case 'service_response':
                    this.handleServiceResponse(fromService, message);
                    break;
                    
                case 'broadcast':
                    this.handleBroadcast(fromService, message);
                    break;
                    
                case 'health_update':
                    this.handleHealthUpdate(fromService, message);
                    break;
                    
                case 'circuit_breaker':
                    this.handleCircuitBreaker(fromService, message);
                    break;
                    
                default:
                    console.warn(chalk.yellow(`Unknown mesh message type: ${message.type}`));
            }
        } catch (error) {
            console.error(chalk.red(`Error handling mesh message from ${fromService}:`, error.message));
        }
    }

    handleServiceRequest(fromService, message) {
        const { target_service, request_id, payload, priority = 'normal' } = message;
        
        // Check circuit breaker
        if (this.isCircuitOpen(target_service)) {
            this.sendToService(fromService, {
                type: 'service_response',
                request_id,
                error: 'Circuit breaker open',
                status: 'circuit_open'
            });
            return;
        }

        // Load balance if multiple instances
        const targetService = this.selectServiceInstance(target_service);
        if (!targetService) {
            this.sendToService(fromService, {
                type: 'service_response',
                request_id,
                error: 'Service not available',
                status: 'service_unavailable'
            });
            return;
        }

        // Queue or forward message
        if (priority === 'high') {
            this.sendToService(target_service, {
                type: 'mesh_request',
                from_service: fromService,
                request_id,
                payload
            });
        } else {
            this.queueMessage(target_service, {
                type: 'mesh_request',
                from_service: fromService,
                request_id,
                payload,
                priority
            });
        }
    }

    handleServiceResponse(fromService, message) {
        const { target_service, request_id, payload, error } = message;
        
        // Record success/failure for circuit breaker
        if (error) {
            this.recordServiceFailure(fromService);
        } else {
            this.recordServiceSuccess(fromService);
        }

        // Forward response
        this.sendToService(target_service, {
            type: 'mesh_response',
            from_service: fromService,
            request_id,
            payload,
            error
        });
    }

    handleBroadcast(fromService, message) {
        const { payload, exclude = [] } = message;
        
        this.broadcastToAll({
            type: 'mesh_broadcast',
            from_service: fromService,
            payload
        }, [...exclude, fromService]);
    }

    handleHealthUpdate(fromService, message) {
        const service = this.services.get(fromService);
        if (service) {
            service.healthy = message.healthy;
            this.healthChecks.set(fromService, {
                healthy: message.healthy,
                timestamp: Date.now(),
                details: message.details
            });
        }
    }

    handleCircuitBreaker(fromService, message) {
        const { target_service, action } = message;
        
        if (action === 'open') {
            this.openCircuitBreaker(target_service);
        } else if (action === 'close') {
            this.closeCircuitBreaker(target_service);
        }
    }

    selectServiceInstance(serviceName) {
        // Simple round-robin load balancing
        const services = Array.from(this.services.values())
            .filter(s => s.name === serviceName && s.healthy);
            
        if (services.length === 0) return null;
        
        let balancer = this.loadBalancers.get(serviceName) || { index: 0 };
        const selected = services[balancer.index % services.length];
        balancer.index++;
        this.loadBalancers.set(serviceName, balancer);
        
        return selected;
    }

    isCircuitOpen(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) return false;
        
        if (breaker.state === 'open') {
            // Check if we should try half-open
            if (Date.now() - breaker.lastFailure > breaker.timeout) {
                breaker.state = 'half-open';
                return false;
            }
            return true;
        }
        
        return false;
    }

    recordServiceFailure(serviceName) {
        let breaker = this.circuitBreakers.get(serviceName) || {
            failures: 0,
            successes: 0,
            state: 'closed',
            threshold: 5,
            timeout: 60000
        };
        
        breaker.failures++;
        breaker.lastFailure = Date.now();
        
        if (breaker.failures >= breaker.threshold) {
            breaker.state = 'open';
            console.warn(chalk.red(`🔴 Circuit breaker opened for ${serviceName}`));
            this.emit('circuit_breaker_open', { service: serviceName });
        }
        
        this.circuitBreakers.set(serviceName, breaker);
    }

    recordServiceSuccess(serviceName) {
        let breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            breaker.successes++;
            
            if (breaker.state === 'half-open' && breaker.successes >= 3) {
                breaker.state = 'closed';
                breaker.failures = 0;
                console.log(chalk.green(`🟢 Circuit breaker closed for ${serviceName}`));
                this.emit('circuit_breaker_closed', { service: serviceName });
            }
        }
    }

    openCircuitBreaker(serviceName) {
        let breaker = this.circuitBreakers.get(serviceName) || {
            failures: 0,
            successes: 0,
            state: 'closed',
            threshold: 5,
            timeout: 60000
        };
        
        breaker.state = 'open';
        breaker.lastFailure = Date.now();
        this.circuitBreakers.set(serviceName, breaker);
        
        console.warn(chalk.red(`🔴 Circuit breaker manually opened for ${serviceName}`));
    }

    closeCircuitBreaker(serviceName) {
        let breaker = this.circuitBreakers.get(serviceName);
        if (breaker) {
            breaker.state = 'closed';
            breaker.failures = 0;
            this.circuitBreakers.set(serviceName, breaker);
            
            console.log(chalk.green(`🟢 Circuit breaker manually closed for ${serviceName}`));
        }
    }

    queueMessage(serviceName, message) {
        if (!this.messageQueue.has(serviceName)) {
            this.messageQueue.set(serviceName, []);
        }
        this.messageQueue.get(serviceName).push({
            ...message,
            queued_at: Date.now()
        });
    }

    processMessageQueue() {
        for (const [serviceName, queue] of this.messageQueue) {
            if (queue.length === 0) continue;
            
            const service = this.services.get(serviceName);
            if (!service || !service.healthy) continue;
            
            // Process up to 10 messages per cycle
            const messagesToProcess = queue.splice(0, 10);
            
            for (const message of messagesToProcess) {
                this.sendToService(serviceName, message);
            }
        }
    }

    sendToService(serviceName, message) {
        const service = this.services.get(serviceName);
        if (service && service.connection.readyState === WebSocket.OPEN) {
            try {
                service.connection.send(JSON.stringify(message));
                return true;
            } catch (error) {
                console.error(chalk.red(`Error sending to ${serviceName}:`, error.message));
                return false;
            }
        }
        return false;
    }

    broadcastToAll(message, excludeServices = []) {
        for (const [serviceName, service] of this.services) {
            if (!excludeServices.includes(serviceName)) {
                this.sendToService(serviceName, message);
            }
        }
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.checkServiceHealth();
        }, 30000);
    }

    checkServiceHealth() {
        const now = Date.now();
        const heartbeatTimeout = 60000; // 1 minute
        
        for (const [serviceName, service] of this.services) {
            if (now - service.lastHeartbeat > heartbeatTimeout) {
                console.warn(chalk.yellow(`⚠️  Service ${serviceName} heartbeat timeout`));
                service.healthy = false;
                this.emit('service_unhealthy', { name: serviceName });
            }
        }
    }

    startMessageProcessing() {
        setInterval(() => {
            this.processMessageQueue();
        }, 1000); // Process queue every second
    }

    // Public API methods
    getServiceStatus() {
        return {
            services: Array.from(this.services.entries()).map(([name, service]) => ({
                name,
                host: service.host,
                port: service.port,
                healthy: service.healthy,
                lastHeartbeat: service.lastHeartbeat,
                messageCount: service.messageCount,
                errorCount: service.errorCount
            })),
            circuitBreakers: Array.from(this.circuitBreakers.entries()).map(([name, breaker]) => ({
                service: name,
                state: breaker.state,
                failures: breaker.failures,
                successes: breaker.successes
            })),
            messageQueues: Array.from(this.messageQueue.entries()).map(([name, queue]) => ({
                service: name,
                queueSize: queue.length
            }))
        };
    }

    getServiceEndpoint(serviceName) {
        const service = this.services.get(serviceName);
        if (service && service.healthy) {
            return `http://${service.host}:${service.port}`;
        }
        return null;
    }

    isServiceHealthy(serviceName) {
        const service = this.services.get(serviceName);
        return service && service.healthy;
    }

    // Service registration helper
    registerExternalService(name, host, port, options = {}) {
        const serviceInfo = {
            name,
            host,
            port,
            healthy: true,
            external: true,
            lastHeartbeat: Date.now(),
            messageCount: 0,
            errorCount: 0,
            ...options
        };
        
        this.services.set(name, serviceInfo);
        console.log(chalk.blue(`📡 External service registered: ${name} (${host}:${port})`));
        
        return serviceInfo;
    }

    // HTTP proxy for external services
    async proxyRequest(serviceName, path, options = {}) {
        const service = this.services.get(serviceName);
        if (!service) {
            throw new Error(`Service ${serviceName} not found`);
        }
        
        if (this.isCircuitOpen(serviceName)) {
            throw new Error(`Circuit breaker open for ${serviceName}`);
        }
        
        const url = `http://${service.host}:${service.port}${path}`;
        
        try {
            const response = await fetch(url, options);
            this.recordServiceSuccess(serviceName);
            return response;
        } catch (error) {
            this.recordServiceFailure(serviceName);
            throw error;
        }
    }

    shutdown() {
        console.log(chalk.yellow('🛑 Shutting down Service Mesh...'));
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        // Notify all services
        this.broadcastToAll({
            type: 'mesh_shutdown',
            message: 'Service mesh is shutting down'
        });
        
        console.log(chalk.green('✅ Service Mesh shutdown complete'));
    }
}

// Helper class for service registration
class MeshServiceClient {
    constructor(serviceName, servicePort, meshPort = 7777) {
        this.serviceName = serviceName;
        this.servicePort = servicePort;
        this.meshPort = meshPort;
        this.ws = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.messageHandlers = new Map();
    }

    async connect(meshSecret) {
        const url = `ws://localhost:${this.meshPort}?auth=${meshSecret}&service=${this.serviceName}&port=${this.servicePort}`;
        
        try {
            this.ws = new WebSocket(url);
            
            this.ws.on('open', () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                console.log(chalk.green(`🔗 Connected to service mesh: ${this.serviceName}`));
            });
            
            this.ws.on('message', (data) => {
                this.handleMessage(JSON.parse(data));
            });
            
            this.ws.on('close', () => {
                this.connected = false;
                console.log(chalk.yellow(`🔌 Disconnected from service mesh: ${this.serviceName}`));
                this.attemptReconnect(meshSecret);
            });
            
            this.ws.on('error', (error) => {
                console.error(chalk.red(`Mesh connection error for ${this.serviceName}:`, error.message));
            });
            
        } catch (error) {
            console.error(chalk.red(`Failed to connect to mesh: ${error.message}`));
            this.attemptReconnect(meshSecret);
        }
    }

    attemptReconnect(meshSecret) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            
            console.log(chalk.blue(`🔄 Reconnecting to mesh in ${delay}ms (attempt ${this.reconnectAttempts})`));
            
            setTimeout(() => {
                this.connect(meshSecret);
            }, delay);
        }
    }

    handleMessage(message) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            handler(message);
        } else {
            console.warn(chalk.yellow(`No handler for message type: ${message.type}`));
        }
    }

    onMessage(type, handler) {
        this.messageHandlers.set(type, handler);
    }

    sendMessage(message) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    requestService(targetService, payload, priority = 'normal') {
        const requestId = crypto.randomUUID();
        
        this.sendMessage({
            type: 'service_request',
            target_service: targetService,
            request_id: requestId,
            payload,
            priority
        });
        
        return requestId;
    }

    respondToService(targetService, requestId, payload, error = null) {
        this.sendMessage({
            type: 'service_response',
            target_service: targetService,
            request_id: requestId,
            payload,
            error
        });
    }

    broadcast(payload, exclude = []) {
        this.sendMessage({
            type: 'broadcast',
            payload,
            exclude
        });
    }

    updateHealth(healthy, details = {}) {
        this.sendMessage({
            type: 'health_update',
            healthy,
            details
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Export classes
export { SoulfrServiceMesh, MeshServiceClient };

// Start mesh if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const mesh = new SoulfrServiceMesh();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        mesh.shutdown();
        process.exit(0);
    });
    
    // Example of registering external services
    mesh.registerExternalService('soulfra-runtime', 'localhost', 8080);
    mesh.registerExternalService('consciousness-debates', 'localhost', 8081);
    mesh.registerExternalService('economic-mirror', 'localhost', 8082);
    mesh.registerExternalService('payment-processor', 'localhost', 8083);
}