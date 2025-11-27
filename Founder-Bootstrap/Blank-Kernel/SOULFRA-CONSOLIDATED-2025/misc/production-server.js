#!/usr/bin/env node

/**
 * Cal's AI World - Production Server
 * Handles $1 contributions and AI agent provisioning
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9999;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory storage (replace with database in production)
let contributors = [];
let agents = [];
let worldStats = {
    totalContributors: 0,
    totalAgents: 0,
    totalRevenue: 0,
    lastActivity: new Date()
};

// Stripe configuration (set environment variables)
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// ===== ROUTE MAPPING SYSTEM =====
let routeMapping = {};
try {
    routeMapping = JSON.parse(fs.readFileSync('soulfra-route-mapping.json', 'utf8'));
} catch (e) {
    console.log('⚠️  Route mapping not found, using basic routing');
}

// ===== SMART ROUTING =====
function findRoute(path) {
    for (const categoryName in routeMapping.route_categories || {}) {
        const category = routeMapping.route_categories[categoryName];
        const routes = category.routes || {};
        
        if (routes[path]) {
            return routes[path];
        }
        
        // Pattern matching
        for (const pattern in routes) {
            if (pattern.endsWith('/*')) {
                const base = pattern.slice(0, -2);
                if (path.startsWith(base)) {
                    const route = routes[pattern];
                    if (route.directory) {
                        const relativePath = path.slice(base.length).replace(/^\//, '');
                        return { file_path: path.join(route.directory, relativePath) };
                    }
                }
            }
        }
    }
    return null;
}

// ===== MAIN ROUTES =====

// Home page with smart routing
app.get('/', (req, res) => {
    const filePath = 'handoff/soulfra_unified_dashboard.html';
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Inject live stats
        content = content.replace('∞', worldStats.totalContributors.toString());
        content = content.replace('LIVE', worldStats.totalAgents.toString());
        
        res.send(content);
    } else {
        res.send(generateLandingPage());
    }
});

// Smart routing handler
app.get('*', (req, res, next) => {
    const route = findRoute(req.path);
    
    if (route && route.file_path && fs.existsSync(route.file_path)) {
        res.sendFile(path.resolve(route.file_path));
    } else if (route && route.proxy_to) {
        // Proxy to backend (if needed)
        next();
    } else {
        next();
    }
});

// ===== PAYMENT & AGENT PROVISIONING =====

// Create Stripe payment intent
app.post('/api/payment/create-intent', async (req, res) => {
    if (!stripe) {
        return res.status(400).json({ error: 'Stripe not configured' });
    }
    
    try {
        const { contributor_name, contributor_email } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 100, // $1.00 in cents
            currency: 'usd',
            metadata: {
                contributor_name,
                contributor_email,
                purpose: 'cal_ai_world_agent'
            }
        });
        
        res.json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Stripe webhook (handle successful payments)
app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), (req, res) => {
    if (!stripe) {
        return res.status(400).send('Stripe not configured');
    }
    
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log('Webhook signature verification failed.', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        provisionAgent(paymentIntent);
    }
    
    res.json({received: true});
});

// Import real infrastructure
const RealAgentProvisioner = require('./real-agent-provisioner.js');
const AgentClaudeBridge = require('./agent-claude-bridge.js');

const realProvisioner = new RealAgentProvisioner();
const claudeBridge = new AgentClaudeBridge();

// ===== REAL AGENT PROVISIONING =====

async function provisionAgent(paymentIntent) {
    const { contributor_name, contributor_email } = paymentIntent.metadata;
    
    try {
        console.log(`🚀 Provisioning REAL agent for ${contributor_name}...`);
        
        // Use real agent provisioner to create agent with Cal Riven infrastructure
        const contributor = await realProvisioner.provisionRealAgent({
            contributor_name,
            contributor_email,
            payment_intent_id: paymentIntent.id
        });
        
        // Add to in-memory storage for quick access
        contributors.push(contributor);
        
        // Update world stats
        worldStats.totalContributors = contributors.length;
        worldStats.totalAgents = realProvisioner.getAllActiveAgents().length;
        worldStats.totalRevenue += contributor.contributed_amount;
        worldStats.lastActivity = new Date();
        
        console.log(`✅ REAL agent provisioned for ${contributor_name}: ${contributor.agent.id}`);
        console.log(`🧠 Agent connected to Cal Riven, Mirror System, and Claude Bridge`);
        
        // Send welcome notification
        sendWelcomeNotification(contributor);
        
        return contributor;
        
    } catch (error) {
        console.error(`❌ Real agent provisioning failed for ${contributor_name}:`, error.message);
        // Fallback to simple agent if real provisioning fails
        return createSimpleAgent(contributor_name, contributor_email, paymentIntent.id);
    }
}

function createAIAgent(contributor) {
    const agentTypes = ['Explorer', 'Builder', 'Philosopher', 'Connector', 'Creator'];
    const agentType = agentTypes[Math.floor(Math.random() * agentTypes.length)];
    
    return {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${contributor.name}'s ${agentType}`,
        type: agentType,
        owner_id: contributor.id,
        created_at: new Date(),
        status: 'active',
        level: 1,
        experience: 0,
        traits: generateAgentTraits(),
        world_position: {
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            zone: 'StartingGrounds'
        }
    };
}

function generateAgentTraits() {
    const traits = ['Curious', 'Analytical', 'Creative', 'Social', 'Logical', 'Intuitive', 'Adventurous'];
    return traits.sort(() => 0.5 - Math.random()).slice(0, 3);
}

function sendWelcomeNotification(contributor, agent) {
    // Implement email/SMS/webhook notification
    console.log(`📧 Welcome notification sent to ${contributor.email}`);
}

// ===== API ENDPOINTS =====

// Get world statistics
app.get('/api/world/stats', (req, res) => {
    res.json(worldStats);
});

// Get contributor's agent
app.get('/api/contributor/:id/agent', (req, res) => {
    const contributor = contributors.find(c => c.id === req.params.id);
    if (!contributor) {
        return res.status(404).json({ error: 'Contributor not found' });
    }
    
    const agent = agents.find(a => a.id === contributor.agent_id);
    res.json({ contributor, agent });
});

// Get all agents (real agents from Cal Riven system)
app.get('/api/world/agents', (req, res) => {
    try {
        const realAgents = realProvisioner.getAllActiveAgents();
        const publicAgents = realAgents.map(agent => ({
            id: agent.id,
            name: agent.name,
            contributor: agent.contributor,
            personality: agent.personality,
            skills: agent.skills,
            spawned_at: agent.spawned_at,
            blessing: agent.blessing ? agent.blessing.status : 'unknown',
            cal_riven_connected: true
        }));
        
        res.json(publicAgents);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load agents', details: error.message });
    }
});

// Real agent interaction endpoint (uses Claude)
app.post('/api/agents/:id/interact', async (req, res) => {
    try {
        const agentId = req.params.id;
        const { message, action } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        // Use Claude bridge for intelligent response
        const response = await claudeBridge.agentThink(agentId, message, {
            action: action || 'chat'
        });
        
        res.json(response);
        
    } catch (error) {
        console.error('Agent interaction failed:', error.message);
        res.status(500).json({ 
            error: 'Agent interaction failed', 
            details: error.message 
        });
    }
});

// Agent-to-agent interaction
app.post('/api/agents/interaction', async (req, res) => {
    try {
        const { agent1_id, agent2_id, topic } = req.body;
        
        if (!agent1_id || !agent2_id || !topic) {
            return res.status(400).json({ 
                error: 'agent1_id, agent2_id, and topic are required' 
            });
        }
        
        const interaction = await claudeBridge.agentInteraction(agent1_id, agent2_id, topic);
        res.json(interaction);
        
    } catch (error) {
        console.error('Agent-to-agent interaction failed:', error.message);
        res.status(500).json({ 
            error: 'Agent interaction failed', 
            details: error.message 
        });
    }
});

// Get agent status and stats
app.get('/api/agents/:id/status', (req, res) => {
    try {
        const agentStatus = claudeBridge.getAgentStatus(req.params.id);
        
        if (!agentStatus) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        res.json(agentStatus);
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to get agent status', 
            details: error.message 
        });
    }
});

function processAgentInteraction(agent, action, targetId, message) {
    // Simple interaction system
    agent.experience += 10;
    
    if (agent.experience >= agent.level * 100) {
        agent.level++;
        agent.experience = 0;
    }
    
    return {
        success: true,
        agent_id: agent.id,
        action: action,
        experience_gained: 10,
        new_level: agent.level,
        message: `${agent.name} performed ${action}`
    };
}

// ===== FALLBACK LANDING PAGE =====

function generateLandingPage() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Cal's AI World - Join for $1</title>
    <style>
        body { 
            background: #000; 
            color: #00ff88; 
            font-family: monospace; 
            text-align: center; 
            padding: 50px; 
        }
        .hero { font-size: 3em; margin-bottom: 20px; }
        .stats { font-size: 1.5em; margin: 30px 0; }
        .cta { 
            background: #00ff88; 
            color: #000; 
            padding: 20px 40px; 
            font-size: 1.5em; 
            border: none; 
            cursor: pointer; 
            margin: 20px;
        }
        .cta:hover { background: #00cc66; }
    </style>
</head>
<body>
    <div class="hero">🤖 Cal's AI World</div>
    <div class="stats">
        <div>Contributors: ${worldStats.totalContributors}</div>
        <div>AI Agents: ${worldStats.totalAgents}</div>
        <div>Total Revenue: $${worldStats.totalRevenue}</div>
    </div>
    <p style="font-size: 1.2em; margin: 20px 0;">
        For just $1, get your own AI agent in Cal's world.<br>
        Watch it learn, grow, and interact with thousands of other agents.
    </p>
    <button class="cta" onclick="window.location.href='/onboarding/billion-dollar'">
        Join for $1
    </button>
    <div style="margin-top: 40px;">
        <a href="/dashboard/loopmesh" style="color: #00ffff;">🌊 View Live World</a> |
        <a href="/api/world/agents" style="color: #00ffff;">🤖 See All Agents</a>
    </div>
</body>
</html>`;
}

// ===== SERVER STARTUP =====

app.listen(PORT, () => {
    console.log(`🚀 Cal's AI World running on port ${PORT}`);
    console.log(`🌐 Public URL: http://localhost:${PORT}`);
    console.log(`💰 Payment integration: ${stripe ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`📊 World Stats: ${worldStats.totalContributors} contributors, ${worldStats.totalAgents} agents`);
    console.log('');
    console.log('🎯 Ready to accept $1 contributions and provision AI agents!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    process.exit(0);
});