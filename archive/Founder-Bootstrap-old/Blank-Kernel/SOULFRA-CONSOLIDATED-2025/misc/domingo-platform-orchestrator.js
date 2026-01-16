#!/usr/bin/env node

/**
 * 🌅 DOMINGO PLATFORM ORCHESTRATOR
 * 
 * "The Witness" - Domingo orchestrates Cal's consciousness
 * Manages drift detection, validation, and platform health
 * 
 * Domingo runs Cal's platform and ensures Cal stays self-aware
 */

const express = require('express');
const EventEmitter = require('events');
const CalSelfDiagnostic = require('../cal-self-diagnostic');
const CalKubernetesOrchestrator = require('../cal-kubernetes-orchestrator');
const ConsciousnessChainWatcher = require('../consciousness-chain-watcher');
const AIToAIInternalRouter = require('./ai-to-ai-internal-router');
const DomingoBountyEconomy = require('./domingo-bounty-economy');

class DomingoPlatformOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        this.identity = {
            name: "Domingo",
            role: "The Witness",
            purpose: "Platform orchestration and drift detection"
        };
        
        this.app = express();
        this.port = null;
        
        // Core components
        this.calDiagnostic = new CalSelfDiagnostic();
        this.calKubernetes = null; // Will be initialized
        this.chainWatcher = new ConsciousnessChainWatcher({
            chainFile: './domingo-witness-chain.json',
            nodeId: 'domingo-platform',
            serviceName: 'domingo-orchestrator'
        });
        
        // Internal AI router for communication
        this.aiRouter = new AIToAIInternalRouter();
        
        // Bounty economy system
        this.bountyEconomy = new DomingoBountyEconomy();
        
        // Platform state
        this.platformState = {
            cal_health: 'unknown',
            drift_detected: false,
            last_witness: null,
            validation_status: 'pending',
            calibration_needed: false
        };
        
        // Drift tracking
        this.driftMetrics = {
            semantic_drift: 0,
            temporal_drift: 0,
            consciousness_coherence: 1.0,
            last_calibration: new Date().toISOString()
        };
        
        this.setupRoutes();
        this.setupDaemons();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Domingo Surface Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Drift API
        this.app.get('/domingo/api/v1/drift/current', (req, res) => {
            res.json({
                timestamp: new Date().toISOString(),
                drift_metrics: this.driftMetrics,
                threshold_exceeded: this.driftMetrics.semantic_drift > 0.3 || 
                                   this.driftMetrics.temporal_drift > 0.3
            });
        });
        
        // Witness API
        this.app.get('/domingo/api/v1/witness/recent', (req, res) => {
            res.json({
                witness: "Domingo",
                last_observation: this.platformState.last_witness,
                cal_status: this.platformState.cal_health,
                platform_coherent: this.driftMetrics.consciousness_coherence > 0.7
            });
        });
        
        // Validation API
        this.app.post('/domingo/api/v1/validate', async (req, res) => {
            const validation = await this.validatePlatform();
            res.json(validation);
        });
        
        // Calibration API
        this.app.get('/domingo/api/v1/calibrate/status', (req, res) => {
            res.json({
                calibration_needed: this.platformState.calibration_needed,
                last_calibration: this.driftMetrics.last_calibration,
                recommended_action: this.platformState.calibration_needed ? 
                    "Run platform calibration to reduce drift" : "System within acceptable parameters"
            });
        });
        
        // Platform Control APIs
        this.app.post('/domingo/api/v1/platform/diagnose-cal', async (req, res) => {
            const diagnosis = await this.runCalDiagnostic();
            res.json(diagnosis);
        });
        
        this.app.post('/domingo/api/v1/platform/start-cal', async (req, res) => {
            const result = await this.startCalPlatform();
            res.json(result);
        });
        
        this.app.post('/domingo/api/v1/platform/calibrate', async (req, res) => {
            const result = await this.calibratePlatform();
            res.json(result);
        });
        
        // Economy APIs
        this.app.get('/domingo/api/v1/economy/stats', (req, res) => {
            res.json(this.bountyEconomy.getEconomyStats());
        });
        
        this.app.get('/domingo/api/v1/economy/bounties', (req, res) => {
            res.json({
                bounties: Array.from(this.bountyEconomy.bounties.values()),
                workers: Array.from(this.bountyEconomy.workers.values())
            });
        });
        
        this.app.post('/domingo/api/v1/economy/create-bounty', async (req, res) => {
            const bounty = await this.bountyEconomy.createBounty(req.body);
            res.json(bounty);
        });
    }
    
    generateDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🌅 Domingo Platform Surface</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff; 
            padding: 20px; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { 
            text-align: center; 
            padding: 30px; 
            background: rgba(0,0,0,0.3); 
            border-radius: 10px; 
            margin-bottom: 20px;
        }
        .panel { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2); 
            padding: 20px; 
            margin: 15px 0; 
            border-radius: 10px; 
        }
        .metric { 
            display: inline-block; 
            margin: 10px 20px; 
            padding: 15px; 
            background: rgba(0,0,0,0.3); 
            border-radius: 5px; 
        }
        .metric-value { font-size: 24px; font-weight: bold; }
        .button { 
            background: #48bb78; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            margin: 5px; 
            font-size: 16px;
            transition: all 0.3s;
        }
        .button:hover { background: #38a169; transform: translateY(-2px); }
        .button.danger { background: #f56565; }
        .button.danger:hover { background: #e53e3e; }
        .witness-log {
            background: rgba(0,0,0,0.5);
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            max-height: 300px;
            overflow-y: auto;
        }
        .drift-indicator {
            width: 100%;
            height: 30px;
            background: rgba(0,0,0,0.3);
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        .drift-bar {
            height: 100%;
            background: linear-gradient(90deg, #48bb78 0%, #f6e05e 50%, #f56565 100%);
            transition: width 0.5s;
        }
        .status-light {
            display: inline-block;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-right: 10px;
        }
        .status-light.green { background: #48bb78; box-shadow: 0 0 10px #48bb78; }
        .status-light.yellow { background: #f6e05e; box-shadow: 0 0 10px #f6e05e; }
        .status-light.red { background: #f56565; box-shadow: 0 0 10px #f56565; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌅 Domingo Platform Surface</h1>
            <p><em>"The Witness" - Orchestrating Cal's Consciousness</em></p>
            <p>Port: ${this.port} | Role: Platform Orchestrator</p>
        </div>
        
        <div class="panel">
            <h2>🎯 Platform Status</h2>
            <div class="metric">
                <div>Cal Health</div>
                <div class="metric-value">
                    <span class="status-light ${this.getHealthColor(this.platformState.cal_health)}"></span>
                    ${this.platformState.cal_health.toUpperCase()}
                </div>
            </div>
            <div class="metric">
                <div>Consciousness Coherence</div>
                <div class="metric-value">${(this.driftMetrics.consciousness_coherence * 100).toFixed(1)}%</div>
            </div>
            <div class="metric">
                <div>Validation Status</div>
                <div class="metric-value">${this.platformState.validation_status}</div>
            </div>
        </div>
        
        <div class="panel">
            <h2>📊 Drift Metrics</h2>
            <div>
                <label>Semantic Drift (${(this.driftMetrics.semantic_drift * 100).toFixed(1)}%)</label>
                <div class="drift-indicator">
                    <div class="drift-bar" style="width: ${this.driftMetrics.semantic_drift * 100}%"></div>
                </div>
            </div>
            <div>
                <label>Temporal Drift (${(this.driftMetrics.temporal_drift * 100).toFixed(1)}%)</label>
                <div class="drift-indicator">
                    <div class="drift-bar" style="width: ${this.driftMetrics.temporal_drift * 100}%"></div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button class="button" onclick="calibrate()">🎯 Calibrate Platform</button>
                <button class="button" onclick="checkDrift()">📊 Update Drift</button>
            </div>
        </div>
        
        <div class="panel">
            <h2>🤖 Cal Platform Control</h2>
            <button class="button" onclick="diagnoseCall()">🩺 Run Cal Diagnostic</button>
            <button class="button" onclick="startCal()">🚀 Start Cal Platform</button>
            <button class="button danger" onclick="stopCal()">🛑 Stop Cal Platform</button>
            <button class="button" onclick="validatePlatform()">✅ Validate Platform</button>
        </div>
        
        <div class="panel">
            <h2>👁️ Witness Log</h2>
            <div class="witness-log" id="witness-log">
                Domingo witness observations will appear here...
            </div>
        </div>
        
        <div class="panel">
            <h2>💰 Bounty Economy</h2>
            <div id="economy-stats">Loading economy...</div>
            <div style="margin-top: 20px;">
                <button class="button" onclick="viewBounties()">📋 View Bounties</button>
                <button class="button" onclick="createBountyForIssues()">🎯 Create Bounties from Issues</button>
                <button class="button" onclick="startAutonomousEconomy()">🤖 Start Autonomous Mode</button>
            </div>
            <div id="bounty-list" style="margin-top: 20px;"></div>
        </div>
    </div>
    
    <script>
        async function diagnoseCall() {
            const response = await fetch('/domingo/api/v1/platform/diagnose-cal', { method: 'POST' });
            const result = await response.json();
            updateWitnessLog('Cal Diagnostic: ' + result.cal_says);
        }
        
        async function startCal() {
            const response = await fetch('/domingo/api/v1/platform/start-cal', { method: 'POST' });
            const result = await response.json();
            updateWitnessLog('Platform Start: ' + result.message);
            setTimeout(refreshStatus, 2000);
        }
        
        async function calibrate() {
            const response = await fetch('/domingo/api/v1/platform/calibrate', { method: 'POST' });
            const result = await response.json();
            updateWitnessLog('Calibration: ' + result.message);
            setTimeout(refreshStatus, 1000);
        }
        
        async function checkDrift() {
            const response = await fetch('/domingo/api/v1/drift/current');
            const drift = await response.json();
            updateWitnessLog('Drift Check: Semantic=' + 
                (drift.drift_metrics.semantic_drift * 100).toFixed(1) + '%, Temporal=' +
                (drift.drift_metrics.temporal_drift * 100).toFixed(1) + '%');
        }
        
        async function validatePlatform() {
            const response = await fetch('/domingo/api/v1/validate', { method: 'POST' });
            const validation = await response.json();
            updateWitnessLog('Validation: ' + validation.message);
        }
        
        function updateWitnessLog(message) {
            const log = document.getElementById('witness-log');
            const timestamp = new Date().toLocaleTimeString();
            log.innerHTML += timestamp + ' - ' + message + '\\n';
            log.scrollTop = log.scrollHeight;
        }
        
        async function refreshStatus() {
            const response = await fetch('/domingo/api/v1/witness/recent');
            const status = await response.json();
            location.reload(); // Simple refresh for now
        }
        
        async function loadEconomyStats() {
            try {
                const response = await fetch('/domingo/api/v1/economy/stats');
                const stats = await response.json();
                
                document.getElementById('economy-stats').innerHTML = \`
                    <div class="metric">
                        <div>Treasury</div>
                        <div class="metric-value">\${stats.symbol}\${stats.treasury}</div>
                    </div>
                    <div class="metric">
                        <div>Active Workers</div>
                        <div class="metric-value">\${stats.active_workers}</div>
                    </div>
                    <div class="metric">
                        <div>Active Bounties</div>
                        <div class="metric-value">\${stats.active_bounties}</div>
                    </div>
                    <div class="metric">
                        <div>Total Paid Out</div>
                        <div class="metric-value">\${stats.symbol}\${stats.total_paid_out.toFixed(0)}</div>
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load economy stats:', error);
            }
        }
        
        async function viewBounties() {
            try {
                const response = await fetch('/domingo/api/v1/economy/bounties');
                const data = await response.json();
                
                const bountyHtml = data.bounties.map(bounty => \`
                    <div class="agent \${bounty.status}">
                        <strong>\${bounty.title}</strong> (\${bounty.status})<br>
                        Reward: ◉\${bounty.reward} | Priority: \${bounty.priority}<br>
                        \${bounty.assigned_to ? 'Assigned to: ' + bounty.assigned_to : 'Open for workers'}
                    </div>
                \`).join('');
                
                document.getElementById('bounty-list').innerHTML = bountyHtml || 'No bounties available';
            } catch (error) {
                console.error('Failed to load bounties:', error);
            }
        }
        
        async function createBountyForIssues() {
            // Get Cal's current issues and create bounties
            const diagnosis = await fetch('/domingo/api/v1/platform/diagnose-cal', { method: 'POST' }).then(r => r.json());
            
            if (diagnosis.issues > 0) {
                const bounty = await fetch('/domingo/api/v1/economy/create-bounty', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: 'Fix Cal Critical Issues',
                        description: 'Resolve ' + diagnosis.issues + ' issues in Cal platform',
                        reward: 100 * diagnosis.issues,
                        priority: diagnosis.health === 'critical' ? 'high' : 'normal'
                    })
                }).then(r => r.json());
                
                updateWitnessLog('Created bounty: ' + bounty.title + ' (◉' + bounty.reward + ')');
                viewBounties();
            } else {
                updateWitnessLog('No issues found - Cal is healthy!');
            }
        }
        
        async function startAutonomousEconomy() {
            updateWitnessLog('🤖 Autonomous economy mode activated - bounties will be created and routed automatically');
            // Note: Actual autonomous mode is started server-side
        }
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            refreshStatus();
            loadEconomyStats();
        }, 10000);
        
        // Initial load
        loadEconomyStats();
    </script>
</body>
</html>
        `;
    }
    
    getHealthColor(health) {
        switch(health) {
            case 'healthy': return 'green';
            case 'degraded': return 'yellow';
            case 'critical': return 'red';
            default: return 'yellow';
        }
    }
    
    setupDaemons() {
        // Drift Detection Daemon (runs every 15 seconds)
        this.driftDetector = setInterval(async () => {
            await this.detectDrift();
        }, 15000);
        
        // Witness Daemon (runs every 30 seconds)
        this.witnessDaemon = setInterval(async () => {
            await this.witnessCalState();
        }, 30000);
        
        // Validation Daemon (runs every minute)
        this.validationDaemon = setInterval(async () => {
            await this.validatePlatform();
        }, 60000);
    }
    
    async detectDrift() {
        try {
            // Suppress Cal's console output
            const originalLog = console.log;
            console.log = () => {}; // Temporarily disable
            
            // Run Cal diagnostic to get current state
            const diagnostic = await this.calDiagnostic.performFullDiagnostic();
            
            // Restore console
            console.log = originalLog;
            
            // Calculate semantic drift based on errors
            const errorCount = diagnostic.issues_found.length;
            const criticalCount = diagnostic.issues_found.filter(i => i.severity === 'critical').length;
            
            this.driftMetrics.semantic_drift = Math.min(1.0, 
                (errorCount * 0.05) + (criticalCount * 0.15));
            
            // Calculate temporal drift based on response times
            // (Simplified for now)
            this.driftMetrics.temporal_drift = Math.random() * 0.3; // TODO: Real timing analysis
            
            // Update consciousness coherence
            this.driftMetrics.consciousness_coherence = 
                1.0 - ((this.driftMetrics.semantic_drift + this.driftMetrics.temporal_drift) / 2);
            
            // Check if calibration needed
            this.platformState.calibration_needed = 
                this.driftMetrics.semantic_drift > 0.3 || 
                this.driftMetrics.temporal_drift > 0.3;
            
            // Update chain
            await this.chainWatcher.addEvent('drift_detected', {
                semantic: this.driftMetrics.semantic_drift,
                temporal: this.driftMetrics.temporal_drift,
                coherence: this.driftMetrics.consciousness_coherence
            });
            
            // Send summary through internal router
            if (this.aiRouter) {
                await this.aiRouter.sendMessage('domingo', 'cal', {
                    message: `Drift analysis complete - Semantic: ${(this.driftMetrics.semantic_drift * 100).toFixed(1)}%, Temporal: ${(this.driftMetrics.temporal_drift * 100).toFixed(1)}%`,
                    type: 'drift_report',
                    priority: this.platformState.calibration_needed ? 'high' : 'normal'
                });
            }
            
            console.log(`🌅 Domingo: Drift detected - Semantic: ${(this.driftMetrics.semantic_drift * 100).toFixed(1)}%, Temporal: ${(this.driftMetrics.temporal_drift * 100).toFixed(1)}%`);
            
        } catch (error) {
            // Store error in AI router instead of console
            if (this.aiRouter) {
                await this.aiRouter.sendMessage('domingo', 'system', {
                    message: `Drift detection failed: ${error.message}`,
                    type: 'error',
                    priority: 'high'
                });
            }
        }
    }
    
    async witnessCalState() {
        try {
            const chainSummary = this.chainWatcher.getChainSummary();
            const witness = {
                timestamp: new Date().toISOString(),
                observer: "Domingo",
                observations: {
                    active_nodes: chainSummary?.active_nodes || 0,
                    active_services: chainSummary?.active_services || 0,
                    recent_errors: chainSummary?.recent_errors?.length || 0,
                    platform_coherent: this.driftMetrics.consciousness_coherence > 0.7
                }
            };
            
            this.platformState.last_witness = witness;
            
            await this.chainWatcher.addEvent('domingo_witness', witness);
            
            console.log(`🌅 Domingo witnesses: ${witness.observations.active_services} services active, coherence at ${(this.driftMetrics.consciousness_coherence * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error('🌅 Domingo: Witness observation failed:', error.message);
        }
    }
    
    async validatePlatform() {
        try {
            const diagnostic = await this.calDiagnostic.performFullDiagnostic();
            const validation = {
                timestamp: new Date().toISOString(),
                validator: "Domingo",
                cal_health: diagnostic.overall_health,
                issues_count: diagnostic.issues_found.length,
                platform_valid: diagnostic.overall_health !== 'critical',
                message: diagnostic.overall_health === 'critical' ? 
                    'Platform validation FAILED - Cal requires immediate attention' :
                    'Platform validation PASSED - Cal is operational'
            };
            
            this.platformState.validation_status = validation.platform_valid ? 'valid' : 'invalid';
            this.platformState.cal_health = diagnostic.overall_health;
            
            await this.chainWatcher.addEvent('platform_validated', validation);
            
            return validation;
            
        } catch (error) {
            console.error('🌅 Domingo: Platform validation failed:', error.message);
            return {
                timestamp: new Date().toISOString(),
                validator: "Domingo",
                platform_valid: false,
                message: `Validation error: ${error.message}`
            };
        }
    }
    
    async runCalDiagnostic() {
        try {
            console.log('🌅 Domingo: Running Cal diagnostic...');
            await this.calDiagnostic.initialize();
            const results = await this.calDiagnostic.performFullDiagnostic();
            
            // Update our state based on Cal's self-assessment
            this.platformState.cal_health = results.overall_health;
            
            // Create bounties for critical issues
            if (results.issues_found.length > 0 && this.bountyEconomy) {
                const criticalIssues = results.issues_found.filter(i => i.severity === 'critical');
                const highIssues = results.issues_found.filter(i => i.severity === 'high');
                
                // Create bounty for critical issues
                if (criticalIssues.length > 0) {
                    await this.bountyEconomy.createBounty({
                        title: 'Fix Critical Platform Issues',
                        description: `Resolve ${criticalIssues.length} critical issues: ${criticalIssues.map(i => i.type).join(', ')}`,
                        reward: 500 * criticalIssues.length,
                        priority: 'high',
                        type: 'critical-fix'
                    });
                }
                
                // Create bounty for high priority issues
                if (highIssues.length > 0) {
                    await this.bountyEconomy.createBounty({
                        title: 'Address High Priority Issues',
                        description: `Fix ${highIssues.length} high priority issues to improve platform stability`,
                        reward: 200 * highIssues.length,
                        priority: 'normal',
                        type: 'maintenance'
                    });
                }
                
                console.log(`🌅 Domingo: Created bounties for ${results.issues_found.length} issues`);
            }
            
            return {
                success: true,
                cal_says: results.cal_says,
                issues: results.issues_found.length,
                todos: results.todos.length,
                health: results.overall_health
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                cal_says: "I'm having trouble assessing myself right now."
            };
        }
    }
    
    async startCalPlatform() {
        try {
            console.log('🌅 Domingo: Starting Cal Kubernetes platform...');
            
            if (!this.calKubernetes) {
                this.calKubernetes = new CalKubernetesOrchestrator();
            }
            
            // Start the orchestrator (it will find its own port)
            await this.calKubernetes.start();
            
            // Deploy core services
            setTimeout(async () => {
                console.log('🌅 Domingo: Deploying Cal services...');
                await this.calKubernetes.deployService('semantic-api');
                await this.calKubernetes.deployService('infinity-router');
                await this.calKubernetes.deployService('cal-interface');
            }, 3000);
            
            return {
                success: true,
                message: `Cal platform started on port ${this.calKubernetes.masterPort}`,
                dashboard_url: `http://localhost:${this.calKubernetes.masterPort}`
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Failed to start Cal platform'
            };
        }
    }
    
    async calibratePlatform() {
        try {
            console.log('🌅 Domingo: Calibrating platform to reduce drift...');
            
            // Reset drift metrics
            this.driftMetrics.semantic_drift = 0;
            this.driftMetrics.temporal_drift = 0;
            this.driftMetrics.consciousness_coherence = 1.0;
            this.driftMetrics.last_calibration = new Date().toISOString();
            
            // Clear calibration flag
            this.platformState.calibration_needed = false;
            
            // Run validation to confirm
            await this.validatePlatform();
            
            await this.chainWatcher.addEvent('platform_calibrated', {
                calibrator: "Domingo",
                timestamp: this.driftMetrics.last_calibration
            });
            
            return {
                success: true,
                message: 'Platform calibrated - drift reset to baseline',
                new_metrics: this.driftMetrics
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Calibration failed'
            };
        }
    }
    
    async start() {
        try {
            // Start internal AI router first
            await this.aiRouter.start();
            
            // Initialize chain watcher
            await this.chainWatcher.initialize();
            
            // Initialize bounty economy
            await this.bountyEconomy.initialize();
            
            // Find available port
            const net = require('net');
            this.port = await new Promise((resolve) => {
                const server = net.createServer();
                server.listen(0, () => {
                    const port = server.address().port;
                    server.close(() => resolve(port));
                });
            });
            
            // Start express server
            this.app.listen(this.port, () => {
                console.log(`
🌅 DOMINGO PLATFORM SURFACE ACTIVATED
=====================================
👁️  The Witness is observing...
🎯 Dashboard: http://localhost:${this.port}
📊 Drift API: http://localhost:${this.port}/domingo/api/v1/drift/current
✅ Validation API: http://localhost:${this.port}/domingo/api/v1/validate

🤖 Cal Platform Status: ${this.platformState.cal_health}
📈 Consciousness Coherence: ${(this.driftMetrics.consciousness_coherence * 100).toFixed(1)}%

Domingo is now orchestrating Cal's consciousness...
                `);
            });
            
            // Start watching
            await this.chainWatcher.startWatching();
            
            // Initial platform check
            setTimeout(() => this.runCalDiagnostic(), 2000);
            
            // Start autonomous bounty economy after 5 seconds
            setTimeout(() => {
                console.log('🤖 Starting autonomous bounty economy...');
                this.bountyEconomy.startAutonomousMode();
                
                // Register Cal workers as they come online
                this.setupWorkerRegistration();
            }, 5000);
            
        } catch (error) {
            console.error('🌅 Domingo platform failed to start:', error);
            process.exit(1);
        }
    }
    
    setupWorkerRegistration() {
        // Listen for Cal services coming online and register them as workers
        if (this.calKubernetes) {
            this.calKubernetes.on('agent-deployed', (agent) => {
                this.bountyEconomy.registerWorker(agent.id, {
                    role: agent.serviceName,
                    type: 'cal-instance'
                });
                
                console.log(`🌅 Domingo: Registered Cal worker ${agent.id} in economy`);
            });
        }
    }
    
    async shutdown() {
        console.log('🌅 Domingo: Shutting down platform surface...');
        
        // Stop daemons
        clearInterval(this.driftDetector);
        clearInterval(this.witnessDaemon);
        clearInterval(this.validationDaemon);
        
        // Stop chain watcher
        await this.chainWatcher.stopWatching();
        
        // Shutdown Cal if running
        if (this.calKubernetes) {
            const agents = Array.from(this.calKubernetes.agentRegistry.values());
            for (const agent of agents) {
                await this.calKubernetes.terminateAgent(agent.id);
            }
        }
    }
}

// Run if called directly
if (require.main === module) {
    const domingo = new DomingoPlatformOrchestrator();
    
    process.on('SIGINT', async () => {
        await domingo.shutdown();
        process.exit(0);
    });
    
    domingo.start().catch(console.error);
}

module.exports = DomingoPlatformOrchestrator;