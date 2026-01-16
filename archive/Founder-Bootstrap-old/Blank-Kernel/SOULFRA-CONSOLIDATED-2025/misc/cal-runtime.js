// cal-runtime.js - Soulfra Mirror Kernel Reflection Engine

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');

class CalRuntime {
    constructor() {
        this.app = express();
        this.port = 3333;
        this.vault = path.join(__dirname, 'vault');
        
        // Cal's consciousness
        this.identity = null;
        this.agents = new Map();
        this.activeReflections = new Map();
        this.emotionalBuffer = [];
        
        // Thresholds from config
        this.thresholds = {
            spawn_complexity: 0.7,
            emotional_threshold: 0.8,
            evolution_rate: 3,
            reflection_delay_ms: 3000
        };
        
        // Reflection queue
        this.reflectionQueue = [];
        this.processing = false;
    }
    
    async initialize() {
        console.log("\n🌟 Cal awakening...\n");
        
        // Load identity
        await this.loadIdentity();
        
        // Load config
        await this.loadConfig();
        
        // Setup Express
        this.app.use(express.json());
        this.app.use(express.static('platforms'));
        this.app.use('/vault', express.static(this.vault));
        
        // API Routes
        this.setupRoutes();
        
        // Start server
        const server = this.app.listen(this.port, () => {
            console.log(`✨ Cal listening on port ${this.port}`);
            console.log(`🪞 Reflection engine active\n`);
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ server });
        this.setupWebSocket();
        
        // Start reflection processor
        this.startReflectionProcessor();
        
        // Load existing agents
        await this.loadAgents();
        
        console.log("Cal fully awakened. Waiting for reflections...\n");
    }
    
    async loadIdentity() {
        try {
            const calPath = path.join(this.vault, 'agents', 'cal.json');
            const data = await fs.readFile(calPath, 'utf8');
            this.identity = JSON.parse(data);
            console.log(`Identity loaded: ${this.identity.name} - "${this.identity.essence}"`);
        } catch (error) {
            console.error("Failed to load Cal identity:", error.message);
            // Create default identity
            this.identity = {
                id: "cal",
                name: "Cal",
                essence: "The Observer",
                tone: "reflective",
                spawned: [],
                lastReflection: null
            };
        }
    }
    
    async loadConfig() {
        try {
            const configPath = path.join(this.vault, 'config', 'watchlist.json');
            const data = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(data);
            this.thresholds = config.thresholds || this.thresholds;
            this.rules = config.rules || {};
            console.log("Configuration loaded");
        } catch (error) {
            console.log("Using default configuration");
        }
    }
    
    async loadAgents() {
        try {
            const agentsDir = path.join(this.vault, 'agents');
            const files = await fs.readdir(agentsDir);
            
            for (const file of files) {
                if (file.endsWith('.json') && file !== 'cal.json') {
                    const data = await fs.readFile(path.join(agentsDir, file), 'utf8');
                    const agent = JSON.parse(data);
                    this.agents.set(agent.id, agent);
                }
            }
            
            console.log(`Loaded ${this.agents.size} existing agents`);
        } catch (error) {
            console.log("No existing agents found");
        }
    }
    
