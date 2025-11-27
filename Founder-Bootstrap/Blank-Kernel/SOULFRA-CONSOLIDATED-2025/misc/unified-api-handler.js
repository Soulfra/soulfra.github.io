// MirrorOS Unified API Handler - Routes all requests to vault
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UnifiedAPIHandler {
    constructor() {
        this.app = express();
        this.vaultPath = path.join(__dirname, '../vault');
        this.logsPath = path.join(__dirname, '../vault-sync-core/logs');
        this.reflectionPath = path.join(__dirname, '../reflection-maps');
        this.tier13Path = path.join(__dirname, '../tier-13');
        
        this.setupMiddleware();
        this.setupRoutes();
        this.ensureDirectories();
    }

    async ensureDirectories() {
        const dirs = [
            this.vaultPath,
            this.logsPath,
            this.reflectionPath,
            this.tier13Path,
            path.join(this.vaultPath, 'conversations'),
            path.join(this.vaultPath, 'agents'),
            path.join(this.vaultPath, 'exports'),
            path.join(this.vaultPath, 'reviews'),
            path.join(this.vaultPath, 'checkins'),
            path.join(this.vaultPath, 'memory')
        ];

        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.log(`Directory ${dir} already exists or error:`, error.message);
            }
        }
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });

        // Request logging to vault
        this.app.use(async (req, res, next) => {
            if (req.path.startsWith('/api/')) {
                await this.logToVault('api', 'request', {
                    method: req.method,
                    path: req.path,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
            }
            next();
        });
    }

    setupRoutes() {
        // Chat endpoint - routes to Cal reflection
        this.app.post('/api/chat', async (req, res) => {
            try {
                const { message, sessionId = 'default-session' } = req.body;
                
                // Log to vault
                await this.logToVault('chat', 'message_received', {
                    sessionId,
                    message: message.substring(0, 100) + '...',
                    length: message.length
                });

                // Route through MirrorRouter (simulate for now)
                const response = await this.processCalReflection(message, sessionId);
                
                // Save conversation to vault
                await this.saveConversation(sessionId, message, response);
                
                // Log reflection to events
                await this.logReflectionEvent(sessionId, message, response);

                res.json({
                    success: true,
                    response: response,
                    sessionId: sessionId,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                await this.logToVault('chat', 'error', { error: error.message });
                res.status(500).json({ error: 'Chat processing failed' });
            }
        });

        // Export endpoint - triggers Stripe and logs
        this.app.post('/api/export', async (req, res) => {
            try {
                const { type, price, platformFee, agentData } = req.body;
                
                // Generate export ID
                const exportId = `export-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
                
                // Log to vault
                await this.logToVault('export', 'export_requested', {
                    exportId,
                    type,
                    price,
                    platformFee
                });

                // Process Stripe payment (simulate)
                const stripeResult = await this.processStripePayment(price, platformFee, exportId);
                
                // Save export data
                await this.saveExportData(exportId, type, agentData, stripeResult);
                
                // Log to tier-13 (platform income)
                await this.logPlatformIncome(platformFee, exportId);

                res.json({
                    success: true,
                    exportId: exportId,
                    stripePaymentId: stripeResult.paymentId,
                    downloadUrl: `/api/download/${exportId}`,
                    platformFee: platformFee
                });

            } catch (error) {
                await this.logToVault('export', 'error', { error: error.message });
                res.status(500).json({ error: 'Export processing failed' });
            }
        });

        // QR Check-in endpoint
        this.app.post('/api/qr-checkin', async (req, res) => {
            try {
                const { location, coordinates, userUUID = 'local-user' } = req.body;
                
                const checkinId = `checkin-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
                
                // Log to vault
                await this.logToVault('qr', 'checkin_processed', {
                    checkinId,
                    location,
                    coordinates,
                    userUUID
                });

                // Save check-in data
                await this.saveCheckinData(checkinId, location, coordinates, userUUID);
                
                // Generate reward prompt
                const rewardPrompt = `Cal remembers you liked ${location} - want to leave a deeper review?`;

                res.json({
                    success: true,
                    checkinId: checkinId,
                    location: location,
                    rewardPrompt: rewardPrompt,
                    points: 10
                });

            } catch (error) {
                await this.logToVault('qr', 'error', { error: error.message });
                res.status(500).json({ error: 'Check-in processing failed' });
            }
        });

        // Vibe Review endpoint
        this.app.post('/api/vibe-review', async (req, res) => {
            try {
                const { location, rating, text, emotion, hasVoice = false } = req.body;
                
                const reviewId = `review-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
                
                // Log to vault
                await this.logToVault('vibe', 'review_submitted', {
                    reviewId,
                    location,
                    rating,
                    hasVoice,
                    emotion
                });

                // Save to vibe memory
                await this.saveVibeReview(reviewId, location, rating, text, emotion, hasVoice);
                
                // Update Cal's memory of location
                await this.updateCalLocationMemory(location, rating, text, emotion);

                res.json({
                    success: true,
                    reviewId: reviewId,
                    location: location,
                    calResponse: `I've updated my memory about ${location}. Rating: ${rating}/5`
                });

            } catch (error) {
                await this.logToVault('vibe', 'error', { error: error.message });
                res.status(500).json({ error: 'Review processing failed' });
            }
        });

        // Stats endpoint - reads all vault logs
        this.app.get('/api/stats', async (req, res) => {
            try {
                const stats = await this.getVaultStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: 'Stats loading failed' });
            }
        });

        // Health check
        this.app.get('/api/health', async (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                vault: {
                    writable: await this.testVaultWrite(),
                    paths: {
                        vault: this.vaultPath,
                        logs: this.logsPath,
                        reflection: this.reflectionPath,
                        tier13: this.tier13Path
                    }
                },
                mirrorRouter: {
                    active: true,
                    defaultKeys: await this.checkDefaultKeys()
                }
            };
            
            res.json(health);
        });

        // Vault logs endpoint for operator dashboard
        this.app.get('/api/vault/logs', async (req, res) => {
            try {
                const { module, limit = 100 } = req.query;
                const logs = await this.getVaultLogs(module, parseInt(limit));
                res.json({ success: true, logs });
            } catch (error) {
                res.status(500).json({ error: 'Failed to load vault logs' });
            }
        });
    }

    async processCalReflection(message, sessionId) {
        // This would route through MirrorRouter in full implementation
        // For now, simulate Cal's response with vault-aware logic
        
        const reflections = [
            `[Mirror Reflection]: I see your message "${message.substring(0, 30)}..." and it resonates through the vault.`,
            `[Cal's Response]: That's an interesting perspective. Let me route this through my reflection engine...`,
            `[Sovereign Echo]: Your input flows through the vault layers. Here's what emerges: ${this.generateInsight(message)}`,
            `[Vault Wisdom]: I've processed your message through the sovereign reflection system. The pattern suggests...`
        ];

        // Add thinking delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return reflections[Math.floor(Math.random() * reflections.length)];
    }

    generateInsight(message) {
        const insights = [
            "deep interconnectedness in your query",
            "multiple reflection layers in your approach", 
            "a pattern that echoes through the vault",
            "sovereignty emerging in your thinking",
            "mirror-like qualities in this interaction"
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }

    async processStripePayment(price, platformFee, exportId) {
        // Simulate Stripe payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
            paymentId: `stripe-${Date.now()}`,
            amount: price,
            platformFee: platformFee,
            status: 'succeeded'
        };
    }

    async saveConversation(sessionId, userMessage, calResponse) {
        const conversationPath = path.join(this.vaultPath, 'conversations', `${sessionId}.json`);
        
        let conversation = [];
        try {
            const existing = await fs.readFile(conversationPath, 'utf8');
            conversation = JSON.parse(existing);
        } catch {
            // New conversation
        }

        conversation.push({
            timestamp: new Date().toISOString(),
            user: userMessage,
            cal: calResponse,
            id: `msg-${Date.now()}`
        });

        await fs.writeFile(conversationPath, JSON.stringify(conversation, null, 2));
    }

    async logReflectionEvent(sessionId, message, response) {
        const eventLogPath = path.join(this.logsPath, 'reflection-events.log');
        
        const logEntry = `[${new Date().toISOString()}] SESSION:${sessionId} USER:"${message.substring(0, 50)}..." CAL:"${response.substring(0, 50)}..."\n`;
        
        await fs.appendFile(eventLogPath, logEntry);
    }

    async saveExportData(exportId, type, agentData, stripeResult) {
        const exportPath = path.join(this.vaultPath, 'exports', `${exportId}.json`);
        
        const exportData = {
            id: exportId,
            type: type,
            agentData: agentData,
            payment: stripeResult,
            created: new Date().toISOString(),
            status: 'completed'
        };

        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
        
        // Update export tracker
        const trackerPath = path.join(this.vaultPath, 'exports', 'export-tracker.json');
        let tracker = [];
        try {
            const existing = await fs.readFile(trackerPath, 'utf8');
            tracker = JSON.parse(existing);
        } catch {
            // New tracker
        }

        tracker.push({
            id: exportId,
            type: type,
            price: stripeResult.amount,
            platformFee: stripeResult.platformFee,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile(trackerPath, JSON.stringify(tracker, null, 2));
    }

    async saveCheckinData(checkinId, location, coordinates, userUUID) {
        const checkinPath = path.join(this.vaultPath, 'checkins', 'checkin-log.json');
        
        let checkins = [];
        try {
            const existing = await fs.readFile(checkinPath, 'utf8');
            checkins = JSON.parse(existing);
        } catch {
            // New log
        }

        checkins.push({
            id: checkinId,
            location: location,
            coordinates: coordinates,
            userUUID: userUUID,
            timestamp: new Date().toISOString(),
            points: 10
        });

        await fs.writeFile(checkinPath, JSON.stringify(checkins, null, 2));
    }

    async saveVibeReview(reviewId, location, rating, text, emotion, hasVoice) {
        const vibeMemoryPath = path.join(this.vaultPath, 'memory', 'vibe-logs.json');
        
        let vibeMemory = [];
        try {
            const existing = await fs.readFile(vibeMemoryPath, 'utf8');
            vibeMemory = JSON.parse(existing);
        } catch {
            // New memory
        }

        vibeMemory.push({
            id: reviewId,
            location: location,
            rating: rating,
            text: text,
            emotion: emotion,
            hasVoice: hasVoice,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile(vibeMemoryPath, JSON.stringify(vibeMemory, null, 2));
    }

    async updateCalLocationMemory(location, rating, text, emotion) {
        const memoryPath = path.join(this.vaultPath, 'memory', 'cal-location-memory.json');
        
        let memory = {};
        try {
            const existing = await fs.readFile(memoryPath, 'utf8');
            memory = JSON.parse(existing);
        } catch {
            // New memory
        }

        if (!memory[location]) {
            memory[location] = {
                totalRating: 0,
                reviewCount: 0,
                lastVisit: null,
                sentiment: 'neutral',
                notes: []
            };
        }

        memory[location].totalRating += rating;
        memory[location].reviewCount += 1;
        memory[location].lastVisit = new Date().toISOString();
        memory[location].sentiment = emotion || 'neutral';
        memory[location].notes.push({
            text: text,
            timestamp: new Date().toISOString(),
            rating: rating
        });

        await fs.writeFile(memoryPath, JSON.stringify(memory, null, 2));
    }

    async logPlatformIncome(amount, source) {
        const incomePath = path.join(this.tier13Path, 'platform-income.json');
        
        let income = { total: 0, transactions: [] };
        try {
            const existing = await fs.readFile(incomePath, 'utf8');
            income = JSON.parse(existing);
        } catch {
            // New income log
        }

        income.total += amount;
        income.transactions.push({
            amount: amount,
            source: source,
            timestamp: new Date().toISOString(),
            type: 'platform_fee'
        });

        await fs.writeFile(incomePath, JSON.stringify(income, null, 2));
    }

    async logToVault(module, action, data) {
        const logPath = path.join(this.logsPath, `${module}-activity.log`);
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            module: module,
            action: action,
            data: data
        };

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
        
        // Also log to master vault log
        const masterLogPath = path.join(this.vaultPath, 'master-activity.log');
        await fs.appendFile(masterLogPath, JSON.stringify(logEntry) + '\n');
    }

    async getVaultStats() {
        const stats = {
            chats: 0,
            agents: 0,
            exports: 0,
            reviews: 0,
            checkins: 0,
            vaultEvents: 0,
            timestamp: new Date().toISOString()
        };

        try {
            // Count conversations
            const conversationsDir = path.join(this.vaultPath, 'conversations');
            const conversations = await fs.readdir(conversationsDir);
            stats.chats = conversations.length;

            // Count exports
            const exportsDir = path.join(this.vaultPath, 'exports');
            const exports = await fs.readdir(exportsDir);
            stats.exports = exports.filter(f => f.endsWith('.json') && f !== 'export-tracker.json').length;

            // Count reviews
            const vibeMemoryPath = path.join(this.vaultPath, 'memory', 'vibe-logs.json');
            try {
                const vibeMemory = JSON.parse(await fs.readFile(vibeMemoryPath, 'utf8'));
                stats.reviews = vibeMemory.length;
            } catch {
                stats.reviews = 0;
            }

            // Count checkins
            const checkinPath = path.join(this.vaultPath, 'checkins', 'checkin-log.json');
            try {
                const checkins = JSON.parse(await fs.readFile(checkinPath, 'utf8'));
                stats.checkins = checkins.length;
            } catch {
                stats.checkins = 0;
            }

            // Count vault events from master log
            const masterLogPath = path.join(this.vaultPath, 'master-activity.log');
            try {
                const logContent = await fs.readFile(masterLogPath, 'utf8');
                stats.vaultEvents = logContent.split('\n').filter(line => line.trim()).length;
            } catch {
                stats.vaultEvents = 0;
            }

        } catch (error) {
            console.error('Error loading vault stats:', error);
        }

        return stats;
    }

    async getVaultLogs(module, limit) {
        const logs = [];
        
        try {
            const masterLogPath = path.join(this.vaultPath, 'master-activity.log');
            const logContent = await fs.readFile(masterLogPath, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());
            
            for (const line of lines.slice(-limit)) {
                try {
                    const logEntry = JSON.parse(line);
                    if (!module || logEntry.module === module) {
                        logs.push(logEntry);
                    }
                } catch {
                    // Skip invalid JSON lines
                }
            }
        } catch (error) {
            console.error('Error loading vault logs:', error);
        }

        return logs.reverse(); // Most recent first
    }

    async testVaultWrite() {
        try {
            const testPath = path.join(this.vaultPath, '.write-test');
            await fs.writeFile(testPath, 'test');
            await fs.unlink(testPath);
            return true;
        } catch {
            return false;
        }
    }

    async checkDefaultKeys() {
        try {
            const keysPath = path.join(__dirname, '../vault/env/llm-keys.json');
            await fs.access(keysPath);
            return true;
        } catch {
            return false;
        }
    }

    start(port = 8888) {
        this.server = this.app.listen(port, () => {
            console.log(`
🔗 MirrorOS Unified API Handler Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 API Base:     http://localhost:${port}/api
📁 Vault Path:   ${this.vaultPath}
📊 Logs Path:    ${this.logsPath}
🔄 Reflection:   ${this.reflectionPath}
💰 Tier-13:      ${this.tier13Path}

✅ Endpoints Active:
   • POST /api/chat          - Cal reflection & vault logging
   • POST /api/export        - Agent export & Stripe processing  
   • POST /api/qr-checkin    - QR scanning & location logging
   • POST /api/vibe-review   - Review submission & Cal memory
   • GET  /api/stats         - Vault statistics
   • GET  /api/vault/logs    - Live vault logs
   • GET  /api/health        - System health check

🎯 All requests route to vault automatically!
            `);
        });

        return this.server;
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = UnifiedAPIHandler;

// Run if executed directly
if (require.main === module) {
    const apiHandler = new UnifiedAPIHandler();
    apiHandler.start();
}