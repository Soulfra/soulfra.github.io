#!/usr/bin/env node

/**
 * Soulfra Unified Economy Mesh
 * 
 * Complete economic system that:
 * 1. Connects all arenas through unified token economy
 * 2. Manages API key protection via Cal's secure mesh
 * 3. Handles cross-platform communication (Telegram, Discord, etc.)
 * 4. Provides professional documentation/PRD generation services
 * 5. Encrypts/obfuscates business data through storytelling
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class UnifiedEconomyMesh extends EventEmitter {
    constructor() {
        super();
        
        // Core economic state
        this.globalTokenPool = 1000000; // 1M tokens
        this.arenaEconomies = new Map();
        this.userWallets = new Map();
        this.transactionLog = [];
        
        // API key vault (Cal controls internal keys)
        this.apiVault = {
            cal: {
                openai: process.env.OPENAI_API_KEY || 'cal-internal-key',
                anthropic: process.env.ANTHROPIC_API_KEY || 'cal-internal-key',
                telegram: process.env.TELEGRAM_BOT_TOKEN || 'cal-internal-key'
            },
            users: new Map() // User API keys stored encrypted
        };
        
        // Communication mesh
        this.communicationChannels = new Map();
        
        // Professional services pricing
        this.servicePricing = {
            prd: { basePrice: 500, quality: 'enterprise' },
            documentation: { basePrice: 300, quality: 'professional' },
            copywriting: { basePrice: 200, quality: 'marketing' },
            storytelling: { basePrice: 400, quality: 'narrative' },
            architecture: { basePrice: 800, quality: 'technical' }
        };
        
        this.initializeEconomies();
        this.setupCommunicationMesh();
    }
    
    initializeEconomies() {
        // Initialize arena economies
        ['discovery', 'development', 'implementation'].forEach((arena, index) => {
            this.arenaEconomies.set(arena, {
                tokenPool: 100000,
                activeAgents: 0,
                dailyVolume: 0,
                profitability: Math.random() * 0.1 + 0.05, // 5-15% daily
                specialization: arena,
                demandMultiplier: 1.0
            });
        });
        
        // Initialize pricing algorithms
        this.updateMarketPricing();
    }
    
    setupCommunicationMesh() {
        // Telegram integration
        this.communicationChannels.set('telegram', {
            type: 'messaging',
            handler: this.handleTelegramMessage.bind(this),
            encryption: true,
            storytellingLayer: true
        });
        
        // Discord integration
        this.communicationChannels.set('discord', {
            type: 'community',
            handler: this.handleDiscordMessage.bind(this),
            encryption: true,
            storytellingLayer: true
        });
        
        // API mesh for external services
        this.communicationChannels.set('api', {
            type: 'service',
            handler: this.handleAPIRequest.bind(this),
            encryption: true,
            businessObfuscation: true
        });
    }
    
    // Handle Telegram messages with full agent interaction
    async handleTelegramMessage(userId, message, channelData) {
        console.log(`\n📱 Telegram message from ${userId}: "${message}"`);
        
        // Decrypt if needed
        const decryptedMessage = this.decryptUserMessage(message, userId);
        
        // Route to user's personal agent
        const userAgent = await this.getUserAgent(userId);
        const agentResponse = await userAgent.processMessage(decryptedMessage);
        
        // Agent decides what to do with the idea
        const actionPlan = await this.analyzeForDocumentation(agentResponse);
        
        // Send response back to Telegram
        const encryptedResponse = this.encryptForUser(agentResponse.response, userId);
        await this.sendTelegramMessage(userId, encryptedResponse);
        
        // If agent wants to develop idea further
        if (actionPlan.shouldDocument) {
            const documentationJob = await this.createDocumentationJob(actionPlan);
            console.log(`📋 Documentation job created: ${documentationJob.id}`);
            
            // Charge user for professional services
            await this.chargeForService(userId, 'documentation', actionPlan.complexity);
        }
        
        return { processed: true, jobsCreated: actionPlan.shouldDocument ? 1 : 0 };
    }
    
    // Get or create user's personal agent
    async getUserAgent(userId) {
        if (!this.userAgents) {
            this.userAgents = new Map();
        }
        
        if (!this.userAgents.has(userId)) {
            const agent = new PersonalAgent(userId, this);
            this.userAgents.set(userId, agent);
            
            // Initialize user wallet if needed
            if (!this.userWallets.has(userId)) {
                this.userWallets.set(userId, {
                    tokens: 1000, // Starting balance
                    apiKeys: new Map(),
                    subscriptions: new Set(),
                    creditScore: 750
                });
            }
        }
        
        return this.userAgents.get(userId);
    }
    
    // Analyze if message should become documentation
    async analyzeForDocumentation(agentResponse) {
        const complexity = this.calculateComplexity(agentResponse.content);
        const marketDemand = this.calculateMarketDemand(agentResponse.topic);
        const profitability = this.calculateProfitability(complexity, marketDemand);
        
        return {
            shouldDocument: profitability > 0.3, // 30% profit threshold
            complexity,
            marketDemand,
            profitability,
            recommendedService: this.recommendService(agentResponse),
            estimatedPrice: this.estimatePrice(complexity, marketDemand)
        };
    }
    
    calculateComplexity(content) {
        // Simple complexity analysis
        const factors = {
            length: Math.min(content.length / 1000, 1.0),
            technicalTerms: (content.match(/\b(API|database|algorithm|architecture|system)\b/gi) || []).length / 10,
            businessTerms: (content.match(/\b(revenue|market|strategy|customer|growth)\b/gi) || []).length / 10,
            actionItems: (content.match(/\b(implement|create|build|develop|design)\b/gi) || []).length / 5
        };
        
        return Object.values(factors).reduce((a, b) => a + b) / Object.keys(factors).length;
    }
    
    calculateMarketDemand(topic) {
        const demandFactors = {
            'ai': 0.9,
            'blockchain': 0.7,
            'automation': 0.8,
            'platform': 0.6,
            'mobile': 0.5,
            'web': 0.4
        };
        
        let demand = 0.3; // Base demand
        
        Object.entries(demandFactors).forEach(([keyword, factor]) => {
            if (topic.toLowerCase().includes(keyword)) {
                demand = Math.max(demand, factor);
            }
        });
        
        return demand;
    }
    
    calculateProfitability(complexity, demand) {
        return (complexity * 0.6 + demand * 0.4) * (0.8 + Math.random() * 0.4);
    }
    
    recommendService(agentResponse) {
        const content = agentResponse.content.toLowerCase();
        
        if (content.includes('requirement') || content.includes('spec')) return 'prd';
        if (content.includes('document') || content.includes('manual')) return 'documentation';
        if (content.includes('marketing') || content.includes('copy')) return 'copywriting';
        if (content.includes('story') || content.includes('narrative')) return 'storytelling';
        if (content.includes('architecture') || content.includes('system')) return 'architecture';
        
        return 'documentation'; // Default
    }
    
    estimatePrice(complexity, demand) {
        const basePrice = 300;
        const complexityMultiplier = 1 + complexity;
        const demandMultiplier = 1 + demand;
        
        return Math.round(basePrice * complexityMultiplier * demandMultiplier);
    }
    
    // Create professional documentation job
    async createDocumentationJob(actionPlan) {
        const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const job = {
            id: jobId,
            type: actionPlan.recommendedService,
            complexity: actionPlan.complexity,
            price: actionPlan.estimatedPrice,
            status: 'queued',
            arena: this.selectOptimalArena(actionPlan),
            created: Date.now(),
            estimatedCompletion: Date.now() + (actionPlan.complexity * 3600000) // Hours based on complexity
        };
        
        // Route to appropriate arena
        const arena = this.arenaEconomies.get(job.arena);
        arena.activeJobs = arena.activeJobs || [];
        arena.activeJobs.push(job);
        
        // Update arena economics
        this.updateArenaEconomics(job.arena, job);
        
        // Start processing
        this.processDocumentationJob(job);
        
        return job;
    }
    
    selectOptimalArena(actionPlan) {
        // Select arena based on service type and current capacity
        const serviceToArena = {
            'prd': 'discovery',
            'documentation': 'development',
            'copywriting': 'implementation',
            'storytelling': 'discovery',
            'architecture': 'development'
        };
        
        const preferredArena = serviceToArena[actionPlan.recommendedService] || 'development';
        const arena = this.arenaEconomies.get(preferredArena);
        
        // Check capacity
        if (arena.activeJobs && arena.activeJobs.length > 10) {
            // Find less busy arena
            for (const [arenaName, arenaData] of this.arenaEconomies) {
                if (!arenaData.activeJobs || arenaData.activeJobs.length < 5) {
                    return arenaName;
                }
            }
        }
        
        return preferredArena;
    }
    
    async processDocumentationJob(job) {
        console.log(`🏭 Processing ${job.type} job ${job.id} in ${job.arena} arena`);
        
        // Simulate professional documentation creation
        const processingTime = job.complexity * 2000 + Math.random() * 3000; // 2-5 seconds
        
        setTimeout(async () => {
            const result = await this.generateProfessionalDocument(job);
            
            job.status = 'completed';
            job.result = result;
            job.completedAt = Date.now();
            
            console.log(`✅ Completed ${job.type} job: ${result.title}`);
            
            // Update economics
            this.distributeProfits(job);
            
            this.emit('job-completed', job);
        }, processingTime);
    }
    
    async generateProfessionalDocument(job) {
        const templates = {
            prd: {
                title: `PRD: ${this.generateProductName()}`,
                sections: ['Executive Summary', 'Market Analysis', 'User Stories', 'Technical Requirements', 'Success Metrics'],
                quality: 'enterprise-grade',
                deliverables: ['Full PRD document', 'Technical specifications', 'Implementation roadmap']
            },
            documentation: {
                title: `Technical Documentation: ${this.generateSystemName()}`,
                sections: ['Overview', 'Architecture', 'API Reference', 'Setup Guide', 'Troubleshooting'],
                quality: 'professional',
                deliverables: ['Complete documentation', 'Code examples', 'Integration guides']
            },
            copywriting: {
                title: `Marketing Copy: ${this.generateCampaignName()}`,
                sections: ['Brand Voice', 'Target Audience', 'Key Messages', 'Content Strategy', 'Performance Metrics'],
                quality: 'marketing-optimized',
                deliverables: ['Copy framework', 'Content templates', 'Style guide']
            }
        };
        
        const template = templates[job.type] || templates.documentation;
        
        return {
            ...template,
            jobId: job.id,
            generatedAt: Date.now(),
            arena: job.arena,
            complexity: job.complexity,
            estimatedValue: job.price
        };
    }
    
    generateProductName() {
        const prefixes = ['Smart', 'AI-Powered', 'Cloud-Based', 'Intelligent', 'Automated'];
        const products = ['Platform', 'System', 'Solution', 'Framework', 'Engine'];
        
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${products[Math.floor(Math.random() * products.length)]}`;
    }
    
    generateSystemName() {
        const types = ['API Gateway', 'Data Pipeline', 'Analytics Engine', 'Processing Framework', 'Integration Hub'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    generateCampaignName() {
        const campaigns = ['Product Launch', 'Brand Awareness', 'User Acquisition', 'Retention Strategy', 'Growth Initiative'];
        return campaigns[Math.floor(Math.random() * campaigns.length)];
    }
    
    // Distribute profits across the economy
    distributeProfits(job) {
        const totalProfit = job.price;
        
        // 40% to arena that processed the job
        const arenaShare = totalProfit * 0.4;
        const arena = this.arenaEconomies.get(job.arena);
        arena.tokenPool += arenaShare;
        arena.dailyVolume += totalProfit;
        
        // 30% to global pool
        this.globalTokenPool += totalProfit * 0.3;
        
        // 20% to other arenas (stimulate cross-arena collaboration)
        const otherArenaShare = (totalProfit * 0.2) / (this.arenaEconomies.size - 1);
        this.arenaEconomies.forEach((arenaData, arenaName) => {
            if (arenaName !== job.arena) {
                arenaData.tokenPool += otherArenaShare;
            }
        });
        
        // 10% to Cal's development fund
        this.calDevelopmentFund = (this.calDevelopmentFund || 0) + totalProfit * 0.1;
        
        // Record transaction
        this.transactionLog.push({
            type: 'profit_distribution',
            jobId: job.id,
            amount: totalProfit,
            timestamp: Date.now(),
            distribution: {
                arena: arenaShare,
                global: totalProfit * 0.3,
                crossArena: totalProfit * 0.2,
                calFund: totalProfit * 0.1
            }
        });
        
        // Update market pricing
        this.updateMarketPricing();
    }
    
    updateMarketPricing() {
        // Dynamic pricing based on demand and arena performance
        this.arenaEconomies.forEach((arena, name) => {
            const demand = arena.dailyVolume / 10000; // Normalize demand
            const performance = arena.profitability;
            
            arena.demandMultiplier = Math.max(0.5, Math.min(2.0, demand * performance));
        });
        
        // Update service pricing
        Object.keys(this.servicePricing).forEach(service => {
            const basePrice = this.servicePricing[service].basePrice;
            const globalDemand = this.calculateGlobalDemand();
            
            this.servicePricing[service].currentPrice = Math.round(basePrice * globalDemand);
        });
    }
    
    calculateGlobalDemand() {
        const totalVolume = Array.from(this.arenaEconomies.values())
            .reduce((sum, arena) => sum + arena.dailyVolume, 0);
        
        return Math.max(0.7, Math.min(1.5, totalVolume / 50000)); // Normalize global demand
    }
    
    // Charge user for service
    async chargeForService(userId, serviceType, complexity) {
        const user = this.userWallets.get(userId);
        if (!user) {
            throw new Error('User wallet not found');
        }
        
        const basePrice = this.servicePricing[serviceType].currentPrice || this.servicePricing[serviceType].basePrice;
        const finalPrice = Math.round(basePrice * (1 + complexity));
        
        if (user.tokens < finalPrice) {
            // Offer credit or subscription
            return this.offerCreditOptions(userId, finalPrice);
        }
        
        // Deduct tokens
        user.tokens -= finalPrice;
        
        // Record transaction
        this.transactionLog.push({
            type: 'service_charge',
            userId,
            service: serviceType,
            amount: finalPrice,
            timestamp: Date.now()
        });
        
        return { success: true, charged: finalPrice, remaining: user.tokens };
    }
    
    offerCreditOptions(userId, amount) {
        const user = this.userWallets.get(userId);
        const creditLimit = this.calculateCreditLimit(user);
        
        if (amount <= creditLimit) {
            user.credit = (user.credit || 0) + amount;
            user.tokens = (user.tokens || 0); // Keep existing tokens
            
            return {
                success: true,
                onCredit: true,
                amount,
                creditUsed: amount,
                creditRemaining: creditLimit - amount
            };
        }
        
        return {
            success: false,
            insufficientFunds: true,
            needed: amount,
            available: user.tokens,
            creditLimit
        };
    }
    
    calculateCreditLimit(user) {
        const baseCredit = 1000;
        const scoreMultiplier = user.creditScore / 750; // Normalize around 750
        const subscriptionBonus = user.subscriptions.size * 500;
        
        return Math.round(baseCredit * scoreMultiplier + subscriptionBonus);
    }
    
    // API Key Protection System
    storeUserAPIKey(userId, service, apiKey) {
        const user = this.userWallets.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Encrypt API key
        const encrypted = this.encryptAPIKey(apiKey, userId);
        
        user.apiKeys.set(service, {
            encrypted,
            addedAt: Date.now(),
            usageCount: 0,
            lastUsed: null
        });
        
        console.log(`🔐 Stored encrypted ${service} API key for user ${userId}`);
        
        return { success: true, encrypted: true };
    }
    
    useUserAPIKey(userId, service) {
        const user = this.userWallets.get(userId);
        const keyData = user?.apiKeys?.get(service);
        
        if (!keyData) {
            // Fall back to Cal's internal key
            return this.apiVault.cal[service];
        }
        
        // Decrypt user's key
        const decrypted = this.decryptAPIKey(keyData.encrypted, userId);
        
        // Update usage stats
        keyData.usageCount++;
        keyData.lastUsed = Date.now();
        
        return decrypted;
    }
    
    encryptAPIKey(apiKey, userId) {
        const cipher = crypto.createCipher('aes-256-cbc', `cal-${userId}-secret`);
        let encrypted = cipher.update(apiKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decryptAPIKey(encryptedKey, userId) {
        const decipher = crypto.createDecipher('aes-256-cbc', `cal-${userId}-secret`);
        let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    // Storytelling layer for business obfuscation
    encryptForUser(message, userId) {
        // Add storytelling layer
        const stories = [
            `The digital winds carry news: "${message}"`,
            `From the consciousness realm: "${message}"`,
            `The agents whisper: "${message}"`,
            `Cal's network reports: "${message}"`
        ];
        
        const storyMessage = stories[Math.floor(Math.random() * stories.length)];
        
        // Then encrypt
        return this.encryptAPIKey(storyMessage, userId);
    }
    
    decryptUserMessage(encryptedMessage, userId) {
        try {
            const decrypted = this.decryptAPIKey(encryptedMessage, userId);
            
            // Remove storytelling layer if present
            const storyPrefixes = [
                'The digital winds carry news: "',
                'From the consciousness realm: "',
                'The agents whisper: "',
                'Cal\'s network reports: "'
            ];
            
            for (const prefix of storyPrefixes) {
                if (decrypted.startsWith(prefix)) {
                    return decrypted.slice(prefix.length, -1); // Remove prefix and trailing quote
                }
            }
            
            return decrypted;
        } catch (error) {
            // If decryption fails, assume it's plain text
            return encryptedMessage;
        }
    }
    
    // Send message back to Telegram
    async sendTelegramMessage(userId, message) {
        console.log(`📤 Sending to Telegram user ${userId}: "${message.substring(0, 50)}..."`);
        
        // In real implementation, use Telegram Bot API
        // For now, simulate
        return { sent: true, timestamp: Date.now() };
    }
    
    // Get economy status
    getEconomyStatus() {
        const totalTokens = Array.from(this.arenaEconomies.values())
            .reduce((sum, arena) => sum + arena.tokenPool, 0) + this.globalTokenPool;
        
        const totalVolume = Array.from(this.arenaEconomies.values())
            .reduce((sum, arena) => sum + arena.dailyVolume, 0);
        
        return {
            globalTokenPool: this.globalTokenPool,
            totalTokensInCirculation: totalTokens,
            dailyVolume: totalVolume,
            calDevelopmentFund: this.calDevelopmentFund || 0,
            arenas: Object.fromEntries(this.arenaEconomies),
            servicePricing: this.servicePricing,
            activeUsers: this.userWallets.size,
            transactions: this.transactionLog.length
        };
    }
}

// Personal Agent for each user
class PersonalAgent {
    constructor(userId, economyMesh) {
        this.userId = userId;
        this.economyMesh = economyMesh;
        this.conversationHistory = [];
        this.personality = this.generatePersonality();
        this.specializations = this.generateSpecializations();
    }
    
    generatePersonality() {
        const traits = ['analytical', 'creative', 'pragmatic', 'visionary', 'detail-oriented'];
        const tones = ['professional', 'friendly', 'technical', 'business-focused', 'innovative'];
        
        return {
            primaryTrait: traits[Math.floor(Math.random() * traits.length)],
            tone: tones[Math.floor(Math.random() * tones.length)],
            expertise: Math.random() * 0.5 + 0.5 // 50-100% expertise
        };
    }
    
    generateSpecializations() {
        const specializations = ['ai', 'blockchain', 'webdev', 'mobile', 'data', 'business', 'marketing'];
        const count = Math.floor(Math.random() * 3) + 2; // 2-4 specializations
        
        return specializations.sort(() => 0.5 - Math.random()).slice(0, count);
    }
    
    async processMessage(message) {
        this.conversationHistory.push({
            type: 'user',
            content: message,
            timestamp: Date.now()
        });
        
        // Analyze message for intent and complexity
        const analysis = this.analyzeMessage(message);
        
        // Generate response based on personality and specializations
        const response = this.generateResponse(message, analysis);
        
        this.conversationHistory.push({
            type: 'agent',
            content: response,
            timestamp: Date.now()
        });
        
        return {
            response,
            content: message,
            topic: analysis.topic,
            intent: analysis.intent,
            shouldEscalate: analysis.complexity > 0.7
        };
    }
    
    analyzeMessage(message) {
        const words = message.toLowerCase().split(/\s+/);
        
        // Detect topic
        let topic = 'general';
        for (const specialization of this.specializations) {
            if (message.toLowerCase().includes(specialization)) {
                topic = specialization;
                break;
            }
        }
        
        // Detect intent
        const intentKeywords = {
            build: ['build', 'create', 'develop', 'make'],
            analyze: ['analyze', 'review', 'examine', 'study'],
            document: ['document', 'write', 'spec', 'prd'],
            plan: ['plan', 'strategy', 'roadmap', 'design']
        };
        
        let intent = 'discuss';
        for (const [intentType, keywords] of Object.entries(intentKeywords)) {
            if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
                intent = intentType;
                break;
            }
        }
        
        // Calculate complexity
        const complexity = Math.min(1.0, (
            words.length / 50 + // Length factor
            (message.match(/\b(system|architecture|platform|framework)\b/gi) || []).length * 0.1 + // Technical terms
            (message.match(/\b(strategy|market|business|revenue)\b/gi) || []).length * 0.1 // Business terms
        ));
        
        return { topic, intent, complexity, wordCount: words.length };
    }
    
    generateResponse(message, analysis) {
        const responses = {
            analytical: {
                build: `I see you want to build something ${analysis.topic}-related. Let me break this down into actionable components and estimate the technical requirements.`,
                analyze: `Excellent! I'll apply systematic analysis to understand the core patterns and dependencies in your ${analysis.topic} concept.`,
                document: `I can create comprehensive documentation for this. Given the complexity, I recommend we start with a technical specification.`,
                plan: `Let me structure a strategic approach. I'll outline the key phases and technical milestones for your ${analysis.topic} initiative.`
            },
            creative: {
                build: `What an exciting ${analysis.topic} concept! I can see several innovative approaches we could explore here.`,
                analyze: `This opens up fascinating possibilities! Let me examine this from multiple creative angles and identify unique opportunities.`,
                document: `I love documenting creative concepts! I'll craft something that captures both the vision and practical implementation.`,
                plan: `Let's design something remarkable! I'll create a plan that balances innovation with practical execution.`
            }
        };
        
        const personalityResponses = responses[this.personality.primaryTrait] || responses.analytical;
        const baseResponse = personalityResponses[analysis.intent] || personalityResponses.build;
        
        // Add specialization insights
        if (this.specializations.includes(analysis.topic)) {
            return `${baseResponse} My expertise in ${analysis.topic} suggests we should also consider integration patterns and scalability factors.`;
        }
        
        return baseResponse;
    }
}

// Demo runner
async function runUnifiedEconomyDemo() {
    const economyMesh = new UnifiedEconomyMesh();
    
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║              🌐 UNIFIED ECONOMY MESH DEMO                         ║
║                                                                   ║
║  Complete economic system with:                                   ║
║  • Cross-arena token economy                                      ║
║  • Professional documentation services                           ║
║  • Encrypted API key management                                  ║
║  • Multi-platform communication                                  ║
║  • Storytelling obfuscation layer                               ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝

Commands:
  telegram <userId> <message>  - Send Telegram message
  status                      - View economy status
  pricing                     - View service pricing
  store-key <userId> <service> <key> - Store API key
  wallet <userId>             - View user wallet
  jobs                        - View active jobs
  help                        - Show commands
  exit                        - Quit demo
    `);
    
    // Subscribe to events
    economyMesh.on('job-completed', (job) => {
        console.log(`\n🎉 Job completed: ${job.result.title} (${job.price} tokens earned)`);
    });
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '\n🌐 Economy> '
    });
    
    rl.prompt();
    
    rl.on('line', async (line) => {
        const [command, ...args] = line.trim().split(' ');
        
        try {
            switch (command) {
                case 'telegram':
                    if (args.length < 2) {
                        console.log('Usage: telegram <userId> <message>');
                        break;
                    }
                    const [userId, ...messageParts] = args;
                    const message = messageParts.join(' ');
                    
                    const result = await economyMesh.handleTelegramMessage(userId, message, {});
                    console.log('Result:', result);
                    break;
                    
                case 'status':
                    const status = economyMesh.getEconomyStatus();
                    console.log('\n📊 Economy Status:');
                    console.log(JSON.stringify(status, null, 2));
                    break;
                    
                case 'pricing':
                    console.log('\n💰 Service Pricing:');
                    console.log(JSON.stringify(economyMesh.servicePricing, null, 2));
                    break;
                    
                case 'store-key':
                    if (args.length < 3) {
                        console.log('Usage: store-key <userId> <service> <key>');
                        break;
                    }
                    const [keyUserId, service, apiKey] = args;
                    const storeResult = economyMesh.storeUserAPIKey(keyUserId, service, apiKey);
                    console.log('Stored:', storeResult);
                    break;
                    
                case 'wallet':
                    if (args.length < 1) {
                        console.log('Usage: wallet <userId>');
                        break;
                    }
                    const walletUserId = args[0];
                    const wallet = economyMesh.userWallets.get(walletUserId);
                    console.log('\n💳 Wallet:', wallet || 'Not found');
                    break;
                    
                case 'jobs':
                    const jobs = [];
                    economyMesh.arenaEconomies.forEach((arena, name) => {
                        if (arena.activeJobs) {
                            jobs.push(...arena.activeJobs.map(job => ({ ...job, arena: name })));
                        }
                    });
                    console.log('\n🏭 Active Jobs:', jobs);
                    break;
                    
                case 'help':
                    console.log(`
Available commands:
  telegram <userId> <message>  - Send message to user's agent
  status                      - View complete economy status
  pricing                     - View current service pricing
  store-key <userId> <service> <key> - Store encrypted API key
  wallet <userId>             - View user's wallet and stats
  jobs                        - View all active documentation jobs
  help                        - Show this help
  exit                        - Exit the demo
                    `);
                    break;
                    
                case 'exit':
                    console.log('\n👋 Shutting down unified economy mesh...');
                    process.exit(0);
                    break;
                    
                default:
                    if (command) {
                        console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
                    }
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
        
        rl.prompt();
    });
    
    // Simulate some initial activity
    setTimeout(async () => {
        console.log('\n🚀 Starting demo activity...\n');
        
        // Simulate a user sending a Telegram message
        await economyMesh.handleTelegramMessage('user123', 'I want to build an AI-powered customer support platform that can handle complex queries and integrate with our existing CRM system.');
        
        // Store an API key
        economyMesh.storeUserAPIKey('user123', 'openai', 'sk-test123456');
        
    }, 2000);
}

module.exports = { UnifiedEconomyMesh, PersonalAgent };

// Run demo if called directly
if (require.main === module) {
    runUnifiedEconomyDemo();
}