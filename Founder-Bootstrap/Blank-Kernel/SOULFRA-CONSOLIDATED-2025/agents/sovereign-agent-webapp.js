/**
 * Sovereign Agent Web App Layer
 * 
 * This is the web application layer that manages your self-owning agents
 * across approved marketplaces. It provides the interface for deploying,
 * monitoring, and managing agents on your approved sites.
 */

const express = require('express');
const SovereignMarketplaceBackend = require('../vault/sovereign-marketplace-backend');
const { AgentWorkshopPlatform } = require('../platforms/growth/mirror-diffusion/templates/agent-workshop-platform');
const { SovereignInfinityRouter } = require('../infinity-router-sovereign');

class SovereignAgentWebApp {
    constructor(port = 4040) {
        this.app = express();
        this.port = port;
        
        // Initialize backend systems
        this.marketplaceBackend = new SovereignMarketplaceBackend();
        this.agentPlatform = new AgentWorkshopPlatform();
        this.sovereignRouter = new SovereignInfinityRouter();
        
        // Web app state
        this.sessions = new Map();
        this.agentInstances = new Map();
        
        // Setup middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS for approved marketplaces only
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            const approvedOrigins = Array.from(this.marketplaceBackend.approvedMarketplaces.values())
                .map(m => `https://${m.domain}`);
            
            if (approvedOrigins.includes(origin) || origin?.includes('localhost')) {
                res.header('Access-Control-Allow-Origin', origin);
                res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            }
            
            next();
        });
        
        // Authentication middleware
        this.app.use(async (req, res, next) => {
            const token = req.headers.authorization?.split(' ')[1];
            if (token && req.path !== '/auth/login') {
                req.session = await this.validateSession(token);
            }
            next();
        });
    }
    
    setupRoutes() {
        // Authentication routes
        this.app.post('/auth/login', this.handleLogin.bind(this));
        this.app.post('/auth/logout', this.handleLogout.bind(this));
        
        // Marketplace management routes
        this.app.get('/marketplaces', this.getMarketplaces.bind(this));
        this.app.post('/marketplaces/approve', this.approveMarketplace.bind(this));
        this.app.post('/marketplaces/request', this.requestMarketplace.bind(this));
        this.app.delete('/marketplaces/:id', this.revokeMarketplace.bind(this));
        this.app.get('/marketplaces/:id/dashboard', this.getMarketplaceDashboard.bind(this));
        
        // Agent management routes
        this.app.get('/agents', this.getAgents.bind(this));
        this.app.post('/agents/create', this.createAgent.bind(this));
        this.app.post('/agents/:id/deploy', this.deployAgent.bind(this));
        this.app.get('/agents/:id/status', this.getAgentStatus.bind(this));
        this.app.get('/agents/:id/wealth', this.getAgentWealth.bind(this));
        
        // Revenue and monitoring routes
        this.app.get('/revenue/overview', this.getRevenueOverview.bind(this));
        this.app.post('/revenue/process', this.processRevenue.bind(this));
        this.app.get('/monitoring/health', this.getSystemHealth.bind(this));
        
        // Admin panel route
        this.app.get('/admin', this.serveAdminPanel.bind(this));
    }
    
    // Authentication handlers
    async handleLogin(req, res) {
        try {
            const { qrCode, biometricToken } = req.body;
            
            // Process sovereign pairing
            const sovereign = await this.sovereignRouter.processSovereignPairing(qrCode, {
                biometricToken: biometricToken,
                userTier: 'platform_owner'
            });
            
            // Create session
            const session = {
                id: this.generateSessionId(),
                userId: sovereign.sovereignty.userId,
                sovereign: sovereign,
                created: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            
            this.sessions.set(session.id, session);
            
            res.json({
                success: true,
                token: session.id,
                userId: session.userId,
                sovereignty: sovereign.sovereignty
            });
            
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Authentication failed',
                error: error.message
            });
        }
    }
    
    async handleLogout(req, res) {
        if (req.session) {
            this.sessions.delete(req.session.id);
        }
        res.json({ success: true });
    }
    
    // Marketplace management
    async getMarketplaces(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const marketplaces = Array.from(this.marketplaceBackend.approvedMarketplaces.values());
        const pending = Array.from(this.marketplaceBackend.pendingApprovals.values());
        
        res.json({
            approved: marketplaces,
            pending: pending,
            blacklisted: Array.from(this.marketplaceBackend.blacklistedDomains)
        });
    }
    
    async approveMarketplace(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        try {
            const marketplace = await this.marketplaceBackend.approveMarketplace(req.body);
            res.json({
                success: true,
                marketplace: marketplace
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async requestMarketplace(req, res) {
        // External sites can request approval without auth
        try {
            const result = await this.marketplaceBackend.requestMarketplaceApproval(req.body);
            res.json({
                success: true,
                result: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async revokeMarketplace(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        try {
            const result = await this.marketplaceBackend.revokeMarketplaceApproval(
                req.params.id,
                req.body.reason || 'Admin revoked'
            );
            res.json({
                success: true,
                result: result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async getMarketplaceDashboard(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        try {
            const dashboard = await this.marketplaceBackend.getMarketplaceDashboard(req.params.id);
            res.json({
                success: true,
                dashboard: dashboard
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // Agent management
    async getAgents(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const userAgents = Array.from(this.agentInstances.values())
            .filter(agent => agent.creator === req.session.userId);
        
        res.json({
            agents: userAgents,
            total: userAgents.length
        });
    }
    
    async createAgent(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        try {
            // Initialize agent platform if needed
            if (!this.agentPlatform.users.has(req.session.userId)) {
                await this.agentPlatform.registerUser({
                    id: req.session.userId,
                    name: req.body.creatorName || 'Platform Owner',
                    email: req.body.creatorEmail || 'owner@platform.local'
                });
            }
            
            // Create custom agent
            const agentResult = await this.agentPlatform.createCustomAgent(
                req.session.userId,
                req.body.customization
            );
            
            // Store agent instance
            this.agentInstances.set(agentResult.agent.id, {
                ...agentResult.agent,
                creator: req.session.userId,
                created: Date.now()
            });
            
            res.json({
                success: true,
                agent: agentResult.agent,
                ownership: agentResult.ownership,
                economy: agentResult.economy
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async deployAgent(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const agentId = req.params.id;
        const { marketplaceId, config } = req.body;
        
        try {
            // Verify agent ownership
            const agent = this.agentInstances.get(agentId);
            if (!agent || agent.creator !== req.session.userId) {
                throw new Error('Agent not found or unauthorized');
            }
            
            // Deploy to marketplace
            const deployment = await this.marketplaceBackend.deployAgentToMarketplace(
                agentId,
                marketplaceId,
                config
            );
            
            res.json({
                success: true,
                deployment: deployment
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async getAgentStatus(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const agentId = req.params.id;
        const agent = this.agentInstances.get(agentId);
        
        if (!agent || agent.creator !== req.session.userId) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }
        
        // Get deployment status across marketplaces
        const deployments = Array.from(this.marketplaceBackend.deployedAgents.values())
            .filter(d => d.agent_id === agentId);
        
        res.json({
            success: true,
            agent: {
                id: agent.id,
                name: agent.name,
                status: agent.state.active ? 'active' : 'inactive',
                created: agent.created
            },
            deployments: deployments,
            marketplaces: deployments.map(d => d.marketplace_id)
        });
    }
    
    async getAgentWealth(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const agentId = req.params.id;
        const agent = this.agentPlatform.agents.get(agentId);
        
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }
        
        // Get wealth report from revenue model
        const wealthReport = await this.agentPlatform.revenueModel.getAgentWealthReport(agentId);
        
        res.json({
            success: true,
            wealth: wealthReport
        });
    }
    
    // Revenue management
    async getRevenueOverview(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const platformStats = this.marketplaceBackend.platformVault;
        const marketplaceRevenue = new Map();
        
        // Aggregate revenue by marketplace
        this.marketplaceBackend.revenueStreams.forEach((transactions, marketplaceId) => {
            const total = transactions.reduce((sum, tx) => sum + tx.splits.marketplace, 0);
            marketplaceRevenue.set(marketplaceId, total);
        });
        
        res.json({
            platform: {
                balance: platformStats.balance,
                transactions: platformStats.transactions.length
            },
            marketplaces: Array.from(marketplaceRevenue.entries()).map(([id, revenue]) => ({
                marketplace_id: id,
                total_revenue: revenue
            })),
            total_revenue: platformStats.balance + Array.from(marketplaceRevenue.values()).reduce((a, b) => a + b, 0)
        });
    }
    
    async processRevenue(req, res) {
        // This would be called by marketplaces to process transactions
        const apiKey = req.headers['x-api-key'];
        
        // Validate API key
        const marketplace = Array.from(this.marketplaceBackend.approvedMarketplaces.values())
            .find(m => m.apiKey === apiKey);
        
        if (!marketplace) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }
        
        try {
            const transaction = await this.marketplaceBackend.processMarketplaceRevenue({
                marketplace_id: marketplace.id,
                ...req.body
            });
            
            res.json({
                success: true,
                transaction: transaction
            });
            
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }
    
    // System monitoring
    async getSystemHealth(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const health = {
            status: 'healthy',
            timestamp: Date.now(),
            components: {
                marketplaces: {
                    total: this.marketplaceBackend.approvedMarketplaces.size,
                    active: Array.from(this.marketplaceBackend.approvedMarketplaces.values())
                        .filter(m => m.metrics.activeAgents > 0).length
                },
                agents: {
                    total: this.agentInstances.size,
                    deployed: this.marketplaceBackend.deployedAgents.size
                },
                revenue: {
                    platform_vault: this.marketplaceBackend.platformVault.balance,
                    transactions_today: this.marketplaceBackend.platformVault.transactions
                        .filter(tx => tx.timestamp > Date.now() - 86400000).length
                },
                sessions: {
                    active: this.sessions.size
                }
            }
        };
        
        res.json(health);
    }
    
    // Admin panel
    async serveAdminPanel(req, res) {
        if (!this.requireAuth(req, res)) return;
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Sovereign Agent Admin Panel</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #007bff;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 40px;
        }
        .marketplace-list {
            display: grid;
            gap: 15px;
        }
        .marketplace-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .button:hover {
            background: #0056b3;
        }
        .button.danger {
            background: #dc3545;
        }
        .button.danger:hover {
            background: #c82333;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 Sovereign Agent Control Panel</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value" id="total-agents">0</div>
                <div class="stat-label">Total Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="active-marketplaces">0</div>
                <div class="stat-label">Active Marketplaces</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="total-revenue">$0</div>
                <div class="stat-label">Platform Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="deployments">0</div>
                <div class="stat-label">Active Deployments</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Approved Marketplaces</h2>
            <div id="marketplace-list" class="marketplace-list">
                Loading...
            </div>
        </div>
        
        <div class="section">
            <h2>Quick Actions</h2>
            <button class="button" onclick="createAgent()">Create New Agent</button>
            <button class="button" onclick="approveMarketplace()">Approve Marketplace</button>
            <button class="button" onclick="viewRevenue()">View Revenue Details</button>
        </div>
    </div>
    
    <script>
        async function loadDashboard() {
            try {
                // Load system health
                const healthRes = await fetch('/monitoring/health', {
                    headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') }
                });
                const health = await healthRes.json();
                
                document.getElementById('total-agents').textContent = health.components.agents.total;
                document.getElementById('active-marketplaces').textContent = health.components.marketplaces.active;
                document.getElementById('total-revenue').textContent = '$' + health.components.revenue.platform_vault.toFixed(2);
                document.getElementById('deployments').textContent = health.components.agents.deployed;
                
                // Load marketplaces
                const marketplacesRes = await fetch('/marketplaces', {
                    headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') }
                });
                const marketplaces = await marketplacesRes.json();
                
                const marketplaceHtml = marketplaces.approved.map(m => \`
                    <div class="marketplace-item">
                        <div>
                            <strong>\${m.name}</strong><br>
                            <small>\${m.domain} - \${m.tier} tier</small>
                        </div>
                        <div>
                            <button class="button" onclick="viewMarketplace('\${m.id}')">View</button>
                            <button class="button danger" onclick="revokeMarketplace('\${m.id}')">Revoke</button>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('marketplace-list').innerHTML = marketplaceHtml;
                
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }
        
        function createAgent() {
            // Implement agent creation UI
            alert('Agent creation UI coming soon!');
        }
        
        function approveMarketplace() {
            // Implement marketplace approval UI
            alert('Marketplace approval UI coming soon!');
        }
        
        function viewRevenue() {
            // Implement revenue details UI
            window.location.href = '/revenue/overview';
        }
        
        function viewMarketplace(id) {
            window.location.href = '/marketplaces/' + id + '/dashboard';
        }
        
        async function revokeMarketplace(id) {
            if (confirm('Are you sure you want to revoke this marketplace?')) {
                await fetch('/marketplaces/' + id, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') }
                });
                loadDashboard();
            }
        }
        
        // Load dashboard on page load
        loadDashboard();
        
        // Refresh every 30 seconds
        setInterval(loadDashboard, 30000);
    </script>
</body>
</html>
        `;
        
        res.send(html);
    }
    
    // Utility methods
    requireAuth(req, res) {
        if (!req.session || req.session.expires < Date.now()) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return false;
        }
        return true;
    }
    
    async validateSession(token) {
        const session = this.sessions.get(token);
        if (session && session.expires > Date.now()) {
            return session;
        }
        return null;
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Start the web app
    async start() {
        await this.agentPlatform.initialize();
        await this.sovereignRouter.initialize('webapp-master');
        
        this.app.listen(this.port, () => {
            console.log(`🌐 Sovereign Agent Web App running on port ${this.port}`);
            console.log(`📊 Admin panel: http://localhost:${this.port}/admin`);
            console.log(`\nApproved marketplaces:`);
            this.marketplaceBackend.approvedMarketplaces.forEach(m => {
                console.log(`  - ${m.name} (${m.domain})`);
            });
        });
    }
}

// Export and start if run directly
module.exports = SovereignAgentWebApp;

if (require.main === module) {
    const webapp = new SovereignAgentWebApp();
    webapp.start();
}