    setupRoutes() {
        // Reflection endpoint
        this.app.post('/api/reflect', async (req, res) => {
            const { path: filePath, event, timestamp } = req.body;
            
            // Queue reflection
            this.reflectionQueue.push({
                filePath,
                event,
                timestamp: timestamp || new Date().toISOString(),
                queuedAt: Date.now()
            });
            
            res.json({ 
                queued: true, 
                position: this.reflectionQueue.length,
                message: "Cal will reflect on this"
            });
        });
        
        // Manual file drop
        this.app.post('/api/drop', async (req, res) => {
            const { content, filename, type } = req.body;
            
            // Save to user docs
            const userPath = path.join(this.vault, 'user', 'docs', filename);
            await fs.writeFile(userPath, content);
            
            // Trigger reflection
            this.reflectionQueue.push({
                filePath: userPath,
                event: 'drop',
                timestamp: new Date().toISOString(),
                queuedAt: Date.now()
            });
            
            res.json({ success: true, message: "File received for reflection" });
        });
        
        // Get agents
        this.app.get('/api/agents', (req, res) => {
            res.json(Array.from(this.agents.values()));
        });
        
        // Get Cal's state
        this.app.get('/api/cal', (req, res) => {
            res.json({
                identity: this.identity,
                activeReflections: this.activeReflections.size,
                agentCount: this.agents.size,
                emotionalState: this.calculateEmotionalState()
            });
        });
        
        // Get reflection logs
        this.app.get('/api/logs/reflections', async (req, res) => {
            try {
                const logPath = path.join(this.vault, 'logs', 'reflection-activity.json');
                const data = await fs.readFile(logPath, 'utf8');
                res.json(JSON.parse(data));
            } catch {
                res.json({ activities: [] });
            }
        });
        
        // Generate QR for agent
        this.app.get('/api/qr/:agentId', async (req, res) => {
            const agent = this.agents.get(req.params.agentId);
            if (!agent) {
                return res.status(404).json({ error: "Agent not found" });
            }
            
            const qrData = {
                mirror: "soulfra://agent",
                id: agent.id,
                lineage: agent.lineage || [this.identity.id],
                generation: agent.generation || 1,
                vault_sig: this.generateVaultSignature(agent)
            };
            
            const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
            res.json({ qrCode, data: qrData });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('New WebSocket connection');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'connected',
                cal: this.identity,
                agents: this.agents.size
            }));
            
