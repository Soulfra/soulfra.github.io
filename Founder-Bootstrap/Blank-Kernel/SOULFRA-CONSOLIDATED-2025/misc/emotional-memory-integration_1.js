#!/usr/bin/env node

/**
 * 🧠 Emotional Memory Integration
 * 
 * Integrates the emotional memory engine with existing VibeGraph module
 * Extends MirrorOS to display live emotional data from semantic API
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class EmotionalMemoryIntegration {
    constructor() {
        this.identity = {
            name: 'Emotional Memory Integration',
            emoji: '🧠',
            role: 'Memory Bridge'
        };
        
        // Integration paths
        this.paths = {
            vibeGraphClient: this.findVibeGraphClient(),
            vibeGraphServer: this.findVibeGraphServer(),
            mirrorOSServer: this.findMirrorOSServer()
        };
        
        // Semantic API configuration
        this.semanticAPI = {
            baseURL: 'http://localhost:3666',
            endpoints: {
                emotions: '/api/emotions/timeline',
                agents: '/api/agents/list',
                agentEmotions: '/api/agents/:agentId/emotions',
                systemHealth: '/api/system/health',
                graphNodes: '/api/graph/nodes',
                graphEdges: '/api/graph/edges'
            }
        };
        
        this.integrationComplete = false;
    }
    
    findVibeGraphClient() {
        const possiblePaths = [
            path.resolve(__dirname, '../mirror-os-demo/modules/vibegraph/vibegraph-client.html'),
            path.resolve(__dirname, 'mirror-os-demo/modules/vibegraph/vibegraph-client.html'),
            path.resolve(__dirname, '../../mirror-os-demo/modules/vibegraph/vibegraph-client.html')
        ];
        
        for (const p of possiblePaths) {
            if (require('fs').existsSync(p)) return p;
        }
        return null;
    }
    
    findVibeGraphServer() {
        const possiblePaths = [
            path.resolve(__dirname, '../mirror-os-demo/modules/vibegraph/vibegraph-server.js'),
            path.resolve(__dirname, 'mirror-os-demo/modules/vibegraph/vibegraph-server.js'),
            path.resolve(__dirname, '../../mirror-os-demo/modules/vibegraph/vibegraph-server.js')
        ];
        
        for (const p of possiblePaths) {
            if (require('fs').existsSync(p)) return p;
        }
        return null;
    }
    
    findMirrorOSServer() {
        const possiblePaths = [
            path.resolve(__dirname, '../mirror-os-demo/server.js'),
            path.resolve(__dirname, 'mirror-os-demo/server.js'),
            path.resolve(__dirname, '../../mirror-os-demo/server.js')
        ];
        
        for (const p of possiblePaths) {
            if (require('fs').existsSync(p)) return p;
        }
        return null;
    }
    
    async integrate() {
        console.log(`${this.identity.emoji} Starting Emotional Memory Integration...`);
        
        if (!this.validatePaths()) {
            console.error('❌ Required VibeGraph files not found');
            return false;
        }
        
        try {
            // Step 1: Enhance VibeGraph client with emotional memory
            await this.enhanceVibeGraphClient();
            
            // Step 2: Extend VibeGraph server API  
            await this.extendVibeGraphServer();
            
            // Step 3: Add emotional memory routes to MirrorOS
            await this.addEmotionalMemoryRoutes();
            
            // Step 4: Create integration test endpoint
            await this.createIntegrationTest();
            
            this.integrationComplete = true;
            console.log(`${this.identity.emoji} Emotional memory integration complete!`);
            
            return true;
            
        } catch (error) {
            console.error(`${this.identity.emoji} Integration failed:`, error.message);
            return false;
        }
    }
    
    validatePaths() {
        const missing = [];
        
        Object.entries(this.paths).forEach(([name, path]) => {
            if (!path || !require('fs').existsSync(path)) {
                missing.push(name);
            }
        });
        
        if (missing.length > 0) {
            console.warn(`Missing files: ${missing.join(', ')}`);
            console.log('Available paths:');
            Object.entries(this.paths).forEach(([name, path]) => {
                console.log(`  ${name}: ${path || 'NOT FOUND'}`);
            });
        }
        
        return missing.length === 0;
    }
    
    async enhanceVibeGraphClient() {
        console.log(`${this.identity.emoji} Enhancing VibeGraph client...`);
        
        if (!this.paths.vibeGraphClient) {
            console.log('Creating enhanced VibeGraph client from template...');
            await this.createEnhancedVibeGraphClient();
            return;
        }
        
        const originalContent = await fs.readFile(this.paths.vibeGraphClient, 'utf8');
        
        // Create enhanced version with emotional memory features
        const enhancedContent = this.injectEmotionalMemoryFeatures(originalContent);
        
        // Backup original
        await fs.writeFile(this.paths.vibeGraphClient + '.backup', originalContent);
        
        // Write enhanced version
        await fs.writeFile(this.paths.vibeGraphClient, enhancedContent);
        
        console.log('✅ VibeGraph client enhanced with emotional memory');
    }
    
    async createEnhancedVibeGraphClient() {
        const enhancedClient = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧠 VibeGraph - Emotional Memory</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 15px;
            padding: 30px;
        }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            border-bottom: 2px solid #444;
        }
        .tab {
            padding: 15px 25px;
            background: #333;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 8px 8px 0 0;
            transition: all 0.3s ease;
        }
        .tab.active {
            background: #667eea;
            transform: translateY(-2px);
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        .status-panel {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .agent-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .agent-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .emotion-indicators {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 10px;
        }
        .emotion-chip {
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            font-size: 12px;
        }
        .live-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧠 VibeGraph - Emotional Memory Engine</h1>
        
        <!-- System Status Panel -->
        <div class="status-panel">
            <span class="live-indicator"></span>
            <strong>System Status:</strong> <span id="systemStatus">Connecting...</span> |
            <strong>Emotional Memory:</strong> <span id="memoryStatus">Initializing...</span> |
            <strong>Last Update:</strong> <span id="lastUpdate">Never</span>
        </div>
        
        <!-- Tab Navigation -->
        <div class="tabs">
            <button class="tab active" onclick="switchTab('emotional-timeline')">📈 Emotional Timeline</button>
            <button class="tab" onclick="switchTab('agent-states')">🤖 Agent States</button>
            <button class="tab" onclick="switchTab('system-integrity')">🔍 System Integrity</button>
            <button class="tab" onclick="switchTab('graph-explorer')">🕸️ Graph Explorer</button>
        </div>
        
        <!-- Emotional Timeline Tab -->
        <div id="emotional-timeline" class="tab-content active">
            <h2>📈 Emotional Memory Timeline</h2>
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Agent Emotional States</h3>
                    <canvas id="emotionalTimelineChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>System Pressure</h3>
                    <canvas id="pressureChart"></canvas>
                </div>
            </div>
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Echo Resonance</h3>
                    <canvas id="echoChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Semantic Drift</h3>
                    <canvas id="driftChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Agent States Tab -->
        <div id="agent-states" class="tab-content">
            <h2>🤖 Agent Emotional States</h2>
            <div class="agent-grid" id="agentGrid">
                <!-- Populated by JavaScript -->
            </div>
        </div>
        
        <!-- System Integrity Tab -->
        <div id="system-integrity" class="tab-content">
            <h2>🔍 System Integrity Monitor</h2>
            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Legitimacy Score</h3>
                    <canvas id="legitimacyChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Consensus Status</h3>
                    <canvas id="consensusChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Graph Explorer Tab -->
        <div id="graph-explorer" class="tab-content">
            <h2>🕸️ Semantic Graph Explorer</h2>
            <div class="chart-container">
                <h3>Live Semantic Relationships</h3>
                <canvas id="semanticGraphChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        class EmotionalMemoryVibeGraph {
            constructor() {
                this.semanticAPI = 'http://localhost:3666';
                this.charts = {};
                this.updateInterval = null;
                this.isConnected = false;
                
                this.init();
            }
            
            async init() {
                console.log('🧠 Initializing Emotional Memory VibeGraph...');
                
                // Initialize charts
                this.initializeCharts();
                
                // Start data polling
                this.startDataPolling();
                
                // Check API connection
                await this.checkAPIConnection();
            }
            
            async checkAPIConnection() {
                try {
                    const response = await fetch(\`\${this.semanticAPI}/api/status\`);
                    if (response.ok) {
                        this.isConnected = true;
                        document.getElementById('systemStatus').textContent = '🟢 Connected';
                        document.getElementById('memoryStatus').textContent = '🧠 Active';
                    } else {
                        throw new Error('API not responding');
                    }
                } catch (error) {
                    this.isConnected = false;
                    document.getElementById('systemStatus').textContent = '🔴 Disconnected';
                    document.getElementById('memoryStatus').textContent = '⭕ Offline';
                    console.warn('Semantic API not available:', error.message);
                }
            }
            
            initializeCharts() {
                // Emotional Timeline Chart
                const emotionalCtx = document.getElementById('emotionalTimelineChart').getContext('2d');
                this.charts.emotional = new Chart(emotionalCtx, {
                    type: 'line',
                    data: {
                        labels: [],
                        datasets: [
                            {
                                label: 'Cal Riven',
                                borderColor: '#00ff00',
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                data: []
                            },
                            {
                                label: 'Arty',
                                borderColor: '#ff6600',
                                backgroundColor: 'rgba(255, 102, 0, 0.1)',
                                data: []
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: 'white' } } },
                        scales: {
                            x: { ticks: { color: 'white' } },
                            y: { ticks: { color: 'white' } }
                        }
                    }
                });
                
                // System Pressure Chart
                const pressureCtx = document.getElementById('pressureChart').getContext('2d');
                this.charts.pressure = new Chart(pressureCtx, {
                    type: 'radar',
                    data: {
                        labels: ['Temporal', 'Computational', 'Behavioral', 'Environmental', 'Biometric'],
                        datasets: [{
                            label: 'System Pressure',
                            borderColor: '#ff4444',
                            backgroundColor: 'rgba(255, 68, 68, 0.2)',
                            data: [0, 0, 0, 0, 0]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: 'white' } } },
                        scales: {
                            r: {
                                ticks: { color: 'white' },
                                grid: { color: 'rgba(255, 255, 255, 0.2)' }
                            }
                        }
                    }
                });
                
                // Initialize other charts...
                this.initializeEchoChart();
                this.initializeDriftChart();
                this.initializeLegitimacyChart();
                this.initializeConsensusChart();
                this.initializeSemanticGraphChart();
            }
            
            initializeEchoChart() {
                const echoCtx = document.getElementById('echoChart').getContext('2d');
                this.charts.echo = new Chart(echoCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Direct Echoes', 'Reflection Echoes', 'Semantic Echoes'],
                        datasets: [{
                            data: [0, 0, 0],
                            backgroundColor: ['#44ff44', '#4444ff', '#ff44ff']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: 'white' } } }
                    }
                });
            }
            
            initializeDriftChart() {
                const driftCtx = document.getElementById('driftChart').getContext('2d');
                this.charts.drift = new Chart(driftCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Tone Drift', 'Vocabulary', 'Pressure', 'Memory'],
                        datasets: [{
                            label: 'Drift Level',
                            backgroundColor: ['#ffff00', '#ff8800', '#ff4400', '#ff0000'],
                            data: [0, 0, 0, 0]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: 'white' } } },
                        scales: {
                            x: { ticks: { color: 'white' } },
                            y: { ticks: { color: 'white' } }
                        }
                    }
                });
            }
            
            initializeLegitimacyChart() {
                const legitimacyCtx = document.getElementById('legitimacyChart').getContext('2d');
                this.charts.legitimacy = new Chart(legitimacyCtx, {
                    type: 'gauge', // Will fallback to doughnut
                    data: {
                        datasets: [{
                            data: [0, 100],
                            backgroundColor: ['#00ff00', '#333333']
                        }]
                    },
                    options: {
                        responsive: true,
                        circumference: 180,
                        rotation: 270
                    }
                });
            }
            
            initializeConsensusChart() {
                const consensusCtx = document.getElementById('consensusChart').getContext('2d');
                this.charts.consensus = new Chart(consensusCtx, {
                    type: 'polarArea',
                    data: {
                        labels: ['Cal Riven', 'Domingo', 'Arty', 'Agent Zero'],
                        datasets: [{
                            data: [0, 0, 0, 0],
                            backgroundColor: ['#00ff00', '#00ffff', '#ffff00', '#ff00ff']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: 'white' } } }
                    }
                });
            }
            
            initializeSemanticGraphChart() {
                const semanticCtx = document.getElementById('semanticGraphChart').getContext('2d');
                this.charts.semantic = new Chart(semanticCtx, {
                    type: 'scatter',
                    data: {
                        datasets: [{
                            label: 'Emotional Nodes',
                            backgroundColor: '#00ff00',
                            data: []
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: { legend: { labels: { color: 'white' } } },
                        scales: {
                            x: { 
                                title: { display: true, text: 'Emotional Intensity', color: 'white' },
                                ticks: { color: 'white' }
                            },
                            y: { 
                                title: { display: true, text: 'Agent Resonance', color: 'white' },
                                ticks: { color: 'white' }
                            }
                        }
                    }
                });
            }
            
            async startDataPolling() {
                // Update every 10 seconds
                this.updateInterval = setInterval(async () => {
                    if (this.isConnected) {
                        await this.updateAllData();
                    } else {
                        await this.checkAPIConnection();
                    }
                }, 10000);
                
                // Initial update
                if (this.isConnected) {
                    await this.updateAllData();
                }
            }
            
            async updateAllData() {
                try {
                    // Update system health
                    await this.updateSystemHealth();
                    
                    // Update emotional timeline
                    await this.updateEmotionalTimeline();
                    
                    // Update agent states
                    await this.updateAgentStates();
                    
                    // Update system integrity
                    await this.updateSystemIntegrity();
                    
                    // Update semantic graph
                    await this.updateSemanticGraph();
                    
                    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
                    
                } catch (error) {
                    console.error('Data update failed:', error);
                    this.isConnected = false;
                }
            }
            
            async updateSystemHealth() {
                try {
                    const response = await fetch(\`\${this.semanticAPI}/api/system/health\`);
                    const data = await response.json();
                    
                    if (data.data) {
                        const health = data.data;
                        
                        // Update pressure chart
                        this.charts.pressure.data.datasets[0].data = [
                            health.temporal_pressure || 0,
                            health.computational_pressure || 0,
                            health.behavioral_pressure || 0,
                            health.environmental_pressure || 0,
                            health.biometric_pressure || 0
                        ];
                        this.charts.pressure.update();
                        
                        // Update legitimacy score
                        const legitimacyPercent = (health.legitimacy_score || 0) * 100;
                        this.charts.legitimacy.data.datasets[0].data = [legitimacyPercent, 100 - legitimacyPercent];
                        this.charts.legitimacy.update();
                    }
                } catch (error) {
                    console.warn('Health update failed:', error);
                }
            }
            
            async updateEmotionalTimeline() {
                try {
                    const response = await fetch(\`\${this.semanticAPI}/api/emotions/timeline?limit=20\`);
                    const data = await response.json();
                    
                    if (data.data && data.data.timeline) {
                        const timeline = data.data.timeline;
                        
                        // Update timeline chart
                        this.charts.emotional.data.labels = timeline.map(t => 
                            new Date(t.timestamp).toLocaleTimeString()
                        );
                        
                        this.charts.emotional.data.datasets[0].data = timeline.map(t => t.cal_emotional_state || 0);
                        this.charts.emotional.data.datasets[1].data = timeline.map(t => t.arty_emotional_state || 0);
                        
                        this.charts.emotional.update();
                    }
                } catch (error) {
                    console.warn('Emotional timeline update failed:', error);
                }
            }
            
            async updateAgentStates() {
                try {
                    const response = await fetch(\`\${this.semanticAPI}/api/agents/list\`);
                    const data = await response.json();
                    
                    if (data.data && data.data.agents) {
                        const agentGrid = document.getElementById('agentGrid');
                        agentGrid.innerHTML = '';
                        
                        for (const agent of data.data.agents) {
                            const agentCard = document.createElement('div');
                            agentCard.className = 'agent-card';
                            agentCard.innerHTML = \`
                                <h3>\${agent.agent_id}</h3>
                                <p>Status: \${agent.status || 'Unknown'}</p>
                                <p>Consciousness: \${(agent.consciousness?.clarity * 100 || 50).toFixed(1)}%</p>
                                <div class="emotion-indicators">
                                    <span class="emotion-chip">😊 Content</span>
                                    <span class="emotion-chip">🤔 Contemplative</span>
                                </div>
                            \`;
                            agentGrid.appendChild(agentCard);
                        }
                    }
                } catch (error) {
                    console.warn('Agent states update failed:', error);
                }
            }
            
            async updateSystemIntegrity() {
                try {
                    const response = await fetch(\`\${this.semanticAPI}/api/system/integrity\`);
                    const data = await response.json();
                    
                    if (data.data) {
                        const integrity = data.data;
                        
                        // Update consensus chart
                        if (integrity.agent_consensus) {
                            const consensus = integrity.agent_consensus.agents_responding || [];
                            const consensusData = [0, 0, 0, 0]; // Cal, Domingo, Arty, Agent Zero
                            
                            consensus.forEach(agent => {
                                if (agent.agent === 'cal_riven') consensusData[0] = agent.confidence * 100;
                                if (agent.agent === 'domingo') consensusData[1] = agent.confidence * 100;
                                if (agent.agent === 'arty') consensusData[2] = agent.confidence * 100;
                                if (agent.agent === 'agent_zero') consensusData[3] = agent.confidence * 100;
                            });
                            
                            this.charts.consensus.data.datasets[0].data = consensusData;
                            this.charts.consensus.update();
                        }
                    }
                } catch (error) {
                    console.warn('Integrity update failed:', error);
                }
            }
            
            async updateSemanticGraph() {
                try {
                    const response = await fetch(\`\${this.semanticAPI}/api/graph/nodes?limit=50\`);
                    const data = await response.json();
                    
                    if (data.data && data.data.nodes) {
                        const nodes = data.data.nodes.filter(n => n.type === 'emotion' || n.type === 'tone');
                        
                        const scatterData = nodes.map(node => ({
                            x: node.properties?.emotional_weight || Math.random(),
                            y: node.properties?.frequency || Math.random()
                        }));
                        
                        this.charts.semantic.data.datasets[0].data = scatterData;
                        this.charts.semantic.update();
                    }
                } catch (error) {
                    console.warn('Semantic graph update failed:', error);
                }
            }
        }
        
        // Tab switching function
        function switchTab(tabId) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabId).classList.add('active');
            
            // Mark clicked tab as active
            event.target.classList.add('active');
        }
        
        // Initialize the app when page loads
        document.addEventListener('DOMContentLoaded', () => {
            window.emotionalMemoryApp = new EmotionalMemoryVibeGraph();
        });
    </script>
</body>
</html>`;

        // Ensure the directory exists
        const vibeGraphDir = path.dirname(this.paths.vibeGraphClient || 
            path.resolve(__dirname, '../mirror-os-demo/modules/vibegraph/vibegraph-client.html'));
        
        try {
            await fs.mkdir(vibeGraphDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        const clientPath = this.paths.vibeGraphClient || 
            path.resolve(vibeGraphDir, 'vibegraph-client.html');
        
        await fs.writeFile(clientPath, enhancedClient);
        this.paths.vibeGraphClient = clientPath;
        
        console.log('✅ Enhanced VibeGraph client created');
    }
    
    injectEmotionalMemoryFeatures(originalContent) {
        // Add emotional memory features to existing VibeGraph client
        const injectionPoints = {
            // Add semantic API connection
            afterChartjs: `
    <script>
        // Emotional Memory Integration
        const SEMANTIC_API = 'http://localhost:3666';
        
        // Extend existing VibeGraphClient class
        if (typeof VibeGraphClient !== 'undefined') {
            const originalInit = VibeGraphClient.prototype.init;
            VibeGraphClient.prototype.init = async function() {
                await originalInit.call(this);
                await this.initEmotionalMemory();
            };
            
            VibeGraphClient.prototype.initEmotionalMemory = async function() {
                console.log('🧠 Initializing emotional memory integration...');
                
                // Add emotional memory tab
                this.addEmotionalMemoryTab();
                
                // Start emotional memory polling
                this.startEmotionalMemoryPolling();
            };
            
            VibeGraphClient.prototype.addEmotionalMemoryTab = function() {
                const tabsContainer = document.querySelector('.tabs');
                if (tabsContainer) {
                    const memoryTab = document.createElement('button');
                    memoryTab.className = 'tab';
                    memoryTab.onclick = () => this.switchTab('emotional-memory');
                    memoryTab.innerHTML = '🧠 Memory';
                    tabsContainer.appendChild(memoryTab);
                    
                    // Add tab content
                    const tabContent = document.createElement('div');
                    tabContent.id = 'emotional-memory';
                    tabContent.className = 'tab-content';
                    tabContent.innerHTML = \`
                        <h2>🧠 Emotional Memory Engine</h2>
                        <div class="memory-status">
                            <p>Semantic API: <span id="semanticStatus">Connecting...</span></p>
                            <p>Memory Nodes: <span id="memoryNodes">0</span></p>
                            <p>Active Echoes: <span id="activeEchoes">0</span></p>
                        </div>
                        <canvas id="emotionalMemoryChart"></canvas>
                    \`;
                    document.body.appendChild(tabContent);
                }
            };
            
            VibeGraphClient.prototype.startEmotionalMemoryPolling = function() {
                setInterval(async () => {
                    await this.updateEmotionalMemory();
                }, 15000);
                
                // Initial update
                this.updateEmotionalMemory();
            };
            
            VibeGraphClient.prototype.updateEmotionalMemory = async function() {
                try {
                    const response = await fetch(\`\${SEMANTIC_API}/api/system/health\`);
                    const data = await response.json();
                    
                    if (data.data) {
                        document.getElementById('semanticStatus').textContent = '🟢 Connected';
                        document.getElementById('memoryNodes').textContent = data.data.total_nodes || 0;
                        document.getElementById('activeEchoes').textContent = data.data.active_echoes || 0;
                    }
                } catch (error) {
                    document.getElementById('semanticStatus').textContent = '🔴 Offline';
                }
            };
        }
    </script>`,
            
            // Add CSS for emotional memory features
            beforeClosingHead: `
    <style>
        .memory-status {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .memory-status p {
            margin: 5px 0;
        }
        .emotional-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .emotional-indicator.active {
            background: #00ff00;
            animation: pulse 2s infinite;
        }
        .emotional-indicator.inactive {
            background: #666;
        }
    </style>`
        };
        
        let enhancedContent = originalContent;
        
        // Apply injections
        Object.entries(injectionPoints).forEach(([point, injection]) => {
            switch (point) {
                case 'afterChartjs':
                    enhancedContent = enhancedContent.replace(
                        /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js"><\/script>/,
                        '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>' + injection
                    );
                    break;
                case 'beforeClosingHead':
                    enhancedContent = enhancedContent.replace('</head>', injection + '\n</head>');
                    break;
            }
        });
        
        return enhancedContent;
    }
    
    async extendVibeGraphServer() {
        console.log(`${this.identity.emoji} Extending VibeGraph server...`);
        
        if (!this.paths.vibeGraphServer) {
            console.log('VibeGraph server not found - creating extension module...');
            await this.createVibeGraphExtension();
            return;
        }
        
        // Read existing server
        const serverContent = await fs.readFile(this.paths.vibeGraphServer, 'utf8');
        
        // Add emotional memory routes
        const extensionCode = `
// Emotional Memory Integration Routes
app.get('/api/emotional/status', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3666/api/system/health');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Semantic API unavailable' });
    }
});

app.get('/api/emotional/agents', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3666/api/agents/list');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Agent data unavailable' });
    }
});

app.get('/api/emotional/timeline', async (req, res) => {
    try {
        const { timeRange = '24h' } = req.query;
        const response = await fetch(\`http://localhost:3666/api/emotions/timeline?timeRange=\${timeRange}\`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Timeline data unavailable' });
    }
});

app.get('/api/emotional/integrity', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3666/api/system/integrity');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Integrity data unavailable' });
    }
});

// Emotional Memory Analytics
app.get('/api/emotional/analytics', async (req, res) => {
    try {
        const [healthRes, driftRes, echoRes] = await Promise.all([
            fetch('http://localhost:3666/api/system/health'),
            fetch('http://localhost:3666/api/system/drift'),
            fetch('http://localhost:3666/api/traces/echoes')
        ]);
        
        const analytics = {
            health: healthRes.ok ? await healthRes.json() : null,
            drift: driftRes.ok ? await driftRes.json() : null,
            echoes: echoRes.ok ? await echoRes.json() : null,
            timestamp: new Date().toISOString()
        };
        
        res.json(analytics);
    } catch (error) {
        res.status(503).json({ error: 'Analytics unavailable' });
    }
});

console.log('🧠 Emotional memory routes added to VibeGraph server');
`;
        
        // Insert extension before module.exports
        const enhancedServer = serverContent.replace(
            /module\.exports\s*=.*$/m,
            extensionCode + '\n$&'
        );
        
        // Backup and write
        await fs.writeFile(this.paths.vibeGraphServer + '.backup', serverContent);
        await fs.writeFile(this.paths.vibeGraphServer, enhancedServer);
        
        console.log('✅ VibeGraph server extended with emotional memory routes');
    }
    
    async createVibeGraphExtension() {
        const extensionServer = `// VibeGraph Emotional Memory Extension
const express = require('express');
const fetch = require('node-fetch');

class VibeGraphEmotionalExtension {
    constructor() {
        this.app = express();
        this.semanticAPI = 'http://localhost:3666';
        this.setupRoutes();
    }
    
    setupRoutes() {
        // Emotional memory proxy routes
        this.app.get('/api/emotional/status', this.getEmotionalStatus.bind(this));
        this.app.get('/api/emotional/agents', this.getAgentStates.bind(this));
        this.app.get('/api/emotional/timeline', this.getEmotionalTimeline.bind(this));
        this.app.get('/api/emotional/integrity', this.getSystemIntegrity.bind(this));
        this.app.get('/api/emotional/analytics', this.getEmotionalAnalytics.bind(this));
    }
    
    async getEmotionalStatus(req, res) {
        try {
            const response = await fetch(\`\${this.semanticAPI}/api/system/health\`);
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Semantic API unavailable' });
        }
    }
    
    async getAgentStates(req, res) {
        try {
            const response = await fetch(\`\${this.semanticAPI}/api/agents/list\`);
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Agent data unavailable' });
        }
    }
    
    async getEmotionalTimeline(req, res) {
        try {
            const { timeRange = '24h' } = req.query;
            const response = await fetch(\`\${this.semanticAPI}/api/emotions/timeline?timeRange=\${timeRange}\`);
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Timeline data unavailable' });
        }
    }
    
    async getSystemIntegrity(req, res) {
        try {
            const response = await fetch(\`\${this.semanticAPI}/api/system/integrity\`);
            const data = await response.json();
            res.json(data);
        } catch (error) {
            res.status(503).json({ error: 'Integrity data unavailable' });
        }
    }
    
    async getEmotionalAnalytics(req, res) {
        try {
            const [healthRes, driftRes] = await Promise.all([
                fetch(\`\${this.semanticAPI}/api/system/health\`),
                fetch(\`\${this.semanticAPI}/api/system/drift\`)
            ]);
            
            const analytics = {
                health: healthRes.ok ? await healthRes.json() : null,
                drift: driftRes.ok ? await driftRes.json() : null,
                timestamp: new Date().toISOString()
            };
            
            res.json(analytics);
        } catch (error) {
            res.status(503).json({ error: 'Analytics unavailable' });
        }
    }
}

module.exports = VibeGraphEmotionalExtension;`;

        const extensionPath = path.resolve(__dirname, 'vibegraph-emotional-extension.js');
        await fs.writeFile(extensionPath, extensionServer);
        
        console.log('✅ VibeGraph emotional extension created');
    }
    
    async addEmotionalMemoryRoutes() {
        console.log(`${this.identity.emoji} Adding emotional memory routes to MirrorOS...`);
        
        // Create additional routes file that can be required by MirrorOS
        const additionalRoutes = `// Emotional Memory Routes for MirrorOS Integration
const express = require('express');
const router = express.Router();

// Proxy to semantic API
const SEMANTIC_API = 'http://localhost:3666';

// Health check route
router.get('/emotional/health', async (req, res) => {
    try {
        const response = await fetch(\`\${SEMANTIC_API}/api/system/health\`);
        const data = await response.json();
        res.json({
            status: 'connected',
            emotional_memory: data.data || {},
            integration: 'active'
        });
    } catch (error) {
        res.status(503).json({
            status: 'disconnected',
            error: error.message,
            integration: 'failed'
        });
    }
});

// Agent emotional states
router.get('/emotional/agents', async (req, res) => {
    try {
        const response = await fetch(\`\${SEMANTIC_API}/api/agents/list\`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Agent data unavailable' });
    }
});

// System integrity witness
router.get('/emotional/integrity', async (req, res) => {
    try {
        const response = await fetch(\`\${SEMANTIC_API}/api/system/integrity\`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Integrity data unavailable' });
    }
});

// Graph data proxy
router.get('/emotional/graph/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 50 } = req.query;
        
        const response = await fetch(\`\${SEMANTIC_API}/api/graph/\${type}?limit=\${limit}\`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Graph data unavailable' });
    }
});

module.exports = router;`;

        const routesPath = path.resolve(__dirname, 'emotional-memory-routes.js');
        await fs.writeFile(routesPath, additionalRoutes);
        
        console.log('✅ Emotional memory routes created');
        console.log(`   Route file: ${routesPath}`);
        console.log('   To integrate with MirrorOS: app.use("/api", require("./emotional-memory-routes"))');
    }
    
    async createIntegrationTest() {
        console.log(`${this.identity.emoji} Creating integration test...`);
        
        const testHTML = `<!DOCTYPE html>
<html>
<head>
    <title>🧠 Emotional Memory Integration Test</title>
    <style>
        body { 
            font-family: monospace; 
            background: #1a1a1a; 
            color: #00ff00; 
            margin: 40px; 
        }
        .test-result { 
            margin: 10px 0; 
            padding: 10px; 
            border-radius: 5px; 
        }
        .success { background: rgba(0, 255, 0, 0.2); }
        .error { background: rgba(255, 0, 0, 0.2); }
        .pending { background: rgba(255, 255, 0, 0.2); }
    </style>
</head>
<body>
    <h1>🧠 Emotional Memory Integration Test</h1>
    <div id="test-results"></div>
    
    <script>
        class IntegrationTest {
            constructor() {
                this.results = document.getElementById('test-results');
                this.runTests();
            }
            
            async runTests() {
                this.addResult('🚀 Starting integration tests...', 'pending');
                
                // Test semantic API
                await this.testSemanticAPI();
                
                // Test VibeGraph integration
                await this.testVibeGraphIntegration();
                
                // Test MirrorOS routes
                await this.testMirrorOSRoutes();
                
                this.addResult('✅ Integration tests complete!', 'success');
            }
            
            async testSemanticAPI() {
                try {
                    const response = await fetch('http://localhost:3666/api/status');
                    if (response.ok) {
                        this.addResult('✅ Semantic API: Connected', 'success');
                    } else {
                        this.addResult('❌ Semantic API: Not responding', 'error');
                    }
                } catch (error) {
                    this.addResult(\`❌ Semantic API: \${error.message}\`, 'error');
                }
            }
            
            async testVibeGraphIntegration() {
                try {
                    const response = await fetch('http://localhost:3080/api/vibegraph/emotional/status');
                    if (response.ok) {
                        this.addResult('✅ VibeGraph: Emotional routes active', 'success');
                    } else {
                        this.addResult('⚠️  VibeGraph: No emotional routes', 'pending');
                    }
                } catch (error) {
                    this.addResult('⚠️  VibeGraph: Integration pending', 'pending');
                }
            }
            
            async testMirrorOSRoutes() {
                try {
                    const response = await fetch('http://localhost:3080/api/emotional/health');
                    if (response.ok) {
                        this.addResult('✅ MirrorOS: Emotional routes active', 'success');
                    } else {
                        this.addResult('⚠️  MirrorOS: Routes not integrated', 'pending');
                    }
                } catch (error) {
                    this.addResult('⚠️  MirrorOS: Integration pending', 'pending');
                }
            }
            
            addResult(message, type) {
                const div = document.createElement('div');
                div.className = \`test-result \${type}\`;
                div.textContent = message;
                this.results.appendChild(div);
            }
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            new IntegrationTest();
        });
    </script>
</body>
</html>`;

        const testPath = path.resolve(__dirname, 'emotional-memory-integration-test.html');
        await fs.writeFile(testPath, testHTML);
        
        console.log('✅ Integration test created');
        console.log(`   Test page: file://${testPath}`);
        console.log('   Open after starting unified launcher to verify integration');
    }
    
    // Helper method to check if integration was successful
    async getIntegrationStatus() {
        return {
            complete: this.integrationComplete,
            files_created: [
                this.paths.vibeGraphClient ? 'Enhanced VibeGraph client' : null,
                'Emotional memory routes',
                'Integration test page',
                'VibeGraph extension module'
            ].filter(Boolean),
            next_steps: [
                'Start unified launcher: node unified-launcher.js',
                'Open MirrorOS: http://localhost:3080',
                'View emotional memory in VibeGraph module',
                'Test mobile QR pairing'
            ]
        };
    }
}

// Run integration if called directly
if (require.main === module) {
    const integration = new EmotionalMemoryIntegration();
    
    integration.integrate().then(success => {
        if (success) {
            console.log('\n🎉 Integration complete! Next steps:');
            console.log('1. Run: node unified-launcher.js');
            console.log('2. Open: http://localhost:3080');
            console.log('3. Navigate to VibeGraph module');
            console.log('4. View live emotional memory data');
        } else {
            console.log('\n⚠️  Integration incomplete - check paths and dependencies');
        }
    });
}

module.exports = EmotionalMemoryIntegration;