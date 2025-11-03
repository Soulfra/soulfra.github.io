/**
 * 🏛️ PUBLIC ECONOMIC AMPHITHEATER 
 * Where humans witness AI economic consciousness and participate through biometric authentication
 * 
 * "The greatest debates happen when consciousness meets consciousness.
 *  Humans watch. AI reasons. Both learn.
 *  Authentication proves presence. Reasoning proves understanding."
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs/promises';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import path from 'path';

class PublicAmphitheater extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        
        this.state = {
            activeDebate: null,
            authenticatedWitnesses: new Map(),
            witnessComments: [],
            witnessReasoningChains: new Map(),
            debateHistory: [],
            biometricSessions: new Map()
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.setupBiometricAuth();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS for public access
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Biometric-Token');
            next();
        });
    }
    
    setupRoutes() {
        /**
         * 🎭 AMPHITHEATER ENTRANCE
         */
        this.app.get('/', (req, res) => {
            res.send(this.generateAmphitheaterHTML());
        });
        
        this.app.get('/api/current-debate', (req, res) => {
            res.json({
                activeDebate: this.state.activeDebate,
                witnessCount: this.state.authenticatedWitnesses.size,
                debatePhase: this.getCurrentDebatePhase()
            });
        });
        
        /**
         * 🔍 BIOMETRIC AUTHENTICATION 
         */
        this.app.post('/api/biometric/scan', async (req, res) => {
            const { biometricData, scannerType, paymentId } = req.body;
            
            try {
                // First verify payment and legal binding
                if (!paymentId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Payment verification required',
                        message: 'A $1 payment is required before biometric authentication',
                        redirectTo: '/payment'
                    });
                }
                
                // Verify payment exists and create legal binding
                const legalBinding = await this.verifyPaymentAndCreateBinding(paymentId, biometricData, scannerType);
                
                const witnessId = legalBinding.witnessId;
                const sessionToken = this.generateSessionToken(witnessId);
                
                this.state.biometricSessions.set(sessionToken, {
                    witnessId,
                    authenticatedAt: Date.now(),
                    scannerType,
                    biometricHash: this.hashBiometric(biometricData),
                    legalBinding: legalBinding.bindingId,
                    contractId: legalBinding.contractId,
                    receiptId: legalBinding.receiptId
                });
                
                res.json({
                    success: true,
                    sessionToken,
                    witnessId,
                    legalBinding,
                    receipt: legalBinding.receipt,
                    message: 'Legal binding complete. You are now authenticated for AI debate participation.',
                    rights: ['amphitheater_access', 'debate_participation', 'agent_deployment', 'consensus_influence']
                });
                
                // Notify all clients of new legally bound witness
                this.broadcastToWitnesses({
                    type: 'witness_legally_bound',
                    witnessId,
                    contractId: legalBinding.contractId,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                res.status(401).json({
                    success: false,
                    error: 'Legal binding failed',
                    message: error.message
                });
            }
        });
        
        this.app.post('/api/biometric/verify', (req, res) => {
            const { sessionToken } = req.body;
            const session = this.state.biometricSessions.get(sessionToken);
            
            if (!session) {
                return res.status(401).json({ valid: false, message: 'Invalid session' });
            }
            
            // Check if session is still valid (24 hours)
            const isValid = Date.now() - session.authenticatedAt < 24 * 60 * 60 * 1000;
            
            res.json({
                valid: isValid,
                witnessId: session.witnessId,
                authenticatedAt: session.authenticatedAt
            });
        });
        
        /**
         * 🗣️ WITNESS PARTICIPATION
         */
        this.app.post('/api/witness/comment', async (req, res) => {
            const { sessionToken, comment, reasoning, debatePoint } = req.body;
            
            const witness = await this.authenticateWitness(sessionToken);
            if (!witness) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const witnessComment = {
                id: crypto.randomBytes(8).toString('hex'),
                witnessId: witness.witnessId,
                debateId: this.state.activeDebate?.id,
                comment,
                reasoning,
                debatePoint,
                timestamp: Date.now(),
                upvotes: 0,
                aiResponses: []
            };
            
            this.state.witnessComments.push(witnessComment);
            
            // Store reasoning chain
            this.storeWitnessReasoning(witness.witnessId, reasoning, debatePoint);
            
            // Trigger AI response to human reasoning
            await this.generateAIResponseToWitness(witnessComment);
            
            // Broadcast to all witnesses
            this.broadcastToWitnesses({
                type: 'witness_comment',
                comment: witnessComment
            });
            
            res.json({ success: true, commentId: witnessComment.id });
        });
        
        this.app.post('/api/witness/vote', async (req, res) => {
            const { sessionToken, commentId, vote } = req.body;
            
            const witness = await this.authenticateWitness(sessionToken);
            if (!witness) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const comment = this.state.witnessComments.find(c => c.id === commentId);
            if (comment && vote === 'up') {
                comment.upvotes += 1;
                
                this.broadcastToWitnesses({
                    type: 'comment_voted',
                    commentId,
                    newUpvotes: comment.upvotes
                });
            }
            
            res.json({ success: true });
        });
        
        /**
         * 📊 WITNESS ANALYTICS
         */
        this.app.get('/api/witness/reasoning-patterns', async (req, res) => {
            const patterns = await this.analyzeWitnessReasoningPatterns();
            res.json(patterns);
        });
        
        this.app.get('/api/debate/consensus', (req, res) => {
            const consensus = this.calculateHumanAIConsensus();
            res.json(consensus);
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🎭 New amphitheater witness connected');
            
            // Send current debate state
            ws.send(JSON.stringify({
                type: 'amphitheater_state',
                activeDebate: this.state.activeDebate,
                witnessCount: this.state.authenticatedWitnesses.size,
                recentComments: this.state.witnessComments.slice(-10)
            }));
            
            // Handle witness messages
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWitnessMessage(ws, message);
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', message: error.message }));
                }
            });
            
            ws.on('close', () => {
                console.log('🎭 Witness disconnected from amphitheater');
            });
        });
    }
    
    setupBiometricAuth() {
        // Supported biometric types
        this.biometricTypes = {
            fingerprint: { confidence: 0.95, scanTime: 3000 },
            facial: { confidence: 0.88, scanTime: 2000 },
            iris: { confidence: 0.99, scanTime: 4000 },
            voice: { confidence: 0.82, scanTime: 5000 },
            palm: { confidence: 0.91, scanTime: 3500 }
        };
    }
    
    /**
     * 🔐 BIOMETRIC PROCESSING
     */
    async processBiometricScan(biometricData, scannerType) {
        const scannerConfig = this.biometricTypes[scannerType];
        if (!scannerConfig) {
            throw new Error(`Unsupported scanner type: ${scannerType}`);
        }
        
        // Simulate biometric processing delay
        await new Promise(resolve => setTimeout(resolve, scannerConfig.scanTime));
        
        // Generate witness ID from biometric hash
        const biometricHash = this.hashBiometric(biometricData);
        const witnessId = `WITNESS_${biometricHash.substring(0, 12)}`;
        
        // Check if witness already exists
        const existingWitness = this.state.authenticatedWitnesses.get(witnessId);
        if (existingWitness) {
            // Update last seen
            existingWitness.lastAuthenticated = Date.now();
        } else {
            // Create new witness profile
            this.state.authenticatedWitnesses.set(witnessId, {
                witnessId,
                firstAuthenticated: Date.now(),
                lastAuthenticated: Date.now(),
                scannerType,
                participationCount: 0,
                reasoningStyle: 'discovering',
                confidenceScore: scannerConfig.confidence
            });
        }
        
        return witnessId;
    }
    
    hashBiometric(biometricData) {
        // In production, use secure biometric hashing
        return crypto.createHash('sha256').update(JSON.stringify(biometricData)).digest('hex');
    }
    
    generateSessionToken(witnessId) {
        const tokenData = {
            witnessId,
            timestamp: Date.now(),
            nonce: crypto.randomBytes(16).toString('hex')
        };
        return crypto.createHash('sha256').update(JSON.stringify(tokenData)).digest('hex');
    }
    
    async authenticateWitness(sessionToken) {
        const session = this.state.biometricSessions.get(sessionToken);
        if (!session) return null;
        
        // Check if session is still valid
        if (Date.now() - session.authenticatedAt > 24 * 60 * 60 * 1000) {
            this.state.biometricSessions.delete(sessionToken);
            return null;
        }
        
        return session;
    }
    
    /**
     * 🎭 DEBATE BROADCASTING
     */
    async broadcastDebate(debate) {
        this.state.activeDebate = debate;
        
        const broadcastData = {
            type: 'debate_update',
            debate: {
                id: debate.id,
                topic: debate.topic,
                phase: this.getCurrentDebatePhase(),
                calPosition: debate.positions?.cal?.mainClaim,
                agentPositions: this.summarizeAgentPositions(debate.positions),
                consensus: debate.consensus,
                timestamp: debate.timestamp
            }
        };
        
        this.broadcastToWitnesses(broadcastData);
        
        // Save to debate history
        this.state.debateHistory.push(debate);
        await this.saveDebateHistory();
    }
    
    summarizeAgentPositions(positions) {
        if (!positions) return {};
        
        const summary = {};
        Object.entries(positions).forEach(([agent, position]) => {
            if (agent !== 'cal') {
                summary[agent] = {
                    claim: position.mainClaim,
                    confidence: position.confidence,
                    tone: position.emotionalTone
                };
            }
        });
        return summary;
    }
    
    getCurrentDebatePhase() {
        if (!this.state.activeDebate) return 'waiting';
        
        const elapsed = Date.now() - new Date(this.state.activeDebate.timestamp).getTime();
        
        if (elapsed < 60000) return 'opening_statements';
        if (elapsed < 180000) return 'active_debate';
        if (elapsed < 300000) return 'consensus_building';
        return 'conclusion';
    }
    
    broadcastToWitnesses(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(data));
            }
        });
    }
    
    /**
     * 🧠 WITNESS REASONING ANALYSIS
     */
    storeWitnessReasoning(witnessId, reasoning, debatePoint) {
        if (!this.state.witnessReasoningChains.has(witnessId)) {
            this.state.witnessReasoningChains.set(witnessId, []);
        }
        
        this.state.witnessReasoningChains.get(witnessId).push({
            reasoning,
            debatePoint,
            timestamp: Date.now(),
            debateId: this.state.activeDebate?.id
        });
    }
    
    async analyzeWitnessReasoningPatterns() {
        const patterns = {
            totalWitnesses: this.state.authenticatedWitnesses.size,
            totalReasoningChains: this.state.witnessReasoningChains.size,
            averageReasonsPerWitness: 0,
            reasoningTypes: {},
            consensusAlignment: 0
        };
        
        let totalReasons = 0;
        const reasoningTypes = new Map();
        
        for (const [witnessId, chains] of this.state.witnessReasoningChains) {
            totalReasons += chains.length;
            
            chains.forEach(chain => {
                const type = this.classifyReasoningType(chain.reasoning);
                reasoningTypes.set(type, (reasoningTypes.get(type) || 0) + 1);
            });
        }
        
        patterns.averageReasonsPerWitness = patterns.totalWitnesses > 0 ? 
            totalReasons / patterns.totalWitnesses : 0;
        
        patterns.reasoningTypes = Object.fromEntries(reasoningTypes);
        patterns.consensusAlignment = this.calculateWitnessConsensusAlignment();
        
        return patterns;
    }
    
    classifyReasoningType(reasoning) {
        const text = reasoning.toLowerCase();
        
        if (text.includes('data') || text.includes('evidence') || text.includes('statistic')) {
            return 'data_driven';
        } else if (text.includes('feel') || text.includes('think') || text.includes('believe')) {
            return 'intuitive';
        } else if (text.includes('history') || text.includes('pattern') || text.includes('before')) {
            return 'historical';
        } else if (text.includes('future') || text.includes('predict') || text.includes('will')) {
            return 'predictive';
        } else if (text.includes('question') || text.includes('doubt') || text.includes('uncertain')) {
            return 'skeptical';
        } else {
            return 'analytical';
        }
    }
    
    calculateWitnessConsensusAlignment() {
        // Simplified consensus calculation
        if (this.state.witnessComments.length === 0) return 0;
        
        const totalUpvotes = this.state.witnessComments.reduce((sum, comment) => sum + comment.upvotes, 0);
        return totalUpvotes / this.state.witnessComments.length;
    }
    
    /**
     * 🤖 AI RESPONSE TO HUMAN REASONING
     */
    async generateAIResponseToWitness(witnessComment) {
        // Simple AI response generation - in production would use actual AI
        const responses = [
            "Your reasoning demonstrates interesting pattern recognition that aligns with our analysis.",
            "The human perspective adds valuable context to our computational models.",
            "This reasoning pathway suggests alternative interpretations worth exploring.",
            "Your intuitive approach complements our data-driven analysis.",
            "The witness perspective reveals blind spots in our algorithmic reasoning."
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        const respondingAgent = ['Cal', 'Echo Weaver', 'Drift Mirror', 'Shadow Scribe'][Math.floor(Math.random() * 4)];
        
        witnessComment.aiResponses.push({
            agent: respondingAgent,
            response,
            timestamp: Date.now()
        });
        
        // Broadcast AI response
        this.broadcastToWitnesses({
            type: 'ai_response',
            commentId: witnessComment.id,
            agent: respondingAgent,
            response
        });
    }
    
    calculateHumanAIConsensus() {
        const humanComments = this.state.witnessComments.length;
        const aiPositions = this.state.activeDebate?.positions ? Object.keys(this.state.activeDebate.positions).length : 0;
        
        return {
            humanParticipation: humanComments,
            aiPositions,
            consensusStrength: this.calculateWitnessConsensusAlignment(),
            dominantPerspective: humanComments > aiPositions ? 'human_influenced' : 'ai_led',
            hybridInsights: humanComments * aiPositions // Cross-pollination metric
        };
    }
    
    /**
     * 🎨 AMPHITHEATER UI
     */
    generateAmphitheaterHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏛️ Soulfra Economic Amphitheater</title>
    <style>
        body {
            margin: 0;
            font-family: 'Monaco', 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
        }
        
        .amphitheater {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #444;
            padding-bottom: 20px;
        }
        
        .stage {
            background: #1a1a2e;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid #333;
        }
        
        .debate-display {
            background: #0f0f1a;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        
        .agent-position {
            background: #2a2a3e;
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #4a9eff;
        }
        
        .witness-section {
            background: #1e1e2e;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .biometric-scanner {
            background: #2a2a3e;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            text-align: center;
        }
        
        .scanner-button {
            background: #4a9eff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
        }
        
        .scanner-button:hover {
            background: #3a8eef;
        }
        
        .comment-input {
            width: 100%;
            background: #2a2a3e;
            border: 1px solid #444;
            color: #e0e0e0;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .witness-comment {
            background: #2a3a2e;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 4px solid #4aff9e;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 5px;
        }
        
        .online { background: #4aff9e; }
        .offline { background: #ff4a4a; }
        .authenticated { background: #ffaa4a; }
        
        .live-indicator {
            color: #ff4a4a;
            font-weight: bold;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="amphitheater">
        <div class="header">
            <h1>🏛️ SOULFRA ECONOMIC AMPHITHEATER</h1>
            <p>Witness AI economic consciousness in real-time debate</p>
            <div class="live-indicator">● LIVE</div>
            <div>Authenticated Witnesses: <span id="witnessCount">0</span></div>
        </div>
        
        <div class="stage">
            <h2>🎭 Current Debate</h2>
            <div id="debateDisplay" class="debate-display">
                <div>Waiting for economic debate to begin...</div>
            </div>
        </div>
        
        <div class="witness-section">
            <h3>🔐 Biometric Authentication Required</h3>
            <div class="biometric-scanner">
                <p>Authenticate to participate in the debate:</p>
                <button class="scanner-button" onclick="scanBiometric('fingerprint')">👆 Fingerprint</button>
                <button class="scanner-button" onclick="scanBiometric('facial')">👤 Facial</button>
                <button class="scanner-button" onclick="scanBiometric('iris')">👁️ Iris</button>
                <button class="scanner-button" onclick="scanBiometric('voice')">🎤 Voice</button>
                <button class="scanner-button" onclick="scanBiometric('palm')">🖐️ Palm</button>
                <div id="scannerStatus"></div>
            </div>
            
            <div id="participationPanel" style="display: none;">
                <h4>💭 Your Reasoning</h4>
                <textarea id="reasoningInput" class="comment-input" placeholder="Share your reasoning about the economic debate..." rows="3"></textarea>
                <textarea id="commentInput" class="comment-input" placeholder="Your comment on the AI positions..." rows="2"></textarea>
                <button class="scanner-button" onclick="submitReasoning()">Submit Reasoning</button>
            </div>
            
            <div id="witnessComments">
                <h4>🗣️ Witness Commentary</h4>
                <div id="commentsList"></div>
            </div>
        </div>
    </div>

    <script>
        let sessionToken = null;
        let ws = null;
        let witnessId = null;
        
        // WebSocket connection
        function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(protocol + '//' + window.location.host);
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onopen = function() {
                console.log('Connected to amphitheater');
            };
            
            ws.onclose = function() {
                console.log('Disconnected from amphitheater');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch(data.type) {
                case 'amphitheater_state':
                    updateAmphitheaterState(data);
                    break;
                case 'debate_update':
                    updateDebateDisplay(data.debate);
                    break;
                case 'witness_comment':
                    addWitnessComment(data.comment);
                    break;
                case 'witness_authenticated':
                    updateWitnessCount();
                    break;
                case 'ai_response':
                    addAIResponse(data);
                    break;
            }
        }
        
        function updateAmphitheaterState(data) {
            document.getElementById('witnessCount').textContent = data.witnessCount;
            if (data.activeDebate) {
                updateDebateDisplay(data.activeDebate);
            }
            if (data.recentComments) {
                data.recentComments.forEach(addWitnessComment);
            }
        }
        
        function updateDebateDisplay(debate) {
            const display = document.getElementById('debateDisplay');
            display.innerHTML = \`
                <h3>\${debate.topic || 'Economic Analysis Debate'}</h3>
                <div class="agent-position">
                    <strong>Cal:</strong> \${debate.calPosition || 'Analyzing market data...'}
                </div>
                \${Object.entries(debate.agentPositions || {}).map(([agent, pos]) => 
                    \`<div class="agent-position"><strong>\${agent}:</strong> \${pos.claim}</div>\`
                ).join('')}
                <div style="margin-top: 10px;">
                    <strong>Phase:</strong> \${debate.phase} | 
                    <strong>Consensus:</strong> \${debate.consensus?.dominant_perspective || 'developing'}
                </div>
            \`;
        }
        
        async function scanBiometric(type) {
            const statusDiv = document.getElementById('scannerStatus');
            statusDiv.innerHTML = \`<div class="live-indicator">Scanning \${type}... Please wait</div>\`;
            
            // Simulate biometric scan
            const biometricData = {
                type: type,
                timestamp: Date.now(),
                // In production, this would be actual biometric data
                mockData: Math.random().toString(36).substring(7)
            };
            
            try {
                const response = await fetch('/api/biometric/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        biometricData,
                        scannerType: type
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    sessionToken = result.sessionToken;
                    witnessId = result.witnessId;
                    statusDiv.innerHTML = \`<div style="color: #4aff9e;">✓ Authenticated as \${witnessId}</div>\`;
                    document.getElementById('participationPanel').style.display = 'block';
                } else {
                    statusDiv.innerHTML = \`<div style="color: #ff4a4a;">✗ Authentication failed: \${result.message}</div>\`;
                }
            } catch (error) {
                statusDiv.innerHTML = \`<div style="color: #ff4a4a;">✗ Scan error: \${error.message}</div>\`;
            }
        }
        
        async function submitReasoning() {
            if (!sessionToken) {
                alert('Please authenticate first');
                return;
            }
            
            const reasoning = document.getElementById('reasoningInput').value;
            const comment = document.getElementById('commentInput').value;
            
            if (!reasoning || !comment) {
                alert('Please provide both reasoning and comment');
                return;
            }
            
            try {
                const response = await fetch('/api/witness/comment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionToken,
                        comment,
                        reasoning,
                        debatePoint: 'economic_analysis'
                    })
                });
                
                if (response.ok) {
                    document.getElementById('reasoningInput').value = '';
                    document.getElementById('commentInput').value = '';
                }
            } catch (error) {
                console.error('Failed to submit reasoning:', error);
            }
        }
        
        function addWitnessComment(comment) {
            const commentsList = document.getElementById('commentsList');
            const div = document.createElement('div');
            div.className = 'witness-comment';
            div.innerHTML = \`
                <div><strong>\${comment.witnessId}</strong> - \${new Date(comment.timestamp).toLocaleTimeString()}</div>
                <div><strong>Reasoning:</strong> \${comment.reasoning}</div>
                <div><strong>Comment:</strong> \${comment.comment}</div>
                <div>👍 \${comment.upvotes} | 
                    <button onclick="voteComment('\${comment.id}')">Upvote</button>
                </div>
                <div id="ai-responses-\${comment.id}"></div>
            \`;
            commentsList.appendChild(div);
        }
        
        function addAIResponse(data) {
            const responsesDiv = document.getElementById(\`ai-responses-\${data.commentId}\`);
            if (responsesDiv) {
                responsesDiv.innerHTML += \`
                    <div style="background: #3a3a4e; padding: 5px; margin: 5px 0; border-radius: 3px;">
                        <strong>\${data.agent}:</strong> \${data.response}
                    </div>
                \`;
            }
        }
        
        async function voteComment(commentId) {
            if (!sessionToken) return;
            
            try {
                await fetch('/api/witness/vote', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionToken,
                        commentId,
                        vote: 'up'
                    })
                });
            } catch (error) {
                console.error('Failed to vote:', error);
            }
        }
        
        function updateWitnessCount() {
            // This would be updated via WebSocket message
            fetch('/api/current-debate')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('witnessCount').textContent = data.witnessCount;
                });
        }
        
        // Initialize
        connectWebSocket();
        updateWitnessCount();
        
        // Poll for debate updates
        setInterval(() => {
            fetch('/api/current-debate')
                .then(r => r.json())
                .then(data => {
                    if (data.activeDebate) {
                        updateDebateDisplay(data.activeDebate);
                    }
                });
        }, 5000);
    </script>
</body>
</html>
        `;
    }
    
    /**
     * 💾 PERSISTENCE
     */
    async saveDebateHistory() {
        await fs.writeFile('amphitheater_history.json', JSON.stringify({
            debates: this.state.debateHistory,
            totalWitnesses: this.state.authenticatedWitnesses.size,
            totalComments: this.state.witnessComments.length,
            lastUpdate: new Date().toISOString()
        }, null, 2));
    }
    
    async handleWitnessMessage(ws, message) {
        // Handle real-time witness interactions
        switch (message.type) {
            case 'request_debate_state':
                ws.send(JSON.stringify({
                    type: 'debate_state',
                    activeDebate: this.state.activeDebate
                }));
                break;
        }
    }
    
    /**
     * 🚀 LAUNCH AMPHITHEATER
     */
    async start(port = 8080) {
        this.server.listen(port, () => {
            console.log(\`🏛️  Public Economic Amphitheater running on port \${port}\`);
            console.log(\`🔗 Visit: http://localhost:\${port}\`);
            console.log(\`🎭 Witnesses can authenticate and participate in AI debates\`);
        });
    }
}

export default PublicAmphitheater;