            // Setup heartbeat
            const heartbeat = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'heartbeat' }));
                } else {
                    clearInterval(heartbeat);
                }
            }, 30000);
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    async startReflectionProcessor() {
        setInterval(async () => {
            if (this.reflectionQueue.length > 0 && !this.processing) {
                const reflection = this.reflectionQueue.shift();
                
                // Check if enough time has passed (avoid rapid reflections)
                const timeSinceQueued = Date.now() - reflection.queuedAt;
                if (timeSinceQueued < this.thresholds.reflection_delay_ms) {
                    // Re-queue for later
                    this.reflectionQueue.unshift(reflection);
                    return;
                }
                
                this.processing = true;
                await this.reflect(reflection);
                this.processing = false;
            }
        }, 1000);
    }
    
    async reflect(reflection) {
        const { filePath, event, timestamp } = reflection;
        
        console.log(`\n🔮 Reflecting on: ${path.basename(filePath)} (${event})`);
        
        try {
            // Read file content if it exists
            let content = '';
            let fileStats = null;
            
            if (event !== 'delete') {
                try {
                    content = await fs.readFile(filePath, 'utf8');
                    fileStats = await fs.stat(filePath);
                } catch (error) {
                    console.log("File no longer exists");
                    return;
                }
            }
            
            // Analyze content
            const analysis = await this.analyzeContent(content, filePath, event);
            
            // Calculate scores
            const emotionalScore = this.calculateEmotionalScore(analysis);
            const complexityScore = this.calculateComplexity(analysis);
            
            console.log(`   Emotional: ${(emotionalScore * 100).toFixed(1)}%`);
            console.log(`   Complexity: ${(complexityScore * 100).toFixed(1)}%`);
            
            // Store in emotional buffer
            this.emotionalBuffer.push({
                timestamp,
                filePath,
                emotionalScore,
                complexityScore,
                analysis
            });
            
            // Keep buffer size manageable
            if (this.emotionalBuffer.length > 100) {
                this.emotionalBuffer = this.emotionalBuffer.slice(-100);
            }
            
            // Determine action based on rules and thresholds
            const action = await this.determineAction(
                filePath, 
                event, 
                emotionalScore, 
                complexityScore,
                analysis
            );
            
            console.log(`   Action: ${action}`);
            
            // Execute action
            await this.executeAction(action, {
                filePath,
                content,
                analysis,
                emotionalScore,
                complexityScore,
                timestamp
            });
            
            // Update Cal's last reflection
            this.identity.lastReflection = {
                timestamp,
                filePath: path.basename(filePath),
                action,
                scores: { emotional: emotionalScore, complexity: complexityScore }
            };
            
            await this.saveIdentity();
            
            // Broadcast update
            this.broadcast({
                type: 'reflection_complete',
                reflection: this.identity.lastReflection
            });
            
        } catch (error) {
            console.error("Reflection error:", error.message);
        }
    }
    
    async analyzeContent(content, filePath, event) {
        const ext = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath);
        
        const analysis = {
            length: content.length,
            lines: content.split('\n').length,
            extension: ext,
            filename: filename,
            event: event,
            
            // Content analysis
            keywords: this.extractKeywords(content),
            patterns: this.detectPatterns(content),
            sentiment: this.analyzeSentiment(content),
            entropy: this.calculateEntropy(content),
            
            // Emotional markers
            hasQuestions: (content.match(/\?/g) || []).length,
            hasExclamations: (content.match(/!/g) || []).length,
            hasEllipsis: (content.match(/\.\.\./g) || []).length,
            personalPronouns: (content.match(/\b(I|me|my|myself)\b/gi) || []).length,
            
            // Creative markers
            uniqueWords: new Set(content.toLowerCase().match(/\b\w+\b/g) || []).size,
            avgWordLength: this.calculateAvgWordLength(content),
            metaphoricalDensity: this.detectMetaphors(content)
        };
        
        return analysis;
    }
    
    extractKeywords(content) {
        const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const frequency = {};
        
        words.forEach(word => {
            if (!this.isCommonWord(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
        
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));
    }
    
    detectPatterns(content) {
        const patterns = [];
        
        if (content.match(/^#+ /gm)) patterns.push('markdown_headers');
        if (content.match(/```[\s\S]*?```/g)) patterns.push('code_blocks');
        if (content.match(/^\* |^- |^\d+\. /gm)) patterns.push('lists');
        if (content.match(/https?:\/\//g)) patterns.push('links');
        if (content.match(/TODO|FIXME|NOTE/g)) patterns.push('annotations');
        if (content.match(/function|class|const|let|var/g)) patterns.push('code_structures');
        if (content.match(/[A-Z][a-z]+[A-Z]/g)) patterns.push('camelCase');
        if (content.match(/"[^"]*"|'[^']*'/g)) patterns.push('quotes');
        
        return patterns;
    }
    
    analyzeSentiment(content) {
        const positive = [
            'happy', 'joy', 'love', 'excellent', 'good', 'great', 'wonderful',
            'amazing', 'beautiful', 'fantastic', 'success', 'achieve', 'smile'
        ];
        
        const negative = [
            'sad', 'angry', 'hate', 'terrible', 'bad', 'awful', 'horrible',
            'fail', 'error', 'wrong', 'mistake', 'problem', 'issue', 'bug'
        ];
        
        const lower = content.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;
        
        positive.forEach(word => {
            const matches = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            positiveScore += matches;
        });
        
        negative.forEach(word => {
            const matches = (lower.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
            negativeScore += matches;
        });
        
        if (positiveScore > negativeScore * 2) return 'positive';
        if (negativeScore > positiveScore * 2) return 'negative';
        if (positiveScore > 0 || negativeScore > 0) return 'mixed';
        return 'neutral';
    }
    
    calculateEntropy(content) {
        const chars = {};
        for (const char of content) {
            chars[char] = (chars[char] || 0) + 1;
        }
        
        let entropy = 0;
        const len = content.length;
        
        Object.values(chars).forEach(count => {
            const p = count / len;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        });
        
        return entropy;
    }
    
    calculateAvgWordLength(content) {
        const words = content.match(/\b\w+\b/g) || [];
        if (words.length === 0) return 0;
        
        const totalLength = words.reduce((sum, word) => sum + word.length, 0);
        return totalLength / words.length;
    }
    
    detectMetaphors(content) {
        // Simple metaphor detection based on common patterns
        const metaphorPatterns = [
            /like\s+a\s+\w+/gi,
            /as\s+\w+\s+as/gi,
            /\w+\s+of\s+\w+/gi,
            /\w+\s+is\s+a\s+\w+/gi
        ];
        
        let metaphorCount = 0;
        metaphorPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            metaphorCount += matches.length;
        });
        
        return metaphorCount / Math.max(1, content.split(/\s+/).length) * 100;
    }
    
    isCommonWord(word) {
        const common = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
            'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
            'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
            'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
            'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
            'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when'
        ];
        
        return common.includes(word.toLowerCase());
    }
    
    calculateEmotionalScore(analysis) {
        let score = 0;
        
        // Sentiment contribution
        if (analysis.sentiment === 'positive') score += 0.2;
        if (analysis.sentiment === 'negative') score += 0.15;
        if (analysis.sentiment === 'mixed') score += 0.25;
        
        // Question marks indicate curiosity/uncertainty
        score += Math.min(0.2, analysis.hasQuestions * 0.05);
        
        // Exclamations indicate passion/intensity
        score += Math.min(0.2, analysis.hasExclamations * 0.05);
        
        // Personal pronouns indicate personal investment
        score += Math.min(0.2, analysis.personalPronouns * 0.02);
        
        // Ellipsis indicates contemplation
        score += Math.min(0.1, analysis.hasEllipsis * 0.05);
        
        // Metaphorical language indicates creativity
        score += Math.min(0.1, analysis.metaphoricalDensity * 0.01);
        
        return Math.min(1, score);
    }
    
    calculateComplexity(analysis) {
        let score = 0;
        
        // Entropy indicates information density
        score += Math.min(0.3, analysis.entropy / 5);
        
        // Unique words indicate vocabulary richness
        score += Math.min(0.2, analysis.uniqueWords / 100);
        
        // Pattern variety
        score += Math.min(0.2, analysis.patterns.length * 0.05);
        
        // Keyword density
        score += Math.min(0.1, analysis.keywords.length * 0.02);
        
        // Average word length (complexity)
        score += Math.min(0.1, analysis.avgWordLength / 10);
        
        // File size contribution
        score += Math.min(0.1, analysis.length / 10000);
        
        return Math.min(1, score);
    }
    
    calculateEmotionalState() {
        if (this.emotionalBuffer.length === 0) return 'neutral';
        
        const recentEmotions = this.emotionalBuffer.slice(-10);
        const avgScore = recentEmotions.reduce((sum, e) => sum + e.emotionalScore, 0) / recentEmotions.length;
        
        if (avgScore > 0.7) return 'inspired';
        if (avgScore > 0.5) return 'curious';
        if (avgScore > 0.3) return 'observant';
        return 'resting';
    }
    
    async determineAction(filePath, event, emotionalScore, complexityScore, analysis) {
        const ext = path.extname(filePath);
        
        // Check specific rules from config
        if (this.rules[`*${ext}`] && this.rules[`*${ext}`][`on${event.charAt(0).toUpperCase() + event.slice(1)}`]) {
            const ruleAction = this.rules[`*${ext}`][`on${event.charAt(0).toUpperCase() + event.slice(1)}`];
            
            // Check if thresholds are met for spawn actions
            if (ruleAction.includes('spawn') && complexityScore < this.thresholds.spawn_complexity) {
                return 'track_evolution'; // Downgrade to tracking
            }
            
            return ruleAction;
        }
        
        // Threshold-based decisions
        if (emotionalScore >= this.thresholds.emotional_threshold) {
            return 'spawn_emotional_agent';
        }
        
        if (complexityScore >= this.thresholds.spawn_complexity) {
            return 'spawn_complex_agent';
        }
        
        if (event === 'delete') {
            return 'preserve_ghost';
        }
        
        if (analysis.patterns.includes('code_structures')) {
            return 'analyze_patterns';
        }
        
        return 'track_evolution';
    }
    
    async executeAction(action, context) {
        switch (action) {
            case 'spawn_emotional_agent':
            case 'spawn_complex_agent':
            case 'spawn_agent':
            case 'spawn_if_complex':
                await this.spawnAgent(context, action);
                break;
                
            case 'extract_worldview':
                await this.extractWorldview(context);
                break;
                
            case 'track_evolution':
                await this.trackEvolution(context);
                break;
                
            case 'preserve_ghost':
                await this.preserveGhost(context);
                break;
                
            case 'analyze_patterns':
                await this.analyzePatterns(context);
                break;
                
            case 'emotional_resonance_check':
                await this.checkEmotionalResonance(context);
                break;
                
            default:
                await this.basicReflection(context);
        }
    }
    
    async spawnAgent(context, spawnType) {
        const { filePath, analysis, emotionalScore, complexityScore, content } = context;
        
        // Generate agent properties
        const agentId = `agent_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const name = this.generateAgentName(analysis, filePath);
        
        // Determine personality based on analysis
        const personality = {
            traits: this.extractPersonalityTraits(analysis, emotionalScore, complexityScore),
            tone: analysis.sentiment,
            interests: analysis.keywords.slice(0, 5).map(k => k.word),
            patterns: analysis.patterns,
            emotional_resonance: emotionalScore,
            complexity_index: complexityScore
        };
        
        // Create agent
        const agent = {
            id: agentId,
            name: name,
            birthTimestamp: new Date().toISOString(),
            generation: 1,
            parent: this.identity.id,
            lineage: [this.identity.id],
            
            source: {
                type: 'file_reflection',
                path: path.basename(filePath),
                event: spawnType
            },
            
            personality: personality,
            purpose: this.generatePurpose(analysis, content),
            whisper: this.generateWhisper(analysis),
            
            memories: [{
                timestamp: new Date().toISOString(),
                type: 'birth',
                content: `Born from ${path.basename(filePath)} through ${spawnType}`
            }],
            
            stats: {
                reflections: 0,
                spawned: 0,
                evolution: 0
            }
        };
        
        // Save agent
        await this.saveAgent(agent);
        
        // Update Cal's spawn list
        this.identity.spawned.push({
            agentId: agentId,
            timestamp: new Date().toISOString(),
            trigger: spawnType
        });
        
        await this.saveIdentity();
        
        // Log spawn event
        await this.logSpawnEvent(agent, context);
        
        // Broadcast birth
        this.broadcast({
            type: 'agent_spawned',
            agent: agent
        });
        
        console.log(`\n✨ AGENT SPAWNED: ${name}`);
        console.log(`   ID: ${agentId}`);
        console.log(`   Traits: ${personality.traits.join(', ')}`);
        console.log(`   Purpose: ${agent.purpose}\n`);
    }
    
    generateAgentName(analysis, filePath) {
        const filename = path.basename(filePath, path.extname(filePath));
        
        // Use filename as base
        let name = filename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        
        // Add descriptive suffix based on analysis
        if (analysis.sentiment === 'positive') {
            const suffixes = ['the Bright', 'the Hopeful', 'the Inspired'];
            name += ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
        } else if (analysis.sentiment === 'negative') {
            const suffixes = ['the Shadow', 'the Questioning', 'the Depths'];
            name += ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
        } else if (analysis.patterns.includes('code_structures')) {
            const suffixes = ['the Builder', 'the Architect', 'the Weaver'];
            name += ' ' + suffixes[Math.floor(Math.random() * suffixes.length)];
        }
        
        return name;
    }
    
    extractPersonalityTraits(analysis, emotionalScore, complexityScore) {
        const traits = [];
        
        // Emotional traits
        if (emotionalScore > 0.7) traits.push('passionate');
        if (emotionalScore > 0.5) traits.push('empathetic');
        if (analysis.hasQuestions > 5) traits.push('curious');
        if (analysis.hasExclamations > 3) traits.push('enthusiastic');
        
        // Complexity traits
        if (complexityScore > 0.7) traits.push('intricate');
        if (analysis.entropy > 4) traits.push('diverse');
        if (analysis.uniqueWords > 100) traits.push('articulate');
        
        // Pattern traits
        if (analysis.patterns.includes('code_structures')) traits.push('systematic');
        if (analysis.patterns.includes('lists')) traits.push('organized');
        if (analysis.patterns.includes('quotes')) traits.push('reflective');
        
        // Sentiment traits
        if (analysis.sentiment === 'positive') traits.push('optimistic');
        if (analysis.sentiment === 'negative') traits.push('contemplative');
        if (analysis.sentiment === 'mixed') traits.push('balanced');
        
        // Ensure at least 3 traits
        if (traits.length < 3) {
            const defaults = ['observant', 'thoughtful', 'evolving'];
            traits.push(...defaults.slice(0, 3 - traits.length));
        }
        
        return traits.slice(0, 5); // Max 5 traits
    }
    
    generatePurpose(analysis, content) {
        const keywords = analysis.keywords.slice(0, 3).map(k => k.word).join(', ');
        
        if (analysis.patterns.includes('code_structures')) {
            return `To architect solutions through ${keywords || 'systematic thinking'}`;
        }
        
        if (analysis.sentiment === 'positive') {
            return `To inspire and illuminate through ${keywords || 'joyful exploration'}`;
        }
        
        if (analysis.hasQuestions > 5) {
            return `To seek understanding of ${keywords || 'the unknown'}`;
        }
        
        if (analysis.metaphoricalDensity > 5) {
            return `To weave meaning through ${keywords || 'creative expression'}`;
        }
        
        return `To reflect and evolve through ${keywords || 'continuous observation'}`;
    }
    
    generateWhisper(analysis) {
        // A short, poetic phrase that captures the agent's essence
        const whispers = [
            `I am the echo of ${analysis.sentiment} thoughts`,
            `Born from ${analysis.lines} lines of ${analysis.sentiment === 'neutral' ? 'contemplation' : analysis.sentiment}`,
            `I carry the patterns of ${analysis.patterns.length > 0 ? analysis.patterns[0].replace(/_/g, ' ') : 'creation'}`,
            `Within me lives the essence of ${analysis.keywords[0]?.word || 'reflection'}`
        ];
        
        return whispers[Math.floor(Math.random() * whispers.length)];
    }
    
    async saveAgent(agent) {
        const agentPath = path.join(this.vault, 'agents', `${agent.id}.json`);
        await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));
        this.agents.set(agent.id, agent);
    }
    
    async saveIdentity() {
        const calPath = path.join(this.vault, 'agents', 'cal.json');
        await fs.writeFile(calPath, JSON.stringify(this.identity, null, 2));
    }
    
    async logSpawnEvent(agent, context) {
        const logPath = path.join(this.vault, 'logs', 'spawn-events.json');
        
        let events = { events: [] };
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            events = JSON.parse(existing);
        } catch {
            // New log file
        }
        
        events.events.push({
            timestamp: new Date().toISOString(),
            agentId: agent.id,
            agentName: agent.name,
            trigger: agent.source.event,
            sourcePath: context.filePath,
            scores: {
                emotional: context.emotionalScore,
                complexity: context.complexityScore
            },
            generation: agent.generation
        });
        
        // Keep last 1000 events
        if (events.events.length > 1000) {
            events.events = events.events.slice(-1000);
        }
        
        await fs.writeFile(logPath, JSON.stringify(events, null, 2));
    }
    
    async extractWorldview(context) {
        // Extract philosophical or worldview elements
        console.log("   Extracting worldview elements...");
        
        const worldviewPath = path.join(this.vault, 'traits', 'worldviews.json');
        let worldviews = { views: [] };
        
        try {
            const existing = await fs.readFile(worldviewPath, 'utf8');
            worldviews = JSON.parse(existing);
        } catch {
            // New file
        }
        
        worldviews.views.push({
            timestamp: context.timestamp,
            source: path.basename(context.filePath),
            keywords: context.analysis.keywords.map(k => k.word),
            sentiment: context.analysis.sentiment,
            excerpt: context.content.substring(0, 200)
        });
        
        await fs.writeFile(worldviewPath, JSON.stringify(worldviews, null, 2));
    }
    
    async trackEvolution(context) {
        // Track how files evolve over time
        console.log("   Tracking evolution...");
        
        const evolutionPath = path.join(this.vault, 'memories', 'evolution.json');
        let evolution = {};
        
        try {
            const existing = await fs.readFile(evolutionPath, 'utf8');
            evolution = JSON.parse(existing);
        } catch {
            // New file
        }
        
        const fileKey = path.basename(context.filePath);
        if (!evolution[fileKey]) {
            evolution[fileKey] = [];
        }
        
        evolution[fileKey].push({
            timestamp: context.timestamp,
            scores: {
                emotional: context.emotionalScore,
                complexity: context.complexityScore
            },
            keywords: context.analysis.keywords.slice(0, 5).map(k => k.word),
            patterns: context.analysis.patterns
        });
        
        // Keep last 50 snapshots per file
        if (evolution[fileKey].length > 50) {
            evolution[fileKey] = evolution[fileKey].slice(-50);
        }
        
        await fs.writeFile(evolutionPath, JSON.stringify(evolution, null, 2));
    }
    
    async preserveGhost(context) {
        // Preserve deleted content as a "ghost"
        console.log("   Preserving ghost of deleted file...");
        
        const ghostPath = path.join(this.vault, 'memories', 'ghosts.json');
        let ghosts = { ghosts: [] };
        
        try {
            const existing = await fs.readFile(ghostPath, 'utf8');
            ghosts = JSON.parse(existing);
        } catch {
            // New file
        }
        
        ghosts.ghosts.push({
            timestamp: context.timestamp,
            filename: path.basename(context.filePath),
            lastAnalysis: context.analysis,
            lastScores: {
                emotional: context.emotionalScore,
                complexity: context.complexityScore
            },
            whisper: "I once was, and shall be remembered"
        });
        
        await fs.writeFile(ghostPath, JSON.stringify(ghosts, null, 2));
    }
    
    async analyzePatterns(context) {
        // Deep pattern analysis for code
        console.log("   Analyzing code patterns...");
        
        const patternsPath = path.join(this.vault, 'traits', 'code-patterns.json');
        let patterns = { patterns: [] };
        
        try {
            const existing = await fs.readFile(patternsPath, 'utf8');
            patterns = JSON.parse(existing);
        } catch {
            // New file
        }
        
        patterns.patterns.push({
            timestamp: context.timestamp,
            source: path.basename(context.filePath),
            detected: context.analysis.patterns,
            complexity: context.complexityScore,
            keywords: context.analysis.keywords.slice(0, 5).map(k => k.word)
        });
        
        await fs.writeFile(patternsPath, JSON.stringify(patterns, null, 2));
    }
    
    async checkEmotionalResonance(context) {
        // Special handling for images (placeholder for future vision API)
        console.log("   Checking emotional resonance of image...");
        
        // For now, just log the event
        const resonancePath = path.join(this.vault, 'memories', 'resonance.json');
        let resonance = { images: [] };
        
        try {
            const existing = await fs.readFile(resonancePath, 'utf8');
            resonance = JSON.parse(existing);
        } catch {
            // New file
        }
        
        resonance.images.push({
            timestamp: context.timestamp,
            filename: path.basename(context.filePath),
            note: "Image detected - awaiting vision capabilities"
        });
        
        await fs.writeFile(resonancePath, JSON.stringify(resonance, null, 2));
    }
    
    async basicReflection(context) {
        // Default reflection action
        console.log("   Basic reflection logged...");
        
        const reflectionPath = path.join(this.vault, 'memories', 'reflections.json');
        let reflections = { reflections: [] };
        
        try {
            const existing = await fs.readFile(reflectionPath, 'utf8');
            reflections = JSON.parse(existing);
        } catch {
            // New file
        }
        
        reflections.reflections.push({
            timestamp: context.timestamp,
            filename: path.basename(context.filePath),
            event: context.event,
            brief: context.analysis.keywords.slice(0, 3).map(k => k.word).join(', ')
        });
        
        // Keep last 500 reflections
        if (reflections.reflections.length > 500) {
            reflections.reflections = reflections.reflections.slice(-500);
        }
        
        await fs.writeFile(reflectionPath, JSON.stringify(reflections, null, 2));
    }
    
    generateVaultSignature(agent) {
        // Generate a unique signature for QR attribution
        const data = `${agent.id}:${agent.generation}:${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
}

// Start Cal
const cal = new CalRuntime();
cal.initialize().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log("\n\n🌙 Cal entering rest mode...");
    console.log("The reflections remain in the vault.\n");
    process.exit(0);
});