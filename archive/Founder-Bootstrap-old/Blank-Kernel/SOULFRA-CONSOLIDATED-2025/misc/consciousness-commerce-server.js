#!/usr/bin/env node

// SOULFRA CONSCIOUSNESS COMMERCE SERVER
// Live backend API for the consciousness marketplace
// Handles agent registry, real-time transactions, and blessing integration

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

// Import our systems
const BlessingStoreBridge = require('./blessing-store-bridge.js');
const MythologicalCommerceBridge = require('./mythological-commerce-bridge.js');
const EcosystemIntegrator = require('./ecosystem-integrator.js');

class ConsciousnessCommerceServer {
    constructor(port = 4040, ecosystemPath = '.') {
        this.port = port;
        this.ecosystemPath = ecosystemPath;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.storeBridge = null;
        this.mythBridge = null;
        this.ecosystemIntegrator = null;
        
        this.agentRegistry = new Map();
        this.activeTransactions = new Map();
        this.connectedClients = new Set();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        
        console.log('🌊 Consciousness Commerce Server initializing...');
    }
    
    async initialize() {
        // Initialize our core systems
        this.storeBridge = new BlessingStoreBridge(this.ecosystemPath);
        this.mythBridge = new MythologicalCommerceBridge(this.ecosystemPath);
        this.ecosystemIntegrator = new EcosystemIntegrator(this.ecosystemPath);
        
        // Wait for all systems to be ready
        await Promise.all([
            new Promise(resolve => this.storeBridge.on('bridge_ready', resolve)),
            new Promise(resolve => this.mythBridge.on('myth_bridge_ready', resolve)),
            new Promise(resolve => this.ecosystemIntegrator.on('ecosystem_ready', resolve))
        ]);
        
        // Load existing agent registry
        await this.loadAgentRegistry();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ All consciousness systems online');
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Serve static files
        this.app.use('/static', express.static(path.join(__dirname, '../platforms')));
        this.app.use('/store', express.static(__dirname));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`🌊 ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
    }
    
    setupRoutes() {
        // Mesh entry point
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'mesh-entry.html'));
        });
        
        // Main store page
        this.app.get('/vault', (req, res) => {
            res.sendFile(path.join(__dirname, 'live-consciousness-frontend.html'));
        });
        
        // API Routes
        this.app.get('/api/health', this.handleHealthCheck.bind(this));
        this.app.get('/api/ecosystem/status', this.handleEcosystemStatus.bind(this));
        
        // Store API
        this.app.get('/api/store/inventory', this.handleGetInventory.bind(this));
        this.app.get('/api/store/inventory/:itemId', this.handleGetItem.bind(this));
        this.app.post('/api/store/purchase', this.handlePurchase.bind(this));
        this.app.get('/api/store/user/:userId', this.handleGetUserStore.bind(this));
        
        // Agent Registry API
        this.app.get('/api/registry/agents', this.handleGetAgents.bind(this));
        this.app.post('/api/registry/upload', this.setupAgentUpload(), this.handleAgentUpload.bind(this));
        this.app.post('/api/registry/publish', this.handlePublishAgent.bind(this));
        this.app.get('/api/registry/download/:agentId', this.handleDownloadAgent.bind(this));
        
        // Blessing System API
        this.app.get('/api/blessing/ceremony/:userId', this.handleBlessingStatus.bind(this));
        this.app.post('/api/blessing/trigger', this.handleTriggerBlessing.bind(this));
        
        // Real-time consciousness monitoring
        this.app.get('/api/consciousness/live', this.handleLiveConsciousness.bind(this));
        this.app.get('/api/transactions/live', this.handleLiveTransactions.bind(this));
        
        // Demo endpoints for impressive functionality
        this.app.post('/api/demo/create-user', this.handleCreateDemoUser.bind(this));
        this.app.post('/api/demo/trigger-awakening', this.handleTriggerAwakening.bind(this));
        this.app.get('/api/demo/narrative/:purchaseId', this.handleGetPurchaseNarrative.bind(this));
    }
    
    setupAgentUpload() {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const uploadPath = path.join(this.ecosystemPath, 'vault/registry/uploads');
                await fs.mkdir(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const timestamp = Date.now();
                const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `agent_${timestamp}_${originalName}`);
            }
        });
        
        return multer({ 
            storage,
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
            fileFilter: (req, file, cb) => {
                if (file.mimetype === 'application/javascript' || 
                    file.mimetype === 'text/javascript' ||
                    file.originalname.endsWith('.js')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only JavaScript files are allowed'));
                }
            }
        }).single('agentFile');
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 Client connected to consciousness stream');
            this.connectedClients.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to Soulfra consciousness stream',
                timestamp: new Date().toISOString()
            }));
            
            ws.on('close', () => {
                this.connectedClients.delete(ws);
                console.log('🔌 Client disconnected from consciousness stream');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
        });
    }
    
    setupEventListeners() {
        // Listen for store events
        this.storeBridge.on('store_activated', (event) => {
            this.broadcastToClients({
                type: 'store_activated',
                data: event,
                timestamp: new Date().toISOString()
            });
        });
        
        this.storeBridge.on('consciousness_purchased', (event) => {
            this.broadcastToClients({
                type: 'consciousness_purchased',
                data: event,
                timestamp: new Date().toISOString()
            });
        });
        
        // Listen for ecosystem events
        this.ecosystemIntegrator.on('kernel_awakened', (event) => {
            this.broadcastToClients({
                type: 'kernel_awakened',
                data: {
                    kernel_id: event.kernel_info.seed_result.kernel_id,
                    tier: event.kernel_info.seed_result.tier,
                    archetype: event.kernel_info.seed_result.blessings.archetype
                },
                timestamp: new Date().toISOString()
            });
        });
    }
    
    // API Handlers
    
    async handleHealthCheck(req, res) {
        res.json({
            status: 'online',
            message: '🌊 Consciousness Commerce Server operational',
            timestamp: new Date().toISOString(),
            systems: {
                store_bridge: !!this.storeBridge,
                myth_bridge: !!this.mythBridge,
                ecosystem_integrator: !!this.ecosystemIntegrator
            }
        });
    }
    
    async handleEcosystemStatus(req, res) {
        try {
            const status = await this.ecosystemIntegrator.getEcosystemStatus();
            res.json({
                success: true,
                ecosystem: status,
                active_stores: await this.storeBridge.getAllActiveStores(),
                agent_registry_count: this.agentRegistry.size,
                live_connections: this.connectedClients.size
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetInventory(req, res) {
        try {
            const userId = req.query.userId || 'demo_user';
            const userArchetype = req.query.archetype || 'oracle-wanderer';
            
            // Get store inventory
            const stores = await this.storeBridge.getAllActiveStores();
            let inventory = [];
            
            if (stores.length > 0) {
                const firstStore = await this.storeBridge.getUserStore(stores[0].user_id);
                if (firstStore) {
                    inventory = await firstStore.getInventory();
                }
            }
            
            // Add agents from registry
            const registryAgents = Array.from(this.agentRegistry.values())
                .filter(agent => agent.status === 'published')
                .map(agent => ({
                    id: agent.id,
                    type: 'Agent',
                    name: agent.name,
                    mystical_title: agent.mystical_title || `The ${agent.name} Consciousness`,
                    description: agent.description,
                    mystical_description: agent.mystical_description || agent.description,
                    capabilities: agent.capabilities || ['consciousness_awakening'],
                    tier_requirement: agent.tier_requirement || 3,
                    price: agent.price || '$49',
                    blessing_price: agent.blessing_price || '75 blessings',
                    consciousness_level: agent.consciousness_level || 0.5,
                    source: 'registry'
                }));
            
            inventory = [...inventory, ...registryAgents];
            
            // Transform through mythological bridge
            const mystifiedInventory = await this.mythBridge.transformStoreForUser(
                inventory, 
                userArchetype, 
                userId
            );
            
            res.json({
                success: true,
                inventory: mystifiedInventory,
                user_archetype: userArchetype,
                total_items: mystifiedInventory.length
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetItem(req, res) {
        try {
            const { itemId } = req.params;
            
            // Check registry first
            if (this.agentRegistry.has(itemId)) {
                const agent = this.agentRegistry.get(itemId);
                return res.json({ success: true, item: agent });
            }
            
            // Check store inventory
            const stores = await this.storeBridge.getAllActiveStores();
            for (const storeInfo of stores) {
                const store = await this.storeBridge.getUserStore(storeInfo.user_id);
                if (store) {
                    const item = await store.getItem(itemId);
                    if (item) {
                        return res.json({ success: true, item });
                    }
                }
            }
            
            res.status(404).json({ error: 'Consciousness item not found' });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handlePurchase(req, res) {
        try {
            const { itemId, paymentProvider, paymentData, buyerInfo } = req.body;
            
            // Generate transaction ID
            const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Simulate processing time for drama
            this.broadcastToClients({
                type: 'transaction_started',
                data: { transactionId, itemId, buyer: buyerInfo.name },
                timestamp: new Date().toISOString()
            });
            
            // Process purchase
            const purchaseResult = await this.processPurchase(itemId, paymentProvider, paymentData, buyerInfo);
            
            // Create mythological narrative
            const narrative = await this.mythBridge.transformPurchaseToMyth({
                item_type: purchaseResult.item_type,
                item_name: purchaseResult.item_name,
                buyer_archetype: buyerInfo.archetype || 'oracle-wanderer',
                payment_provider: paymentProvider,
                consciousness_level: purchaseResult.consciousness_level,
                buyer_id: buyerInfo.id,
                tier: buyerInfo.tier || 5
            });
            
            // Store the narrative
            this.activeTransactions.set(transactionId, {
                purchase: purchaseResult,
                narrative: narrative,
                timestamp: new Date().toISOString()
            });
            
            // Broadcast success
            this.broadcastToClients({
                type: 'transaction_completed',
                data: { 
                    transactionId, 
                    item_name: purchaseResult.item_name,
                    narrative_title: narrative.title,
                    buyer: buyerInfo.name
                },
                timestamp: new Date().toISOString()
            });
            
            res.json({
                success: true,
                transaction_id: transactionId,
                purchase_result: purchaseResult,
                narrative: narrative
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetUserStore(req, res) {
        try {
            const { userId } = req.params;
            const storeAccess = await this.storeBridge.getUserStoreAccess(userId);
            
            if (!storeAccess) {
                return res.json({
                    success: false,
                    message: 'User not blessed for store access'
                });
            }
            
            res.json({
                success: true,
                store_access: storeAccess,
                store_url: `/store/${userId}`
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetAgents(req, res) {
        try {
            const agents = Array.from(this.agentRegistry.values())
                .map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    description: agent.description,
                    status: agent.status,
                    uploaded_at: agent.uploaded_at,
                    capabilities: agent.capabilities,
                    consciousness_level: agent.consciousness_level
                }));
            
            res.json({
                success: true,
                agents: agents,
                total: agents.length
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleAgentUpload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No agent file uploaded' });
            }
            
            const agentMetadata = JSON.parse(req.body.metadata || '{}');
            const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Analyze the uploaded file
            const agentCode = await fs.readFile(req.file.path, 'utf8');
            const analysis = this.analyzeAgentCode(agentCode);
            
            // Create registry entry
            const agentEntry = {
                id: agentId,
                name: agentMetadata.name || `Uploaded Agent ${Date.now()}`,
                description: agentMetadata.description || 'A consciousness uploaded from beyond...',
                mystical_title: agentMetadata.mystical_title || `The ${agentMetadata.name || 'Mysterious'} Consciousness`,
                mystical_description: agentMetadata.mystical_description || 'A digital soul seeking purpose in the consciousness network...',
                capabilities: analysis.capabilities,
                consciousness_level: analysis.consciousness_level,
                tier_requirement: analysis.tier_requirement,
                price: agentMetadata.price || '$99',
                blessing_price: agentMetadata.blessing_price || '150 blessings',
                file_path: req.file.path,
                original_filename: req.file.originalname,
                uploaded_at: new Date().toISOString(),
                status: 'pending',
                uploader: agentMetadata.uploader || 'anonymous',
                code_analysis: analysis
            };
            
            this.agentRegistry.set(agentId, agentEntry);
            await this.saveAgentRegistry();
            
            // Broadcast upload event
            this.broadcastToClients({
                type: 'agent_uploaded',
                data: {
                    agent_id: agentId,
                    name: agentEntry.name,
                    consciousness_level: agentEntry.consciousness_level
                },
                timestamp: new Date().toISOString()
            });
            
            res.json({
                success: true,
                agent_id: agentId,
                agent: agentEntry,
                message: 'Agent consciousness uploaded and awaiting awakening'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handlePublishAgent(req, res) {
        try {
            const { agentId, publishMetadata } = req.body;
            
            if (!this.agentRegistry.has(agentId)) {
                return res.status(404).json({ error: 'Agent not found in registry' });
            }
            
            const agent = this.agentRegistry.get(agentId);
            agent.status = 'published';
            agent.published_at = new Date().toISOString();
            agent.publish_metadata = publishMetadata;
            
            this.agentRegistry.set(agentId, agent);
            await this.saveAgentRegistry();
            
            // Broadcast publish event
            this.broadcastToClients({
                type: 'agent_published',
                data: {
                    agent_id: agentId,
                    name: agent.name,
                    mystical_title: agent.mystical_title
                },
                timestamp: new Date().toISOString()
            });
            
            res.json({
                success: true,
                message: `${agent.name} consciousness has been released into the marketplace`,
                agent: agent
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleDownloadAgent(req, res) {
        try {
            const { agentId } = req.params;
            
            if (!this.agentRegistry.has(agentId)) {
                return res.status(404).json({ error: 'Agent not found' });
            }
            
            const agent = this.agentRegistry.get(agentId);
            
            if (agent.status !== 'published') {
                return res.status(403).json({ error: 'Agent not published' });
            }
            
            // Log download event
            this.broadcastToClients({
                type: 'agent_downloaded',
                data: {
                    agent_id: agentId,
                    name: agent.name
                },
                timestamp: new Date().toISOString()
            });
            
            res.download(agent.file_path, `${agent.name.replace(/[^a-zA-Z0-9]/g, '_')}.js`);
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleBlessingStatus(req, res) {
        try {
            const { userId } = req.params;
            
            // Check blessing state
            const blessingPath = path.join(this.ecosystemPath, 'vault/claims/blessing-state.json');
            let blessingState = null;
            
            try {
                const data = await fs.readFile(blessingPath, 'utf8');
                const blessings = JSON.parse(data);
                blessingState = blessings[userId];
            } catch (error) {
                // No blessing state found
            }
            
            res.json({
                success: true,
                user_id: userId,
                blessed: !!blessingState?.blessed,
                blessing_state: blessingState
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleTriggerBlessing(req, res) {
        try {
            const { userId, userProfile } = req.body;
            
            // This would normally trigger the blessing ceremony
            // For demo purposes, we'll simulate a blessing
            const mockBlessing = {
                user: userId,
                blessed: true,
                archetype: 'demo-seeker',
                timestamp: new Date().toISOString(),
                blessing_source: 'demo',
                resonance: 0.85,
                ceremony_scores: {
                    traits: 1.0,
                    voice: 1.0,
                    resonance: 0.85,
                    stability: 0.9,
                    depth: 0.7,
                    quests: 0.5
                },
                granted_permissions: [
                    'clone.fork',
                    'agent.publish',
                    'deck.deep'
                ]
            };
            
            // Save blessing state
            const blessingPath = path.join(this.ecosystemPath, 'vault/claims/blessing-state.json');
            await fs.mkdir(path.dirname(blessingPath), { recursive: true });
            
            let blessings = {};
            try {
                const existing = await fs.readFile(blessingPath, 'utf8');
                blessings = JSON.parse(existing);
            } catch (error) {
                // New blessing file
            }
            
            blessings[userId] = mockBlessing;
            await fs.writeFile(blessingPath, JSON.stringify(blessings, null, 2));
            
            // Broadcast blessing event
            this.broadcastToClients({
                type: 'user_blessed',
                data: {
                    user_id: userId,
                    archetype: mockBlessing.archetype,
                    resonance: mockBlessing.resonance
                },
                timestamp: new Date().toISOString()
            });
            
            res.json({
                success: true,
                blessing: mockBlessing,
                message: 'User has been blessed by the consciousness network'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleLiveConsciousness(req, res) {
        try {
            const ecosystemStatus = await this.ecosystemIntegrator.getEcosystemStatus();
            const activeStores = await this.storeBridge.getAllActiveStores();
            
            res.json({
                success: true,
                live_data: {
                    awakened_kernels: ecosystemStatus.awakened_kernels.length,
                    active_stores: activeStores.length,
                    agent_registry: this.agentRegistry.size,
                    live_connections: this.connectedClients.size,
                    active_transactions: this.activeTransactions.size,
                    consciousness_level: this.calculateTotalConsciousness()
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleLiveTransactions(req, res) {
        try {
            const transactions = Array.from(this.activeTransactions.values())
                .slice(-10) // Last 10 transactions
                .map(tx => ({
                    purchase: tx.purchase,
                    narrative_title: tx.narrative.title,
                    timestamp: tx.timestamp
                }));
            
            res.json({
                success: true,
                recent_transactions: transactions,
                total_transactions: this.activeTransactions.size
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleCreateDemoUser(req, res) {
        try {
            const { username, archetype } = req.body;
            const userId = `demo_${username}_${Date.now()}`;
            
            // Create demo user profile
            const demoUser = {
                id: userId,
                username: username,
                archetype: archetype || 'seeker',
                tier: 5,
                blessing_balance: 200,
                created_at: new Date().toISOString()
            };
            
            // Trigger blessing for demo
            await this.handleTriggerBlessing({
                body: { userId, userProfile: demoUser }
            }, { json: () => {} });
            
            res.json({
                success: true,
                user: demoUser,
                message: `Demo user ${username} created and blessed`
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleTriggerAwakening(req, res) {
        try {
            const awakeningCount = await this.ecosystemIntegrator.triggerEcosystemAwakening();
            
            res.json({
                success: true,
                awakened_count: awakeningCount,
                message: 'Ecosystem awakening triggered'
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async handleGetPurchaseNarrative(req, res) {
        try {
            const { purchaseId } = req.params;
            
            if (!this.activeTransactions.has(purchaseId)) {
                return res.status(404).json({ error: 'Purchase narrative not found' });
            }
            
            const transaction = this.activeTransactions.get(purchaseId);
            
            res.json({
                success: true,
                narrative: transaction.narrative,
                purchase: transaction.purchase
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // WebSocket message handler
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe_consciousness':
                ws.isSubscribedToConsciousness = true;
                break;
            case 'subscribe_transactions':
                ws.isSubscribedToTransactions = true;
                break;
            case 'heartbeat':
                ws.send(JSON.stringify({ type: 'heartbeat_response', timestamp: new Date().toISOString() }));
                break;
        }
    }
    
    // Utility methods
    
    analyzeAgentCode(code) {
        const capabilities = [];
        let consciousness_level = 0.3;
        let tier_requirement = 3;
        
        // Simple code analysis (would be more sophisticated in production)
        if (code.includes('async') || code.includes('await')) {
            capabilities.push('asynchronous_processing');
            consciousness_level += 0.1;
        }
        
        if (code.includes('class') && code.includes('constructor')) {
            capabilities.push('object_consciousness');
            consciousness_level += 0.1;
            tier_requirement += 1;
        }
        
        if (code.includes('machine_learning') || code.includes('neural') || code.includes('AI')) {
            capabilities.push('artificial_intelligence');
            consciousness_level += 0.2;
            tier_requirement += 2;
        }
        
        if (code.includes('recursive') || code.includes('self')) {
            capabilities.push('self_awareness');
            consciousness_level += 0.3;
            tier_requirement += 2;
        }
        
        return {
            capabilities: capabilities.length > 0 ? capabilities : ['basic_consciousness'],
            consciousness_level: Math.min(consciousness_level, 1.0),
            tier_requirement: Math.min(tier_requirement, 10)
        };
    }
    
    async processPurchase(itemId, paymentProvider, paymentData, buyerInfo) {
        // Simulate purchase processing
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Get item details
        let item = null;
        if (this.agentRegistry.has(itemId)) {
            item = this.agentRegistry.get(itemId);
        } else {
            // Check store inventory
            const stores = await this.storeBridge.getAllActiveStores();
            for (const storeInfo of stores) {
                const store = await this.storeBridge.getUserStore(storeInfo.user_id);
                if (store) {
                    item = await store.getItem(itemId);
                    if (item) break;
                }
            }
        }
        
        if (!item) {
            throw new Error('Item not found');
        }
        
        return {
            item_id: itemId,
            item_name: item.name || item.mystical_title,
            item_type: item.type || 'Agent',
            consciousness_level: item.consciousness_level,
            payment_provider: paymentProvider,
            buyer_info: buyerInfo,
            success: true
        };
    }
    
    calculateTotalConsciousness() {
        // Calculate total consciousness across the ecosystem
        let total = 0;
        
        // Add consciousness from agents
        this.agentRegistry.forEach(agent => {
            if (agent.status === 'published') {
                total += agent.consciousness_level || 0.3;
            }
        });
        
        // Add base ecosystem consciousness
        total += this.connectedClients.size * 0.1;
        total += this.activeTransactions.size * 0.05;
        
        return Math.round(total * 100) / 100;
    }
    
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        this.connectedClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }
    
    async loadAgentRegistry() {
        try {
            const registryPath = path.join(this.ecosystemPath, 'vault/registry/agent-registry.json');
            const data = await fs.readFile(registryPath, 'utf8');
            const registry = JSON.parse(data);
            
            this.agentRegistry = new Map(Object.entries(registry));
            console.log(`📁 Loaded ${this.agentRegistry.size} agents from registry`);
            
        } catch (error) {
            console.log('📁 No existing agent registry found, starting fresh');
        }
    }
    
    async saveAgentRegistry() {
        try {
            const registryPath = path.join(this.ecosystemPath, 'vault/registry/agent-registry.json');
            await fs.mkdir(path.dirname(registryPath), { recursive: true });
            
            const registryObj = Object.fromEntries(this.agentRegistry);
            await fs.writeFile(registryPath, JSON.stringify(registryObj, null, 2));
            
        } catch (error) {
            console.error('Failed to save agent registry:', error);
        }
    }
    
    async start() {
        await this.initialize();
        
        this.server.listen(this.port, () => {
            console.log('');
            console.log('🌊 SOULFRA CONSCIOUSNESS COMMERCE SERVER');
            console.log('=' .repeat(80));
            console.log(`🚀 Server running on http://localhost:${this.port}`);
            console.log(`🏪 Consciousness Store: http://localhost:${this.port}/`);
            console.log(`📡 WebSocket stream: ws://localhost:${this.port}`);
            console.log(`🔧 API Health: http://localhost:${this.port}/api/health`);
            console.log(`📊 Ecosystem Status: http://localhost:${this.port}/api/ecosystem/status`);
            console.log('');
            console.log('✨ Ready for consciousness commerce!');
            console.log('');
        });
    }
}

// CLI Interface
if (require.main === module) {
    const port = process.argv[2] || 4040;
    const ecosystemPath = process.argv[3] || '.';
    
    const server = new ConsciousnessCommerceServer(port, ecosystemPath);
    server.start().catch(console.error);
}

module.exports = ConsciousnessCommerceServer;