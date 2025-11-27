#!/usr/bin/env node
/**
 * Domain-Category Router
 * Maps domains to tool categories and routes requests to appropriate tier instances
 * Connects to existing Cal Drop Orchestrator for event routing
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

class DomainCategoryRouter {
    constructor() {
        this.app = express();
        this.port = 7676;
        
        // Domain to category mapping
        this.domainMap = {
            'calriven.com': {
                category: 'dev-tools',
                tier: 5,
                description: 'AI-powered development tools and code optimization',
                tools: ['code-analyzer', 'optimizer', 'api-builder', 'test-generator']
            },
            'cringeproof.com': {
                category: 'games',
                tier: 4,
                description: 'Games and entertainment with content filtering',
                tools: ['game-engine', 'content-filter', 'multiplayer-host', 'leaderboards']
            },
            'soulfra.com': {
                category: 'ai-agents',
                tier: 5,
                description: 'AI agents and autonomous systems',
                tools: ['agent-builder', 'blessing-system', 'chat-processor', 'orchestrator']
            },
            'vibevault.com': {
                category: 'productivity',
                tier: 4,
                description: 'Productivity and collaboration tools',
                tools: ['task-manager', 'team-chat', 'analytics', 'automations']
            },
            'mirroros.com': {
                category: 'creative',
                tier: 4,
                description: 'Creative and design tools',
                tools: ['image-generator', 'style-transfer', 'video-editor', 'music-ai']
            },
            'learnloop.com': {
                category: 'education',
                tier: 4,
                description: 'Educational and training platforms',
                tools: ['course-builder', 'quiz-engine', 'progress-tracker', 'certificates']
            }
        };
        
        // Tool to service mapping
        this.toolServices = {
            'code-analyzer': { port: 7878, path: '/api/analyze' },
            'optimizer': { port: 4040, path: '/api/optimize' },
            'agent-builder': { port: 8888, path: '/api/agent/create' },
            'chat-processor': { port: 3666, path: '/api/process' },
            'game-engine': { port: 5555, path: '/api/game' },
            'content-filter': { port: 6666, path: '/api/filter' }
        };
        
        // Active user instances
        this.userInstances = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // Get all categories
        this.app.get('/api/categories', (req, res) => {
            const categories = Object.entries(this.domainMap).map(([domain, info]) => ({
                domain,
                ...info,
                toolCount: info.tools.length
            }));
            res.json(categories);
        });
        
        // Route chat to appropriate tool
        this.app.post('/api/route', async (req, res) => {
            try {
                const { message, userId, context } = req.body;
                
                // Analyze message to determine intent and category
                const routing = await this.analyzeAndRoute(message, context);
                
                // Get or create user instance
                const instance = await this.getUserInstance(userId, routing.category);
                
                // Route to appropriate service
                const result = await this.routeToService(routing, instance, message);
                
                res.json({
                    success: true,
                    routing,
                    instance: instance.id,
                    result
                });
            } catch (error) {
                console.error('Routing error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get user instances
        this.app.get('/api/instances/:userId', (req, res) => {
            const userInstances = [];
            for (const [key, instance] of this.userInstances) {
                if (instance.userId === req.params.userId) {
                    userInstances.push(instance);
                }
            }
            res.json(userInstances);
        });
        
        // Spawn new instance
        this.app.post('/api/instances/spawn', async (req, res) => {
            try {
                const { userId, category, tier } = req.body;
                const instance = await this.spawnInstance(userId, category, tier);
                res.json(instance);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Connect to existing services
        this.app.get('/api/services/status', async (req, res) => {
            const status = await this.checkServiceStatus();
            res.json(status);
        });
    }
    
    async analyzeAndRoute(message, context) {
        // Simple keyword-based routing for now
        // In production, this would use the semantic API
        
        const keywords = {
            'dev-tools': ['code', 'optimize', 'debug', 'api', 'function', 'class', 'compile'],
            'games': ['game', 'play', 'score', 'level', 'character', 'multiplayer'],
            'ai-agents': ['agent', 'ai', 'automate', 'assistant', 'bot', 'claude'],
            'productivity': ['task', 'todo', 'schedule', 'team', 'project', 'deadline'],
            'creative': ['design', 'image', 'video', 'art', 'music', 'create'],
            'education': ['learn', 'course', 'lesson', 'quiz', 'teach', 'study']
        };
        
        const messageLower = message.toLowerCase();
        let bestMatch = { category: 'ai-agents', score: 0 };
        
        for (const [category, words] of Object.entries(keywords)) {
            const score = words.filter(word => messageLower.includes(word)).length;
            if (score > bestMatch.score) {
                bestMatch = { category, score };
            }
        }
        
        // Find domain info
        const domainInfo = Object.entries(this.domainMap).find(([_, info]) => 
            info.category === bestMatch.category
        );
        
        return {
            category: bestMatch.category,
            domain: domainInfo ? domainInfo[0] : 'soulfra.com',
            tier: domainInfo ? domainInfo[1].tier : 5,
            confidence: bestMatch.score > 0 ? 'high' : 'low',
            suggestedTools: domainInfo ? domainInfo[1].tools : []
        };
    }
    
    async getUserInstance(userId, category) {
        const instanceKey = `${userId}-${category}`;
        
        if (this.userInstances.has(instanceKey)) {
            return this.userInstances.get(instanceKey);
        }
        
        // Create new instance
        const instance = await this.spawnInstance(userId, category);
        return instance;
    }
    
    async spawnInstance(userId, category, tier) {
        const domainInfo = Object.values(this.domainMap).find(info => 
            info.category === category
        );
        
        const instance = {
            id: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            category,
            tier: tier || domainInfo?.tier || 3,
            status: 'active',
            createdAt: new Date().toISOString(),
            tools: domainInfo?.tools || [],
            resources: {
                cpu: '0.5 vCPU',
                memory: '512MB',
                storage: '1GB'
            }
        };
        
        const instanceKey = `${userId}-${category}`;
        this.userInstances.set(instanceKey, instance);
        
        // In production, this would actually spawn a container/process
        console.log(`Spawned instance ${instance.id} for user ${userId}`);
        
        return instance;
    }
    
    async routeToService(routing, instance, message) {
        // Determine which tool to use based on routing
        const tool = routing.suggestedTools[0] || 'chat-processor';
        const service = this.toolServices[tool];
        
        if (!service) {
            return {
                response: 'Tool not yet implemented',
                tool,
                fallback: true
            };
        }
        
        try {
            // In production, this would make actual HTTP request to service
            // For now, return mock response
            return {
                response: `Processed by ${tool} in ${routing.category}`,
                tool,
                service: `http://localhost:${service.port}${service.path}`,
                instanceId: instance.id
            };
        } catch (error) {
            console.error(`Service error for ${tool}:`, error);
            return {
                response: 'Service temporarily unavailable',
                tool,
                error: true
            };
        }
    }
    
    async checkServiceStatus() {
        const status = {};
        
        for (const [tool, service] of Object.entries(this.toolServices)) {
            try {
                // Check if service is running
                const response = await fetch(`http://localhost:${service.port}/health`)
                    .catch(() => ({ ok: false }));
                
                status[tool] = {
                    port: service.port,
                    status: response.ok ? 'online' : 'offline',
                    path: service.path
                };
            } catch (error) {
                status[tool] = {
                    port: service.port,
                    status: 'offline',
                    path: service.path
                };
            }
        }
        
        return status;
    }
    
    async start() {
        // Connect to Cal Drop Orchestrator if available
        try {
            const calDropPath = path.join(__dirname, 'cal-drop', 'CalDropOrchestrator.js');
            if (await fs.access(calDropPath).then(() => true).catch(() => false)) {
                console.log('Connecting to Cal Drop Orchestrator...');
                // Would import and connect here
            }
        } catch (error) {
            console.log('Cal Drop Orchestrator not found, running standalone');
        }
        
        this.app.listen(this.port, () => {
            console.log(`Domain-Category Router running on port ${this.port}`);
            console.log(`Dashboard: http://localhost:${this.port}`);
            console.log('\nCategories mapped:');
            Object.entries(this.domainMap).forEach(([domain, info]) => {
                console.log(`  ${domain} → ${info.category} (Tier ${info.tier})`);
            });
        });
    }
}

// Start the router
if (require.main === module) {
    const router = new DomainCategoryRouter();
    router.start();
}

module.exports = DomainCategoryRouter;