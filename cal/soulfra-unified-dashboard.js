// SOULFRA UNIFIED DASHBOARD
// Central control for all platforms and services

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PlatformLauncher, ModuleSystem } = require('./platform-modules');

class SoulfraDashboard {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, { 
            cors: { origin: "*" },
            transports: ['websocket', 'polling']
        });
        
        // Core systems
        this.platformLauncher = new PlatformLauncher();
        this.moduleSystem = new ModuleSystem();
        
        // Global state
        this.state = {
            platforms: new Map(),
            users: new Map(),
            metrics: {
                totalRequests: 0,
                totalCost: 0,
                activeUsers: 0,
                trustDistribution: { basic: 0, standard: 0, premium: 0 }
            },
            systemHealth: {
                cpu: 0,
                memory: 0,
                uptime: Date.now()
            }
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupMetricsCollection();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }
    
    setupRoutes() {
        // Dashboard API
        this.app.get('/api/dashboard/overview', (req, res) => {
            res.json({
                platforms: Array.from(this.state.platforms.values()),
                metrics: this.state.metrics,
                health: this.state.systemHealth,
                modules: this.moduleSystem.list()
            });
        });
        
        // Platform management
        this.app.post('/api/platforms/launch', async (req, res) => {
            try {
                const { type, config } = req.body;
                
                // Inject shared services
                config.trustEngine = this.getTrustEngine();
                config.router = this.getInfinityRouter();
                config.dashboard = this;
                
                const platform = await this.platformLauncher.launch(type, config);
                
                // Track in state
                this.state.platforms.set(platform.id, {
                    ...platform,
                    status: 'running',
                    launched: new Date(),
                    requests: 0,
                    errors: 0
                });
                
                // Notify all connected clients
                this.io.emit('platform:launched', platform);
                
                res.json(platform);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.delete('/api/platforms/:id', async (req, res) => {
            const id = parseInt(req.params.id);
            const success = await this.platformLauncher.stop(id);
            
            if (success) {
                this.state.platforms.delete(id);
                this.io.emit('platform:stopped', { id });
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Platform not found' });
            }
        });
        
        // Module management
        this.app.get('/api/modules', (req, res) => {
            const modules = this.moduleSystem.list().map(name => {
                const module = this.moduleSystem.modules.get(name);
                return {
                    name,
                    description: module?.description || 'No description',
                    enabled: true
                };
            });
            res.json(modules);
        });
        
        this.app.post('/api/modules/:name/enable', async (req, res) => {
            try {
                await this.moduleSystem.load(req.params.name);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Trust management
        this.app.get('/api/trust/:userId', (req, res) => {
            const trust = this.getTrustEngine().getScore(req.params.userId);
            res.json({ userId: req.params.userId, trust });
        });
        
        this.app.post('/api/trust/:userId/update', (req, res) => {
            const { delta } = req.body;
            const newScore = this.getTrustEngine().updateScore(req.params.userId, delta);
            res.json({ userId: req.params.userId, trust: newScore });
        });
        
        // Serve the dashboard UI
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
    }
    
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log('Dashboard client connected:', socket.id);
            
            // Send initial state
            socket.emit('state:initial', {
                platforms: Array.from(this.state.platforms.values()),
                metrics: this.state.metrics,
                health: this.state.systemHealth
            });
            
            // Platform control
            socket.on('platform:launch', async (data) => {
                try {
                    const platform = await this.platformLauncher.launch(data.type, data.config);
                    socket.emit('platform:launch:success', platform);
                } catch (error) {
                    socket.emit('platform:launch:error', { error: error.message });
                }
            });
            
            socket.on('platform:stop', async (platformId) => {
                await this.platformLauncher.stop(platformId);
            });
            
            // Real-time metrics subscription
            socket.on('metrics:subscribe', () => {
                const interval = setInterval(() => {
                    socket.emit('metrics:update', this.state.metrics);
                }, 1000);
                
                socket.on('disconnect', () => clearInterval(interval));
            });
        });
    }
    
    setupMetricsCollection() {
        // Collect system metrics every second
        setInterval(() => {
            // Simulate metrics (in production, use actual system stats)
            this.state.systemHealth = {
                cpu: Math.random() * 100,
                memory: Math.random() * 100,
                uptime: Date.now() - this.state.systemHealth.uptime
            };
            
            // Broadcast to all clients
            this.io.emit('health:update', this.state.systemHealth);
        }, 1000);
    }
    
    // Shared services
    getTrustEngine() {
        if (!this.trustEngine) {
            this.trustEngine = {
                users: new Map(),
                getScore: (userId) => {
                    const user = this.trustEngine.users.get(userId);
                    return user?.trust || 50;
                },
                updateScore: (userId, delta) => {
                    const current = this.trustEngine.getScore(userId);
                    const newScore = Math.max(0, Math.min(100, current + delta));
                    this.trustEngine.users.set(userId, { 
                        trust: newScore, 
                        updated: new Date() 
                    });
                    
                    // Update distribution
                    this.updateTrustDistribution();
                    
                    return newScore;
                }
            };
        }
        return this.trustEngine;
    }
    
    getInfinityRouter() {
        if (!this.infinityRouter) {
            this.infinityRouter = {
                route: (prompt, trustScore) => {
                    this.state.metrics.totalRequests++;
                    
                    const tier = trustScore >= 70 ? 'premium' : 
                                trustScore >= 50 ? 'standard' : 'basic';
                    
                    const costs = { premium: 0.08, standard: 0.02, basic: 0 };
                    const cost = costs[tier];
                    this.state.metrics.totalCost += cost;
                    
                    // Simulated responses
                    const responses = {
                        premium: `[Premium AI] Advanced analysis: "${prompt}"`,
                        standard: `[Standard AI] Response: "${prompt}"`,
                        basic: `[Basic AI] Simple answer: "${prompt}"`
                    };
                    
                    return {
                        response: responses[tier],
                        tier,
                        trustScore,
                        cost
                    };
                }
            };
        }
        return this.infinityRouter;
    }
    
    updateTrustDistribution() {
        let basic = 0, standard = 0, premium = 0;
        
        this.getTrustEngine().users.forEach(user => {
            if (user.trust >= 70) premium++;
            else if (user.trust >= 50) standard++;
            else basic++;
        });
        
        this.state.metrics.trustDistribution = { basic, standard, premium };
        this.state.metrics.activeUsers = this.getTrustEngine().users.size;
    }
    
    // Track platform metrics
    trackPlatformMetric(platformId, metric, value = 1) {
        const platform = this.state.platforms.get(platformId);
        if (platform) {
            platform[metric] = (platform[metric] || 0) + value;
            this.io.emit('platform:metrics', { platformId, metric, value });
        }
    }
    
    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Dashboard</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #0a0a0a;
            color: #fff;
            min-height: 100vh;
        }
        
        .dashboard {
            display: grid;
            grid-template-columns: 250px 1fr;
            min-height: 100vh;
        }
        
        /* Sidebar */
        .sidebar {
            background: #111;
            border-right: 1px solid #222;
            padding: 2rem 1rem;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .nav-item {
            display: block;
            padding: 0.75rem 1rem;
            margin: 0.25rem 0;
            border-radius: 8px;
            color: #888;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
        }
        
        .nav-item:hover {
            background: #222;
            color: #fff;
        }
        
        .nav-item.active {
            background: #667eea;
            color: #fff;
        }
        
        /* Main content */
        .main {
            padding: 2rem;
            overflow-y: auto;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        
        h1 {
            font-size: 2rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #222 100%);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid #333;
        }
        
        .stat-label {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
        }
        
        .stat-change {
            font-size: 0.8rem;
            margin-top: 0.5rem;
        }
        
        .positive { color: #10b981; }
        .negative { color: #ef4444; }
        
        /* Platforms grid */
        .platforms-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .platform-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 1.5rem;
            position: relative;
            transition: all 0.3s;
        }
        
        .platform-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
        }
        
        .platform-status {
            position: absolute;
            top: 1rem;
            right: 1rem;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
        }
        
        .platform-status.error {
            background: #ef4444;
        }
        
        /* Charts */
        .chart-container {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            height: 300px;
        }
        
        /* Launch modal */
        .modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: #888;
            font-size: 1.5rem;
            cursor: pointer;
        }
        
        .platform-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .platform-option {
            background: #222;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .platform-option:hover {
            border-color: #667eea;
            transform: scale(1.05);
        }
        
        .platform-option.selected {
            border-color: #667eea;
            background: rgba(102, 126, 234, 0.1);
        }
        
        .platform-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        /* Buttons */
        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: scale(1.05);
        }
        
        .btn-secondary {
            background: #222;
            color: #fff;
            border: 1px solid #333;
        }
        
        /* Real-time indicator */
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid #10b981;
            border-radius: 100px;
            font-size: 0.8rem;
            color: #10b981;
        }
        
        .live-dot {
            width: 6px;
            height: 6px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* Modules section */
        .modules-list {
            display: grid;
            gap: 1rem;
        }
        
        .module-item {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .toggle {
            position: relative;
            width: 50px;
            height: 25px;
            background: #333;
            border-radius: 25px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .toggle.active {
            background: #667eea;
        }
        
        .toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 21px;
            height: 21px;
            background: white;
            border-radius: 50%;
            transition: transform 0.3s;
        }
        
        .toggle.active::after {
            transform: translateX(25px);
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <div class="logo">SOULFRA</div>
            <nav>
                <a class="nav-item active" data-view="overview">Overview</a>
                <a class="nav-item" data-view="platforms">Platforms</a>
                <a class="nav-item" data-view="trust">Trust Engine</a>
                <a class="nav-item" data-view="modules">Modules</a>
                <a class="nav-item" data-view="analytics">Analytics</a>
            </nav>
        </aside>
        
        <main class="main">
            <div class="header">
                <h1 id="viewTitle">Overview</h1>
                <div class="live-indicator">
                    <div class="live-dot"></div>
                    Live
                </div>
            </div>
            
            <div id="content">
                <!-- Overview -->
                <div id="overview" class="view active">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Total Requests</div>
                            <div class="stat-value" id="totalRequests">0</div>
                            <div class="stat-change positive">+12% from last hour</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">Active Users</div>
                            <div class="stat-value" id="activeUsers">0</div>
                            <div class="stat-change positive">+5 new today</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">Running Platforms</div>
                            <div class="stat-value" id="platformCount">0</div>
                            <div class="stat-change">Healthy</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-label">Total Cost</div>
                            <div class="stat-value">$<span id="totalCost">0.00</span></div>
                            <div class="stat-change positive">Optimized</div>
                        </div>
                    </div>
                    
                    <div class="chart-container">
                        <canvas id="requestsChart"></canvas>
                    </div>
                    
                    <h2 style="margin-bottom: 1rem;">Active Platforms</h2>
                    <div class="platforms-grid" id="platformsGrid">
                        <!-- Platforms will be added here -->
                    </div>
                </div>
                
                <!-- Platforms View -->
                <div id="platforms" class="view" style="display: none;">
                    <button class="btn btn-primary" onclick="showLaunchModal()">
                        + Launch New Platform
                    </button>
                    
                    <div class="platforms-grid" id="allPlatformsGrid" style="margin-top: 2rem;">
                        <!-- All platforms listed here -->
                    </div>
                </div>
                
                <!-- Trust Engine View -->
                <div id="trust" class="view" style="display: none;">
                    <div class="chart-container">
                        <canvas id="trustChart"></canvas>
                    </div>
                    
                    <h2 style="margin: 2rem 0 1rem;">Trust Distribution</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-label">Basic Tier</div>
                            <div class="stat-value" id="basicCount">0</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Standard Tier</div>
                            <div class="stat-value" id="standardCount">0</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-label">Premium Tier</div>
                            <div class="stat-value" id="premiumCount">0</div>
                        </div>
                    </div>
                </div>
                
                <!-- Modules View -->
                <div id="modules" class="view" style="display: none;">
                    <div class="modules-list" id="modulesList">
                        <!-- Modules will be listed here -->
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- Launch Platform Modal -->
    <div class="modal" id="launchModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Launch New Platform</h2>
                <button class="close-btn" onclick="closeLaunchModal()">&times;</button>
            </div>
            
            <div class="platform-options">
                <div class="platform-option" data-type="chatbot">
                    <div class="platform-icon">💬</div>
                    <h3>Chatbot</h3>
                    <p>AI Assistant</p>
                </div>
                
                <div class="platform-option" data-type="api">
                    <div class="platform-icon">🔌</div>
                    <h3>API Gateway</h3>
                    <p>Developer API</p>
                </div>
                
                <div class="platform-option" data-type="marketplace">
                    <div class="platform-icon">🏪</div>
                    <h3>Marketplace</h3>
                    <p>Agent Store</p>
                </div>
                
                <div class="platform-option" data-type="custom">
                    <div class="platform-icon">✨</div>
                    <h3>Custom</h3>
                    <p>Build Your Own</p>
                </div>
            </div>
            
            <input type="text" id="platformName" placeholder="Platform name..." 
                   style="width: 100%; padding: 0.75rem; background: #222; border: 1px solid #333; 
                          border-radius: 8px; color: white; margin-bottom: 1rem;">
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeLaunchModal()">Cancel</button>
                <button class="btn btn-primary" onclick="launchPlatform()">Launch</button>
            </div>
        </div>
    </div>
    
    <script>
        const socket = io();
        let selectedPlatformType = null;
        let charts = {};
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                showView(view);
                
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        function showView(view) {
            document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
            document.getElementById(view).style.display = 'block';
            document.getElementById('viewTitle').textContent = 
                view.charAt(0).toUpperCase() + view.slice(1);
                
            // Initialize view-specific content
            if (view === 'analytics' && !charts.requests) {
                initCharts();
            }
        }
        
        // Socket listeners
        socket.on('state:initial', (state) => {
            updateMetrics(state.metrics);
            updatePlatforms(state.platforms);
        });
        
        socket.on('metrics:update', (metrics) => {
            updateMetrics(metrics);
            updateCharts();
        });
        
        socket.on('platform:launched', (platform) => {
            addPlatformCard(platform);
        });
        
        socket.on('platform:stopped', (data) => {
            removePlatformCard(data.id);
        });
        
        // Update UI functions
        function updateMetrics(metrics) {
            document.getElementById('totalRequests').textContent = metrics.totalRequests;
            document.getElementById('activeUsers').textContent = metrics.activeUsers;
            document.getElementById('totalCost').textContent = metrics.totalCost.toFixed(2);
            
            const dist = metrics.trustDistribution;
            document.getElementById('basicCount').textContent = dist.basic;
            document.getElementById('standardCount').textContent = dist.standard;
            document.getElementById('premiumCount').textContent = dist.premium;
        }
        
        function updatePlatforms(platforms) {
            const grid = document.getElementById('platformsGrid');
            const allGrid = document.getElementById('allPlatformsGrid');
            
            grid.innerHTML = '';
            allGrid.innerHTML = '';
            
            document.getElementById('platformCount').textContent = platforms.length;
            
            platforms.forEach(platform => {
                addPlatformCard(platform);
            });
        }
        
        function addPlatformCard(platform) {
            const card = document.createElement('div');
            card.className = 'platform-card';
            card.id = 'platform-' + platform.id;
            
            card.innerHTML = \`
                <div class="platform-status"></div>
                <h3>\${platform.name || platform.type}</h3>
                <p style="color: #888; margin: 0.5rem 0;">Port: \${platform.port}</p>
                <div style="margin: 1rem 0;">
                    <div style="color: #888; font-size: 0.9rem;">Requests: <span id="reqs-\${platform.id}">0</span></div>
                    <div style="color: #888; font-size: 0.9rem;">Errors: <span id="errs-\${platform.id}">0</span></div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary" onclick="window.open('\${platform.url}')">Open</button>
                    <button class="btn btn-secondary" onclick="stopPlatform(\${platform.id})">Stop</button>
                </div>
            \`;
            
            document.getElementById('platformsGrid').appendChild(card);
            document.getElementById('allPlatformsGrid').appendChild(card.cloneNode(true));
        }
        
        function removePlatformCard(id) {
            const card = document.getElementById('platform-' + id);
            if (card) card.remove();
            
            // Update count
            const currentCount = parseInt(document.getElementById('platformCount').textContent);
            document.getElementById('platformCount').textContent = currentCount - 1;
        }
        
        // Platform management
        function showLaunchModal() {
            document.getElementById('launchModal').classList.add('active');
        }
        
        function closeLaunchModal() {
            document.getElementById('launchModal').classList.remove('active');
            selectedPlatformType = null;
            document.querySelectorAll('.platform-option').forEach(opt => {
                opt.classList.remove('selected');
            });
        }
        
        document.querySelectorAll('.platform-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.platform-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                selectedPlatformType = option.dataset.type;
            });
        });
        
        function launchPlatform() {
            if (!selectedPlatformType) {
                alert('Please select a platform type');
                return;
            }
            
            const name = document.getElementById('platformName').value || selectedPlatformType;
            
            socket.emit('platform:launch', {
                type: selectedPlatformType,
                config: { name }
            });
            
            closeLaunchModal();
        }
        
        function stopPlatform(id) {
            if (confirm('Stop this platform?')) {
                socket.emit('platform:stop', id);
            }
        }
        
        // Charts
        function initCharts() {
            // Requests chart
            const ctx = document.getElementById('requestsChart').getContext('2d');
            charts.requests = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: Array(20).fill(''),
                    datasets: [{
                        label: 'Requests',
                        data: Array(20).fill(0),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#333' } },
                        x: { grid: { color: '#333' } }
                    }
                }
            });
            
            // Trust distribution chart
            const trustCtx = document.getElementById('trustChart').getContext('2d');
            charts.trust = new Chart(trustCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Basic', 'Standard', 'Premium'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: ['#CD7F32', '#C0C0C0', '#FFD700']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        function updateCharts() {
            if (charts.requests) {
                // Update requests chart with new data point
                const data = charts.requests.data.datasets[0].data;
                data.push(Math.floor(Math.random() * 100)); // Replace with real data
                data.shift();
                charts.requests.update();
            }
        }
        
        // Subscribe to real-time updates
        socket.emit('metrics:subscribe');
        
        // Load modules
        fetch('/api/modules')
            .then(r => r.json())
            .then(modules => {
                const list = document.getElementById('modulesList');
                modules.forEach(module => {
                    const item = document.createElement('div');
                    item.className = 'module-item';
                    item.innerHTML = \`
                        <div>
                            <h3>\${module.name}</h3>
                            <p style="color: #888; margin-top: 0.25rem;">\${module.description}</p>
                        </div>
                        <div class="toggle \${module.enabled ? 'active' : ''}" 
                             onclick="toggleModule('\${module.name}', this)"></div>
                    \`;
                    list.appendChild(item);
                });
            });
        
        function toggleModule(name, toggle) {
            toggle.classList.toggle('active');
            fetch(\`/api/modules/\${name}/enable\`, { method: 'POST' });
        }
    </script>
</body>
</html>
        `;
    }
    
    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`✨ Soulfra Dashboard running on http://localhost:${port}`);
        });
    }
}

// Export for use in other modules
module.exports = SoulfraDashboard;

// Run if called directly
if (require.main === module) {
    const dashboard = new SoulfraDashboard();
    dashboard.start();
}
