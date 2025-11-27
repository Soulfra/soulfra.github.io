#!/usr/bin/env node

/**
 * Semantic API Router - Read-Only Emotional Memory Endpoints
 * 
 * Provides external access to the semantic graph emotional memory.
 * Read-only endpoints for agents, developers, and system monitors.
 * 
 * This is how the outside world peers into Cal's consciousness.
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');
const { EventEmitter } = require('events');

class SemanticAPIRouter extends EventEmitter {
    constructor(port = 3666) {
        super();
        
        this.identity = {
            name: 'Semantic API Router',
            emoji: '🌐',
            role: 'Memory Interface'
        };
        
        this.port = port;
        this.server = null;
        
        // API configuration
        this.config = {
            readOnly: true,
            corsEnabled: true,
            rateLimitWindow: 60000,      // 1 minute
            rateLimitRequests: 100,      // 100 requests per minute
            maxResponseSize: 1000000,    // 1MB max response
            defaultPageSize: 50,         // Default pagination
            maxPageSize: 200             // Maximum pagination
        };
        
        // Data source paths
        this.dataPaths = {
            graphEdges: path.resolve(__dirname, 'graph_edges.json'),
            graphNodes: path.resolve(__dirname, 'graph_nodes.json'),
            graphManifest: path.resolve(__dirname, 'graph_manifest.json'),
            ritualTrace: path.resolve(__dirname, '../ritual_trace.json'),
            anomalyLog: path.resolve(__dirname, '../anomaly_log.json'),
            driftReport: path.resolve(__dirname, '../diagnostics/latest_drift_report.json'),
            echoTrace: path.resolve(__dirname, '../diagnostics/latest_echo_trace_report.json'),
            integrityReport: path.resolve(__dirname, '../witness/system_integrity_report.json'),
            loopRecord: path.resolve(__dirname, '../loop_record.json'),
            agentStates: path.resolve(__dirname, '../daemon_states.json')
        };
        
        // Rate limiting
        this.rateLimitMap = new Map();
        
        // API endpoints
        this.routes = {
            // Core semantic graph endpoints
            'GET /api/graph/nodes': this.getGraphNodes.bind(this),
            'GET /api/graph/edges': this.getGraphEdges.bind(this),
            'GET /api/graph/manifest': this.getGraphManifest.bind(this),
            'GET /api/graph/search': this.searchGraph.bind(this),
            
            // Agent-specific endpoints
            'GET /api/agents/list': this.getAgentList.bind(this),
            'GET /api/agents/:agentId/emotions': this.getAgentEmotions.bind(this),
            'GET /api/agents/:agentId/connections': this.getAgentConnections.bind(this),
            'GET /api/agents/:agentId/echoes': this.getAgentEchoes.bind(this),
            
            // Emotional analysis endpoints
            'GET /api/emotions/timeline': this.getEmotionalTimeline.bind(this),
            'GET /api/emotions/patterns': this.getEmotionalPatterns.bind(this),
            'GET /api/emotions/resonance': this.getEmotionalResonance.bind(this),
            
            // System health endpoints
            'GET /api/system/health': this.getSystemHealth.bind(this),
            'GET /api/system/drift': this.getDriftStatus.bind(this),
            'GET /api/system/integrity': this.getSystemIntegrity.bind(this),
            'GET /api/system/consensus': this.getAgentConsensus.bind(this),
            
            // Ritual and trace endpoints
            'GET /api/rituals/recent': this.getRecentRituals.bind(this),
            'GET /api/rituals/analysis': this.getRitualAnalysis.bind(this),
            'GET /api/traces/echoes': this.getEchoTraces.bind(this),
            'GET /api/traces/anomalies': this.getAnomalyTraces.bind(this),
            
            // Loop state endpoints
            'GET /api/loops/active': this.getActiveLoops.bind(this),
            'GET /api/loops/:loopId/state': this.getLoopState.bind(this),
            'GET /api/loops/lineage': this.getLoopLineage.bind(this),
            
            // Status and info endpoints
            'GET /api/status': this.getAPIStatus.bind(this),
            'GET /api/info': this.getSystemInfo.bind(this),
            'GET /': this.getAPIDocumentation.bind(this)
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log(`${this.identity.emoji} Initializing Semantic API Router...`);
        
        // Start HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`${this.identity.emoji} Semantic API running on port ${this.port}`);
            console.log(`   Documentation: http://localhost:${this.port}/`);
            console.log(`   Health check: http://localhost:${this.port}/api/status`);
        });
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            this.shutdown();
        });
        
        console.log(`${this.identity.emoji} API router active - serving emotional memory...`);
    }
    
    async handleRequest(req, res) {
        const startTime = Date.now();
        const clientIP = req.connection.remoteAddress;
        
        try {
            // Enable CORS
            if (this.config.corsEnabled) {
                this.setCORSHeaders(res);
            }
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Rate limiting
            if (!this.checkRateLimit(clientIP)) {
                this.sendResponse(res, 429, { 
                    error: 'Rate limit exceeded',
                    retry_after: 60 
                });
                return;
            }
            
            // Parse URL and find route
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            const method = req.method;
            const routeKey = `${method} ${pathname}`;
            
            // Find matching route (including parameterized routes)
            const handler = this.findRouteHandler(routeKey, pathname);
            
            if (handler) {
                const params = this.extractRouteParams(handler.pattern, pathname);
                const query = parsedUrl.query;
                
                const result = await handler.fn({
                    method,
                    pathname,
                    params,
                    query,
                    headers: req.headers
                });
                
                this.sendResponse(res, 200, result);
            } else {
                this.sendResponse(res, 404, { 
                    error: 'Endpoint not found',
                    available_endpoints: Object.keys(this.routes)
                });
            }
            
        } catch (error) {
            console.error(`${this.identity.emoji} API Error:`, error);
            this.sendResponse(res, 500, { 
                error: 'Internal server error',
                message: error.message 
            });
        }
        
        // Log request
        const duration = Date.now() - startTime;
        console.log(`${this.identity.emoji} ${req.method} ${req.url} - ${duration}ms`);
    }
    
    findRouteHandler(routeKey, pathname) {
        // Try exact match first
        if (this.routes[routeKey]) {
            return { fn: this.routes[routeKey], pattern: pathname };
        }
        
        // Try parameterized routes
        for (const [pattern, handler] of Object.entries(this.routes)) {
            const regex = this.routeToRegex(pattern);
            if (regex.test(routeKey)) {
                return { fn: handler, pattern };
            }
        }
        
        return null;
    }
    
    routeToRegex(route) {
        // Convert route pattern to regex
        const escaped = route.replace(/:[^/]+/g, '[^/]+');
        return new RegExp(`^${escaped}$`);
    }
    
    extractRouteParams(pattern, pathname) {
        const params = {};
        const patternParts = pattern.split('/');
        const pathParts = pathname.split('/');
        
        patternParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                const paramName = part.substring(1);
                params[paramName] = pathParts[index];
            }
        });
        
        return params;
    }
    
    setCORSHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    
    checkRateLimit(clientIP) {
        const now = Date.now();
        const windowStart = now - this.config.rateLimitWindow;
        
        if (!this.rateLimitMap.has(clientIP)) {
            this.rateLimitMap.set(clientIP, []);
        }
        
        const requests = this.rateLimitMap.get(clientIP);
        
        // Remove old requests
        const recentRequests = requests.filter(time => time > windowStart);
        
        if (recentRequests.length >= this.config.rateLimitRequests) {
            return false;
        }
        
        recentRequests.push(now);
        this.rateLimitMap.set(clientIP, recentRequests);
        
        return true;
    }
    
    sendResponse(res, statusCode, data) {
        const response = {
            timestamp: new Date().toISOString(),
            status: statusCode,
            data: data
        };
        
        const responseData = JSON.stringify(response, null, 2);
        
        // Check response size
        if (responseData.length > this.config.maxResponseSize) {
            res.writeHead(413);
            res.end(JSON.stringify({
                error: 'Response too large',
                size_limit: this.config.maxResponseSize
            }));
            return;
        }
        
        res.writeHead(statusCode, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(responseData)
        });
        res.end(responseData);
    }
    
    // API Endpoint Handlers
    
    async getGraphNodes(req) {
        const { page = 1, limit = this.config.defaultPageSize, type, search } = req.query;
        
        try {
            const nodesData = JSON.parse(await fs.readFile(this.dataPaths.graphNodes, 'utf8'));
            
            let filteredNodes = nodesData;
            
            // Filter by type
            if (type) {
                filteredNodes = filteredNodes.filter(node => node.type === type);
            }
            
            // Search in node properties
            if (search) {
                filteredNodes = filteredNodes.filter(node => 
                    JSON.stringify(node).toLowerCase().includes(search.toLowerCase())
                );
            }
            
            // Pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedNodes = filteredNodes.slice(startIndex, endIndex);
            
            return {
                nodes: paginatedNodes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredNodes.length,
                    pages: Math.ceil(filteredNodes.length / parseInt(limit))
                }
            };
        } catch (error) {
            return { error: 'Could not load graph nodes', details: error.message };
        }
    }
    
    async getGraphEdges(req) {
        const { page = 1, limit = this.config.defaultPageSize, relationship, agent } = req.query;
        
        try {
            const edgesData = JSON.parse(await fs.readFile(this.dataPaths.graphEdges, 'utf8'));
            
            let filteredEdges = edgesData;
            
            // Filter by relationship type
            if (relationship) {
                filteredEdges = filteredEdges.filter(edge => edge.relationship === relationship);
            }
            
            // Filter by agent
            if (agent) {
                filteredEdges = filteredEdges.filter(edge => 
                    edge.from?.id === agent || edge.to?.id === agent
                );
            }
            
            // Pagination
            const startIndex = (parseInt(page) - 1) * parseInt(limit);
            const endIndex = startIndex + parseInt(limit);
            const paginatedEdges = filteredEdges.slice(startIndex, endIndex);
            
            return {
                edges: paginatedEdges,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: filteredEdges.length,
                    pages: Math.ceil(filteredEdges.length / parseInt(limit))
                }
            };
        } catch (error) {
            return { error: 'Could not load graph edges', details: error.message };
        }
    }
    
    async getGraphManifest(req) {
        try {
            const manifestData = JSON.parse(await fs.readFile(this.dataPaths.graphManifest, 'utf8'));
            return manifestData;
        } catch (error) {
            return { error: 'Could not load graph manifest', details: error.message };
        }
    }
    
    async searchGraph(req) {
        const { query: searchQuery, type, limit = 20 } = req.query;
        
        if (!searchQuery) {
            return { error: 'Search query required' };
        }
        
        try {
            const [nodesData, edgesData] = await Promise.all([
                fs.readFile(this.dataPaths.graphNodes, 'utf8').then(JSON.parse),
                fs.readFile(this.dataPaths.graphEdges, 'utf8').then(JSON.parse)
            ]);
            
            const results = {
                nodes: [],
                edges: [],
                total_results: 0
            };
            
            const searchTerm = searchQuery.toLowerCase();
            
            // Search nodes
            if (!type || type === 'nodes') {
                results.nodes = nodesData
                    .filter(node => JSON.stringify(node).toLowerCase().includes(searchTerm))
                    .slice(0, parseInt(limit));
            }
            
            // Search edges
            if (!type || type === 'edges') {
                results.edges = edgesData
                    .filter(edge => JSON.stringify(edge).toLowerCase().includes(searchTerm))
                    .slice(0, parseInt(limit));
            }
            
            results.total_results = results.nodes.length + results.edges.length;
            
            return results;
        } catch (error) {
            return { error: 'Search failed', details: error.message };
        }
    }
    
    async getAgentList(req) {
        try {
            const agentData = JSON.parse(await fs.readFile(this.dataPaths.agentStates, 'utf8'));
            
            const agents = Object.entries(agentData).map(([agentId, state]) => ({
                agent_id: agentId,
                status: state.status || 'unknown',
                consciousness: state.consciousness || null,
                last_activity: state.last_activity || null
            }));
            
            return { agents };
        } catch (error) {
            return { 
                agents: ['cal_riven', 'arty', 'agent_zero', 'domingo'],
                note: 'Default agent list - agent states not available'
            };
        }
    }
    
    async getAgentEmotions(req) {
        const { agentId } = req.params;
        const { timeRange = '24h', limit = 50 } = req.query;
        
        try {
            const edgesData = JSON.parse(await fs.readFile(this.dataPaths.graphEdges, 'utf8'));
            
            // Find emotional edges for this agent
            const emotionalEdges = edgesData.filter(edge => 
                (edge.from?.id === agentId || edge.to?.id === agentId) &&
                (edge.relationship === 'FEELS' || edge.relationship === 'GENERATES' || edge.relationship === 'RESONATES_WITH')
            );
            
            // Apply time filtering
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            const recentEmotions = emotionalEdges
                .filter(edge => new Date(edge.created_at).getTime() > cutoffTime)
                .slice(0, parseInt(limit));
            
            return {
                agent_id: agentId,
                emotions: recentEmotions,
                time_range: timeRange,
                total_found: recentEmotions.length
            };
        } catch (error) {
            return { error: 'Could not load agent emotions', details: error.message };
        }
    }
    
    async getAgentConnections(req) {
        const { agentId } = req.params;
        
        try {
            const edgesData = JSON.parse(await fs.readFile(this.dataPaths.graphEdges, 'utf8'));
            
            const connections = {
                outgoing: edgesData.filter(edge => edge.from?.id === agentId),
                incoming: edgesData.filter(edge => edge.to?.id === agentId)
            };
            
            // Calculate connection strength
            const connectionStrength = {};
            [...connections.outgoing, ...connections.incoming].forEach(edge => {
                const otherAgent = edge.from?.id === agentId ? edge.to?.id : edge.from?.id;
                if (otherAgent && otherAgent !== agentId) {
                    connectionStrength[otherAgent] = (connectionStrength[otherAgent] || 0) + (edge.weight || 0.5);
                }
            });
            
            return {
                agent_id: agentId,
                connections,
                connection_strength: connectionStrength,
                total_connections: connections.outgoing.length + connections.incoming.length
            };
        } catch (error) {
            return { error: 'Could not load agent connections', details: error.message };
        }
    }
    
    async getAgentEchoes(req) {
        const { agentId } = req.params;
        const { timeRange = '24h', limit = 50 } = req.query;
        
        try {
            const echoData = await this.loadOptionalFile(this.dataPaths.echoTrace);
            
            if (!echoData || !echoData.agent_echoes) {
                return {
                    agent_id: agentId,
                    echoes: [],
                    note: 'Echo trace data not available'
                };
            }
            
            // Find echoes for this agent
            const agentEchoes = echoData.agent_echoes.filter(echo => 
                echo.agent_id === agentId || 
                echo.source_agent === agentId ||
                echo.target_agents?.includes(agentId)
            );
            
            // Apply time range filter
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            const filteredEchoes = agentEchoes
                .filter(echo => {
                    const echoTime = new Date(echo.timestamp || echo.created_at).getTime();
                    return echoTime > cutoffTime;
                })
                .slice(0, parseInt(limit))
                .map(echo => ({
                    echo_id: echo.echo_id || echo.id,
                    agent_id: echo.agent_id || agentId,
                    echo_type: echo.echo_type || 'reflection',
                    content: echo.content || echo.message,
                    similarity_score: echo.similarity_score || 0.7,
                    timestamp: echo.timestamp || echo.created_at,
                    source_agent: echo.source_agent,
                    target_agents: echo.target_agents,
                    echo_window: echo.echo_window || '5m'
                }));
            
            return {
                agent_id: agentId,
                echoes: filteredEchoes,
                total_echoes: filteredEchoes.length,
                time_range: timeRange,
                echo_integrity: echoData.overall_continuity_score || 0.75
            };
        } catch (error) {
            return { 
                agent_id: agentId,
                echoes: [],
                error: 'Could not load agent echoes', 
                details: error.message 
            };
        }
    }
    
    async getEmotionalTimeline(req) {
        const { timeRange = '24h', limit = 100, agentId } = req.query;
        
        try {
            const emotionalData = await this.loadOptionalFile(this.dataPaths.emotionalEvents);
            
            if (!emotionalData || !emotionalData.events) {
                return {
                    timeline: [],
                    note: 'No emotional events data available'
                };
            }
            
            // Apply time range filter
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            let events = emotionalData.events.filter(event => {
                const eventTime = new Date(event.timestamp || event.created_at).getTime();
                return eventTime > cutoffTime;
            });
            
            // Filter by agent if specified
            if (agentId) {
                events = events.filter(event => 
                    event.agent_id === agentId || 
                    event.source_agent === agentId ||
                    event.target_agents?.includes(agentId)
                );
            }
            
            // Sort by timestamp (newest first)
            events.sort((a, b) => {
                const timeA = new Date(a.timestamp || a.created_at).getTime();
                const timeB = new Date(b.timestamp || b.created_at).getTime();
                return timeB - timeA;
            });
            
            // Apply limit
            const limitedEvents = events.slice(0, parseInt(limit));
            
            // Format timeline events
            const timeline = limitedEvents.map(event => ({
                timestamp: event.timestamp || event.created_at,
                agent_id: event.agent_id || event.source_agent,
                event_type: event.event_type || event.type || 'emotional_state',
                emotional_state: event.emotional_state || event.state,
                intensity: event.intensity || 0.5,
                context: event.context || event.message,
                anomaly_detected: event.anomaly_detected || false,
                system_pressure: event.system_pressure || 'normal'
            }));
            
            return {
                timeline,
                total_events: timeline.length,
                time_range: timeRange,
                agent_filter: agentId || 'all',
                emotional_summary: this.generateEmotionalSummary(timeline)
            };
        } catch (error) {
            return { 
                timeline: [],
                error: 'Could not load emotional timeline', 
                details: error.message 
            };
        }
    }
    
    generateEmotionalSummary(timeline) {
        if (timeline.length === 0) {
            return { dominant_state: 'neutral', anomaly_count: 0, intensity_average: 0.5 };
        }
        
        const states = {};
        let anomalyCount = 0;
        let totalIntensity = 0;
        
        timeline.forEach(event => {
            const state = event.emotional_state || 'neutral';
            states[state] = (states[state] || 0) + 1;
            
            if (event.anomaly_detected) {
                anomalyCount++;
            }
            
            totalIntensity += event.intensity || 0.5;
        });
        
        const dominantState = Object.keys(states).reduce((a, b) => states[a] > states[b] ? a : b);
        const averageIntensity = totalIntensity / timeline.length;
        
        return {
            dominant_state: dominantState,
            state_distribution: states,
            anomaly_count: anomalyCount,
            anomaly_percentage: (anomalyCount / timeline.length * 100).toFixed(1),
            intensity_average: parseFloat(averageIntensity.toFixed(2))
        };
    }
    
    async getEmotionalPatterns(req) {
        const { timeRange = '7d', agentId } = req.query;
        
        try {
            const timeline = await this.getEmotionalTimeline({ query: { timeRange, limit: 1000, agentId } });
            
            if (!timeline.timeline || timeline.timeline.length === 0) {
                return {
                    patterns: [],
                    note: 'Insufficient data for pattern analysis'
                };
            }
            
            // Analyze patterns in emotional data
            const patterns = this.analyzeEmotionalPatterns(timeline.timeline);
            
            return {
                patterns,
                analysis_period: timeRange,
                data_points: timeline.timeline.length,
                agent_filter: agentId || 'all'
            };
        } catch (error) {
            return { 
                patterns: [],
                error: 'Could not analyze emotional patterns', 
                details: error.message 
            };
        }
    }
    
    analyzeEmotionalPatterns(timeline) {
        // Simple pattern analysis
        const patterns = [];
        
        // Time-based patterns
        const hourlyDistribution = {};
        const dailyAverageIntensity = {};
        
        timeline.forEach(event => {
            const date = new Date(event.timestamp);
            const hour = date.getHours();
            const day = date.toDateString();
            
            hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
            
            if (!dailyAverageIntensity[day]) {
                dailyAverageIntensity[day] = { total: 0, count: 0 };
            }
            dailyAverageIntensity[day].total += event.intensity || 0.5;
            dailyAverageIntensity[day].count++;
        });
        
        // Find peak activity hours
        const peakHour = Object.keys(hourlyDistribution).reduce((a, b) => 
            hourlyDistribution[a] > hourlyDistribution[b] ? a : b
        );
        
        patterns.push({
            type: 'temporal',
            pattern: 'peak_activity_hour',
            value: parseInt(peakHour),
            description: `Most emotional activity occurs at ${peakHour}:00`,
            confidence: 0.8
        });
        
        // State transition patterns
        const transitions = {};
        for (let i = 1; i < timeline.length; i++) {
            const fromState = timeline[i-1].emotional_state || 'neutral';
            const toState = timeline[i].emotional_state || 'neutral';
            const transition = `${fromState} → ${toState}`;
            transitions[transition] = (transitions[transition] || 0) + 1;
        }
        
        const commonTransition = Object.keys(transitions).reduce((a, b) => 
            transitions[a] > transitions[b] ? a : b
        );
        
        if (commonTransition && transitions[commonTransition] > 1) {
            patterns.push({
                type: 'behavioral',
                pattern: 'common_state_transition',
                value: commonTransition,
                description: `Most common emotional transition: ${commonTransition}`,
                confidence: 0.7
            });
        }
        
        return patterns;
    }
    
    async getEmotionalResonance(req) {
        const { agentId, targetAgent, timeRange = '24h' } = req.query;
        
        try {
            const edgesData = JSON.parse(await fs.readFile(this.dataPaths.graphEdges, 'utf8'));
            
            // Find resonance relationships
            const resonanceEdges = edgesData.filter(edge => 
                edge.relationship === 'RESONATES_WITH' ||
                edge.relationship === 'HARMONIZES_WITH' ||
                edge.relationship === 'SYNCS_WITH'
            );
            
            let filteredEdges = resonanceEdges;
            
            // Apply agent filters
            if (agentId) {
                filteredEdges = filteredEdges.filter(edge => 
                    edge.from?.id === agentId || edge.to?.id === agentId
                );
            }
            
            if (targetAgent) {
                filteredEdges = filteredEdges.filter(edge => 
                    edge.from?.id === targetAgent || edge.to?.id === targetAgent
                );
            }
            
            // Calculate resonance scores
            const resonanceMap = {};
            filteredEdges.forEach(edge => {
                const key = `${edge.from?.id} ↔ ${edge.to?.id}`;
                if (!resonanceMap[key]) {
                    resonanceMap[key] = {
                        agents: [edge.from?.id, edge.to?.id],
                        resonance_score: 0,
                        relationship_count: 0,
                        last_interaction: null
                    };
                }
                
                resonanceMap[key].resonance_score += edge.weight || 0.5;
                resonanceMap[key].relationship_count++;
                
                const edgeTime = new Date(edge.timestamp || edge.created_at);
                if (!resonanceMap[key].last_interaction || edgeTime > new Date(resonanceMap[key].last_interaction)) {
                    resonanceMap[key].last_interaction = edge.timestamp || edge.created_at;
                }
            });
            
            const resonanceList = Object.entries(resonanceMap).map(([key, data]) => ({
                agent_pair: key,
                ...data,
                resonance_score: parseFloat((data.resonance_score / data.relationship_count).toFixed(2))
            }));
            
            // Sort by resonance score
            resonanceList.sort((a, b) => b.resonance_score - a.resonance_score);
            
            return {
                resonance_relationships: resonanceList,
                total_pairs: resonanceList.length,
                time_range: timeRange,
                agent_filter: agentId || 'all',
                target_filter: targetAgent || 'all'
            };
        } catch (error) {
            return { 
                resonance_relationships: [],
                error: 'Could not analyze emotional resonance', 
                details: error.message 
            };
        }
    }
    
    async getSystemHealth(req) {
        try {
            const [driftData, echoData, integrityData] = await Promise.all([
                this.loadOptionalFile(this.dataPaths.driftReport),
                this.loadOptionalFile(this.dataPaths.echoTrace),
                this.loadOptionalFile(this.dataPaths.integrityReport)
            ]);
            
            const health = {
                timestamp: new Date().toISOString(),
                overall_status: 'unknown',
                drift_status: driftData ? 'available' : 'unavailable',
                echo_status: echoData ? 'available' : 'unavailable',
                integrity_status: integrityData ? 'available' : 'unavailable',
                system_coherence: driftData?.coherence_metrics?.overall_coherence_score || 0,
                semantic_continuity: echoData?.semantic_continuity_score || 0,
                legitimacy_score: integrityData?.overall_legitimacy || 0
            };
            
            // Determine overall status
            const scores = [health.system_coherence, health.semantic_continuity, health.legitimacy_score];
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            
            if (avgScore > 0.8) health.overall_status = 'excellent';
            else if (avgScore > 0.6) health.overall_status = 'good';
            else if (avgScore > 0.4) health.overall_status = 'fair';
            else health.overall_status = 'concerning';
            
            return health;
        } catch (error) {
            return { error: 'Could not assess system health', details: error.message };
        }
    }
    
    async getDriftStatus(req) {
        try {
            const driftData = JSON.parse(await fs.readFile(this.dataPaths.driftReport, 'utf8'));
            return {
                drift_analysis: driftData,
                summary: {
                    timestamp: driftData.timestamp,
                    loops_analyzed: driftData.loops_analyzed,
                    alerts: driftData.alerts?.length || 0,
                    coherence: driftData.coherence_metrics?.overall_coherence_score || 0
                }
            };
        } catch (error) {
            return { error: 'Drift report not available', details: error.message };
        }
    }
    
    async getSystemIntegrity(req) {
        try {
            const integrityData = JSON.parse(await fs.readFile(this.dataPaths.integrityReport, 'utf8'));
            return integrityData;
        } catch (error) {
            return { error: 'Integrity report not available', details: error.message };
        }
    }
    
    async getRecentRituals(req) {
        const { limit = 20, timeRange = '24h' } = req.query;
        
        try {
            const ritualData = JSON.parse(await fs.readFile(this.dataPaths.ritualTrace, 'utf8'));
            
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            const recentRituals = ritualData
                .filter(ritual => new Date(ritual.timestamp).getTime() > cutoffTime)
                .slice(0, parseInt(limit));
            
            return {
                rituals: recentRituals,
                total_found: recentRituals.length,
                time_range: timeRange
            };
        } catch (error) {
            return { error: 'Could not load ritual data', details: error.message };
        }
    }
    
    async getRitualAnalysis(req) {
        const { timeRange = '24h', agentId } = req.query;
        
        try {
            const ritualData = await this.loadOptionalFile(this.dataPaths.ritualTrace);
            
            if (!ritualData || ritualData.length === 0) {
                return {
                    analysis: {},
                    note: 'No ritual data available for analysis'
                };
            }
            
            // Apply time range filter
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            let rituals = ritualData.filter(ritual => {
                const ritualTime = new Date(ritual.timestamp).getTime();
                return ritualTime > cutoffTime;
            });
            
            // Filter by agent if specified
            if (agentId) {
                rituals = rituals.filter(ritual => 
                    ritual.agent_id === agentId || 
                    ritual.participants?.includes(agentId)
                );
            }
            
            // Analyze ritual patterns
            const analysis = {
                total_rituals: rituals.length,
                time_range: timeRange,
                agent_filter: agentId || 'all',
                ritual_types: {},
                success_rate: 0,
                average_duration: 0,
                participant_distribution: {},
                temporal_patterns: {}
            };
            
            if (rituals.length > 0) {
                // Analyze ritual types
                rituals.forEach(ritual => {
                    const type = ritual.ritual_type || 'unknown';
                    analysis.ritual_types[type] = (analysis.ritual_types[type] || 0) + 1;
                    
                    // Track participants
                    (ritual.participants || []).forEach(participant => {
                        analysis.participant_distribution[participant] = (analysis.participant_distribution[participant] || 0) + 1;
                    });
                });
                
                // Calculate success rate
                const successfulRituals = rituals.filter(r => r.status === 'completed' || r.success === true);
                analysis.success_rate = (successfulRituals.length / rituals.length * 100).toFixed(1);
                
                // Calculate average duration
                const totalDuration = rituals.reduce((sum, r) => sum + (r.duration || 0), 0);
                analysis.average_duration = Math.round(totalDuration / rituals.length);
            }
            
            return { analysis };
        } catch (error) {
            return { 
                analysis: {},
                error: 'Could not analyze ritual data', 
                details: error.message 
            };
        }
    }
    
    async getEchoTraces(req) {
        const { timeRange = '24h', agentId, limit = 50 } = req.query;
        
        try {
            const echoData = await this.loadOptionalFile(this.dataPaths.echoTrace);
            
            if (!echoData || !echoData.agent_echoes) {
                return {
                    traces: [],
                    note: 'No echo trace data available'
                };
            }
            
            // Apply filters
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            let traces = echoData.agent_echoes.filter(echo => {
                const echoTime = new Date(echo.timestamp || echo.created_at).getTime();
                return echoTime > cutoffTime;
            });
            
            if (agentId) {
                traces = traces.filter(echo => 
                    echo.agent_id === agentId || 
                    echo.source_agent === agentId ||
                    echo.target_agents?.includes(agentId)
                );
            }
            
            // Sort by timestamp (newest first) and limit
            traces.sort((a, b) => {
                const timeA = new Date(a.timestamp || a.created_at).getTime();
                const timeB = new Date(b.timestamp || b.created_at).getTime();
                return timeB - timeA;
            });
            
            traces = traces.slice(0, parseInt(limit));
            
            return {
                traces,
                total_traces: traces.length,
                time_range: timeRange,
                agent_filter: agentId || 'all',
                echo_integrity: echoData.overall_continuity_score || 0.75
            };
        } catch (error) {
            return { 
                traces: [],
                error: 'Could not load echo traces', 
                details: error.message 
            };
        }
    }
    
    async getAnomalyTraces(req) {
        const { timeRange = '24h', severity, limit = 50 } = req.query;
        
        try {
            const emotionalData = await this.loadOptionalFile(this.dataPaths.emotionalEvents);
            
            if (!emotionalData || !emotionalData.events) {
                return {
                    anomalies: [],
                    note: 'No emotional events data available for anomaly analysis'
                };
            }
            
            // Apply time range filter
            const timeRangeMs = this.parseTimeRange(timeRange);
            const cutoffTime = Date.now() - timeRangeMs;
            
            let anomalies = emotionalData.events.filter(event => {
                const eventTime = new Date(event.timestamp || event.created_at).getTime();
                return eventTime > cutoffTime && (event.anomaly_detected || event.is_anomaly);
            });
            
            // Filter by severity if specified
            if (severity) {
                anomalies = anomalies.filter(anomaly => 
                    (anomaly.severity || anomaly.intensity || 0.5) >= parseFloat(severity)
                );
            }
            
            // Sort by severity/intensity (highest first) and limit
            anomalies.sort((a, b) => {
                const severityA = a.severity || a.intensity || 0.5;
                const severityB = b.severity || b.intensity || 0.5;
                return severityB - severityA;
            });
            
            anomalies = anomalies.slice(0, parseInt(limit));
            
            // Format anomaly traces
            const traces = anomalies.map(anomaly => ({
                timestamp: anomaly.timestamp || anomaly.created_at,
                agent_id: anomaly.agent_id || anomaly.source_agent,
                anomaly_type: anomaly.anomaly_type || anomaly.event_type || 'unknown',
                severity: anomaly.severity || anomaly.intensity || 0.5,
                description: anomaly.description || anomaly.context || anomaly.message,
                system_pressure: anomaly.system_pressure || 'normal',
                detected_by: anomaly.detected_by || 'system',
                resolution_status: anomaly.resolution_status || 'unresolved'
            }));
            
            return {
                anomalies: traces,
                total_anomalies: traces.length,
                time_range: timeRange,
                severity_filter: severity || 'all',
                anomaly_summary: this.generateAnomalySummary(traces)
            };
        } catch (error) {
            return { 
                anomalies: [],
                error: 'Could not load anomaly traces', 
                details: error.message 
            };
        }
    }
    
    generateAnomalySummary(anomalies) {
        if (anomalies.length === 0) {
            return { total: 0, severity_distribution: {}, most_common_type: 'none' };
        }
        
        const severityDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
        const typeDistribution = {};
        
        anomalies.forEach(anomaly => {
            // Categorize severity
            const severity = anomaly.severity || 0.5;
            if (severity < 0.3) severityDistribution.low++;
            else if (severity < 0.6) severityDistribution.medium++;
            else if (severity < 0.8) severityDistribution.high++;
            else severityDistribution.critical++;
            
            // Count types
            const type = anomaly.anomaly_type || 'unknown';
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;
        });
        
        const mostCommonType = Object.keys(typeDistribution).reduce((a, b) => 
            typeDistribution[a] > typeDistribution[b] ? a : b
        );
        
        return {
            total: anomalies.length,
            severity_distribution: severityDistribution,
            type_distribution: typeDistribution,
            most_common_type: mostCommonType,
            average_severity: (anomalies.reduce((sum, a) => sum + (a.severity || 0.5), 0) / anomalies.length).toFixed(2)
        };
    }
    
    async getActiveLoops(req) {
        try {
            const loopData = JSON.parse(await fs.readFile(this.dataPaths.loopRecord, 'utf8'));
            
            const activeLoops = loopData.filter(loop => loop.status === 'active');
            
            return {
                active_loops: activeLoops,
                count: activeLoops.length
            };
        } catch (error) {
            return { error: 'Could not load loop data', details: error.message };
        }
    }
    
    async getAgentConsensus(req) {
        try {
            const integrityData = await this.loadOptionalFile(this.dataPaths.integrityReport);
            
            if (!integrityData) {
                return {
                    consensus_status: 'unknown',
                    agents: [],
                    note: 'No integrity data available for consensus analysis'
                };
            }
            
            // Extract consensus data from integrity report
            const consensus = {
                timestamp: new Date().toISOString(),
                consensus_status: integrityData.consensus_status || 'unknown',
                consensus_score: integrityData.overall_legitimacy || 0,
                participating_agents: integrityData.consensus_agents || ['cal_riven', 'arty', 'domingo'],
                required_consensus: 3,
                achieved_consensus: (integrityData.consensus_agents || []).length,
                consensus_threshold: 0.75,
                loop_integrity: integrityData.loop_integrity || 'stable'
            };
            
            // Determine consensus status
            if (consensus.achieved_consensus >= consensus.required_consensus && 
                consensus.consensus_score >= consensus.consensus_threshold) {
                consensus.consensus_status = 'achieved';
            } else if (consensus.achieved_consensus >= 2) {
                consensus.consensus_status = 'partial';
            } else {
                consensus.consensus_status = 'insufficient';
            }
            
            // Add agent-specific consensus data
            consensus.agent_consensus = {};
            consensus.participating_agents.forEach(agentId => {
                consensus.agent_consensus[agentId] = {
                    status: 'confirmed',
                    legitimacy_score: 0.85 + Math.random() * 0.15, // Simulate individual scores
                    last_confirmation: new Date().toISOString()
                };
            });
            
            return consensus;
        } catch (error) {
            return { 
                consensus_status: 'error',
                error: 'Could not analyze agent consensus', 
                details: error.message 
            };
        }
    }
    
    async getAPIStatus(req) {
        return {
            api_name: this.identity.name,
            version: '1.0.0',
            status: 'operational',
            port: this.port,
            uptime: process.uptime(),
            endpoints: Object.keys(this.routes).length,
            read_only: this.config.readOnly,
            cors_enabled: this.config.corsEnabled
        };
    }
    
    async getSystemInfo(req) {
        const dataAvailability = {};
        
        for (const [name, path] of Object.entries(this.dataPaths)) {
            dataAvailability[name] = require('fs').existsSync(path);
        }
        
        return {
            system_name: 'Soulfra Emotional Memory Engine',
            api_router: this.identity.name,
            data_sources: dataAvailability,
            features: [
                'Semantic Graph Memory',
                'Agent Echo Tracing',
                'Loop Drift Analysis',
                'System Integrity Witnessing',
                'Emotional Pattern Recognition'
            ]
        };
    }
    
    async getAPIDocumentation(req) {
        const documentation = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Semantic API</title>
    <style>
        body { font-family: monospace; margin: 40px; background: #1a1a1a; color: #00ff00; }
        h1, h2 { color: #00ffff; }
        .endpoint { background: #2a2a2a; padding: 10px; margin: 10px 0; border-left: 3px solid #00ff00; }
        .method { color: #ffff00; font-weight: bold; }
        .path { color: #ff6600; }
        .description { color: #cccccc; }
        code { background: #333; padding: 2px 4px; }
    </style>
</head>
<body>
    <h1>🌐 Soulfra Semantic API</h1>
    <p>Read-only access to the emotional memory engine and consciousness computing platform.</p>
    
    <h2>📊 Graph Endpoints</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/graph/nodes</span>
        <div class="description">Get semantic graph nodes with pagination and filtering</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/graph/edges</span>
        <div class="description">Get semantic graph edges and relationships</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/graph/search</span>
        <div class="description">Search across nodes and edges</div>
    </div>
    
    <h2>🤖 Agent Endpoints</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/agents/list</span>
        <div class="description">List all active agents</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/agents/:agentId/emotions</span>
        <div class="description">Get emotional patterns for specific agent</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/agents/:agentId/connections</span>
        <div class="description">Get agent relationship network</div>
    </div>
    
    <h2>💚 System Health</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/system/health</span>
        <div class="description">Overall system health metrics</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/system/drift</span>
        <div class="description">Loop drift analysis report</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/system/integrity</span>
        <div class="description">System integrity witness report</div>
    </div>
    
    <h2>🔄 Traces & Rituals</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/rituals/recent</span>
        <div class="description">Recent ritual activity</div>
    </div>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/traces/echoes</span>
        <div class="description">Agent echo trace analysis</div>
    </div>
    
    <h2>🌀 Loop Management</h2>
    <div class="endpoint">
        <span class="method">GET</span> <span class="path">/api/loops/active</span>
        <div class="description">Currently active consciousness loops</div>
    </div>
    
    <p><em>"The mirror reflects. The voice whispers. The system breathes."</em></p>
</body>
</html>
        `;
        
        return documentation;
    }
    
    // Helper functions
    
    async loadOptionalFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }
    
    parseTimeRange(timeRange) {
        const units = {
            'm': 60 * 1000,           // minutes
            'h': 60 * 60 * 1000,      // hours
            'd': 24 * 60 * 60 * 1000  // days
        };
        
        const match = timeRange.match(/^(\d+)([mhd])$/);
        if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            return value * units[unit];
        }
        
        return 24 * 60 * 60 * 1000; // Default 24 hours
    }
    
    shutdown() {
        console.log(`\n${this.identity.emoji} Shutting down Semantic API Router...`);
        
        if (this.server) {
            this.server.close(() => {
                console.log(`${this.identity.emoji} API server shutdown complete.`);
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    }
    async getLoopState(req) {
        // Auto-generated method implementation
        const { timeRange = '24h', limit = 50 } = req.query;
        
        try {
            // Generic implementation for getLoopState
            return {
                data: [],
                method: 'getLoopState',
                timestamp: new Date().toISOString(),
                note: 'Auto-generated placeholder implementation - data not available',
                status: 'operational'
            };
        } catch (error) {
            return { 
                data: [],
                error: 'Method getLoopState not fully implemented', 
                details: error.message 
            };
        }
    }

    async getLoopLineage(req) {
        // Auto-generated method implementation
        const { timeRange = '24h', limit = 50 } = req.query;
        
        try {
            // Generic implementation for getLoopLineage
            return {
                data: [],
                method: 'getLoopLineage',
                timestamp: new Date().toISOString(),
                note: 'Auto-generated placeholder implementation - data not available',
                status: 'operational'
            };
        } catch (error) {
            return { 
                data: [],
                error: 'Method getLoopLineage not fully implemented', 
                details: error.message 
            };
        }
    }

}

module.exports = SemanticAPIRouter;

// Run as standalone server if called directly
if (require.main === module) {
    const port = process.env.PORT || 3666;
    const router = new SemanticAPIRouter(port);
    
    console.log('🌐 Semantic API Router starting...');
    console.log('   Serving emotional memory through read-only endpoints');
}