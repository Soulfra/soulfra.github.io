// Stripe + API Token Routing System
// Logs all API events, generates receipts, tracks usage patterns

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class StripeAPIRouter {
    constructor() {
        this.vaultPath = path.join(__dirname, '../');
        this.logsPath = path.join(this.vaultPath, 'logs');
        this.exportsPath = path.join(this.vaultPath, 'exports');
        this.apiEvents = [];
        this.receipts = new Map();
        
        // Rate limiting and usage tracking
        this.hourlyLimits = {
            soft: 10,      // 10 calls per hour for soft mode
            platform: 1000  // 1000 calls per hour for platform mode
        };
        this.usageTracking = new Map();
    }

    async initialize() {
        await fs.mkdir(this.logsPath, { recursive: true });
        await fs.mkdir(this.exportsPath, { recursive: true });
        
        // Load existing API events
        await this.loadAPIEvents();
        
        console.log('💳 Stripe API Router initialized');
    }

    async routeAPICall(requestData) {
        const {
            agentId,
            apiType,           // 'anthropic', 'openai', 'whisper', etc.
            userMode,          // 'soft' or 'platform'
            apiToken,          // user's API token (optional)
            reflectionPrompt,  // what triggered this call
            sessionId,
            location
        } = requestData;

        const callId = this.generateCallId();
        const timestamp = new Date().toISOString();
        
        // Check rate limits
        const rateLimitCheck = await this.checkRateLimit(sessionId, userMode);
        if (!rateLimitCheck.allowed) {
            return {
                success: false,
                reason: 'rate_limit_exceeded',
                nextAvailable: rateLimitCheck.nextAvailable,
                upgrade: userMode === 'soft' ? 'Consider upgrading to Platform Mode for higher limits' : null
            };
        }

        // Determine routing strategy
        const routing = await this.determineRouting(apiToken, userMode, apiType);
        
        // Log the API event
        const apiEvent = {
            callId: callId,
            timestamp: timestamp,
            agentId: agentId,
            sessionId: sessionId,
            apiType: apiType,
            userMode: userMode,
            routing: routing,
            reflectionPrompt: reflectionPrompt ? reflectionPrompt.substring(0, 200) : null,
            location: location,
            cost: routing.cost,
            tokensEstimated: routing.tokensEstimated,
            status: 'initiated'
        };

        await this.logAPIEvent(apiEvent);
        
        // Generate receipt if this involves Stripe
        if (routing.paymentMethod === 'stripe') {
            await this.generateReceipt(callId, routing, requestData);
        }

        // Track usage
        await this.trackUsage(sessionId, userMode, routing);

        console.log(`🔀 API call routed: ${callId} via ${routing.method}`);

        return {
            success: true,
            callId: callId,
            routing: routing,
            receipt: routing.paymentMethod === 'stripe' ? await this.getReceipt(callId) : null
        };
    }

    async determineRouting(apiToken, userMode, apiType) {
        const baseRouting = {
            callId: this.generateCallId(),
            timestamp: new Date().toISOString(),
            apiType: apiType,
            userMode: userMode
        };

        // Platform mode with BYOK (Bring Your Own Key)
        if (userMode === 'platform' && apiToken) {
            return {
                ...baseRouting,
                method: 'byok',
                paymentMethod: 'user_token',
                apiToken: apiToken.substring(0, 8) + '...',
                cost: 0.0,
                tokensEstimated: this.estimateTokens(apiType),
                provider: this.getProviderFromToken(apiToken)
            };
        }

        // Platform mode with Stripe per-call billing
        if (userMode === 'platform' && !apiToken) {
            return {
                ...baseRouting,
                method: 'stripe_per_call',
                paymentMethod: 'stripe',
                cost: 0.01,
                tokensEstimated: this.estimateTokens(apiType),
                provider: 'soulfra_managed'
            };
        }

        // Soft mode - always Stripe with flat rate
        return {
            ...baseRouting,
            method: 'stripe_flat_rate',
            paymentMethod: 'stripe',
            cost: 1.00,
            tokensEstimated: this.estimateTokens(apiType),
            provider: 'soulfra_managed',
            billing: 'per_export'
        };
    }

    estimateTokens(apiType) {
        const estimates = {
            'anthropic': 1500,
            'openai': 1200,
            'whisper': 800,
            'reflection': 2000,
            'voice': 600
        };
        return estimates[apiType] || 1000;
    }

    getProviderFromToken(apiToken) {
        if (apiToken.startsWith('sk-ant-')) return 'anthropic';
        if (apiToken.startsWith('sk-')) return 'openai';
        if (apiToken.startsWith('whisper-')) return 'openai';
        return 'unknown';
    }

    async checkRateLimit(sessionId, userMode) {
        const now = new Date();
        const hourKey = `${sessionId}-${now.getUTCHours()}`;
        
        const usage = this.usageTracking.get(hourKey) || { count: 0, resetAt: new Date(now.getTime() + 60 * 60 * 1000) };
        const limit = this.hourlyLimits[userMode];

        if (usage.count >= limit) {
            return {
                allowed: false,
                currentUsage: usage.count,
                limit: limit,
                nextAvailable: usage.resetAt
            };
        }

        return { allowed: true };
    }

    async trackUsage(sessionId, userMode, routing) {
        const now = new Date();
        const hourKey = `${sessionId}-${now.getUTCHours()}`;
        
        const usage = this.usageTracking.get(hourKey) || { 
            count: 0, 
            cost: 0, 
            tokens: 0,
            resetAt: new Date(now.getTime() + 60 * 60 * 1000)
        };
        
        usage.count += 1;
        usage.cost += routing.cost;
        usage.tokens += routing.tokensEstimated;
        
        this.usageTracking.set(hourKey, usage);

        // Log usage pattern
        await this.logUsagePattern(sessionId, userMode, routing, usage);
    }

    async generateReceipt(callId, routing, requestData) {
        const receipt = {
            receiptId: `rec_${callId}`,
            callId: callId,
            timestamp: new Date().toISOString(),
            agentId: requestData.agentId,
            sessionId: requestData.sessionId,
            userMode: requestData.userMode,
            amount: routing.cost,
            currency: 'USD',
            paymentMethod: routing.paymentMethod,
            description: `Soulfra Mirror API - ${routing.apiType}`,
            items: [
                {
                    description: `${routing.apiType} API call`,
                    quantity: 1,
                    unitPrice: routing.cost,
                    total: routing.cost
                }
            ],
            metadata: {
                reflectionPrompt: requestData.reflectionPrompt?.substring(0, 100),
                tokensEstimated: routing.tokensEstimated,
                location: requestData.location,
                routing: routing.method
            },
            stripe: {
                paymentIntent: `pi_${crypto.randomBytes(12).toString('hex')}`,
                status: 'succeeded'
            }
        };

        // Save receipt
        const agentReceiptDir = path.join(this.exportsPath, requestData.agentId);
        await fs.mkdir(agentReceiptDir, { recursive: true });
        
        const receiptPath = path.join(agentReceiptDir, `receipt-${callId}.json`);
        await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2));

        this.receipts.set(callId, receipt);
        
        console.log(`📧 Receipt generated: ${receipt.receiptId}`);
        return receipt;
    }

    async logAPIEvent(apiEvent) {
        this.apiEvents.push(apiEvent);
        
        // Keep last 10,000 events in memory
        if (this.apiEvents.length > 10000) {
            this.apiEvents = this.apiEvents.slice(-10000);
        }

        await this.saveAPIEvents();
    }

    async logUsagePattern(sessionId, userMode, routing, currentUsage) {
        const usageLogPath = path.join(this.logsPath, 'usage-patterns.json');
        
        let patterns = { sessions: [], hourly: [], insights: [] };
        try {
            const existing = await fs.readFile(usageLogPath, 'utf8');
            patterns = JSON.parse(existing);
        } catch {
            // New file
        }

        // Log this usage event
        patterns.sessions.push({
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            userMode: userMode,
            apiType: routing.apiType,
            cost: routing.cost,
            tokens: routing.tokensEstimated,
            method: routing.method,
            hourlyUsage: currentUsage.count,
            triggeringReflection: routing.reflectionPrompt
        });

        // Analyze patterns (simple insights)
        const insights = this.generateUsageInsights(patterns.sessions);
        patterns.insights = insights;

        // Keep last 1000 session events
        if (patterns.sessions.length > 1000) {
            patterns.sessions = patterns.sessions.slice(-1000);
        }

        await fs.writeFile(usageLogPath, JSON.stringify(patterns, null, 2));
    }

    generateUsageInsights(sessions) {
        if (sessions.length < 10) return [];

        const recent = sessions.slice(-100);
        const insights = [];

        // Time of day analysis
        const hourCounts = {};
        recent.forEach(s => {
            const hour = new Date(s.timestamp).getUTCHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const peakHour = Object.keys(hourCounts).reduce((a, b) => 
            hourCounts[a] > hourCounts[b] ? a : b
        );
        
        insights.push({
            type: 'peak_usage_time',
            value: `${peakHour}:00 UTC`,
            confidence: 0.8
        });

        // Mode preference analysis
        const modeDistribution = recent.reduce((acc, s) => {
            acc[s.userMode] = (acc[s.userMode] || 0) + 1;
            return acc;
        }, {});

        if (modeDistribution.platform > modeDistribution.soft) {
            insights.push({
                type: 'user_preference',
                value: 'platform_mode_preferred',
                confidence: 0.9
            });
        }

        // Common reflection triggers
        const triggers = recent
            .filter(s => s.triggeringReflection)
            .map(s => s.triggeringReflection.toLowerCase())
            .reduce((acc, t) => {
                acc[t] = (acc[t] || 0) + 1;
                return acc;
            }, {});

        const topTrigger = Object.keys(triggers).reduce((a, b) => 
            triggers[a] > triggers[b] ? a : b, ''
        );

        if (topTrigger) {
            insights.push({
                type: 'common_reflection',
                value: topTrigger,
                confidence: 0.7
            });
        }

        return insights;
    }

    async loadAPIEvents() {
        try {
            const eventsPath = path.join(this.logsPath, 'api-events.json');
            const data = await fs.readFile(eventsPath, 'utf8');
            const parsed = JSON.parse(data);
            this.apiEvents = parsed.events || [];
        } catch {
            this.apiEvents = [];
        }
    }

    async saveAPIEvents() {
        const eventsPath = path.join(this.logsPath, 'api-events.json');
        const eventData = {
            lastUpdated: new Date().toISOString(),
            totalEvents: this.apiEvents.length,
            events: this.apiEvents
        };
        
        await fs.writeFile(eventsPath, JSON.stringify(eventData, null, 2));
    }

    async getReceipt(callId) {
        return this.receipts.get(callId);
    }

    async getAllReceipts(agentId) {
        const agentReceiptDir = path.join(this.exportsPath, agentId);
        try {
            const files = await fs.readdir(agentReceiptDir);
            const receipts = [];
            
            for (const file of files) {
                if (file.startsWith('receipt-') && file.endsWith('.json')) {
                    const receiptPath = path.join(agentReceiptDir, file);
                    const receiptData = await fs.readFile(receiptPath, 'utf8');
                    receipts.push(JSON.parse(receiptData));
                }
            }
            
            return receipts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch {
            return [];
        }
    }

    generateCallId() {
        return 'call_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
    }

    async getUsageStats(sessionId, timeRange = '24h') {
        const now = new Date();
        const cutoff = new Date(now.getTime() - (timeRange === '24h' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
        
        const recentEvents = this.apiEvents.filter(event => 
            event.sessionId === sessionId && 
            new Date(event.timestamp) > cutoff
        );

        return {
            totalCalls: recentEvents.length,
            totalCost: recentEvents.reduce((sum, e) => sum + (e.cost || 0), 0),
            apiTypes: recentEvents.reduce((acc, e) => {
                acc[e.apiType] = (acc[e.apiType] || 0) + 1;
                return acc;
            }, {}),
            timeRange: timeRange
        };
    }
}

module.exports = StripeAPIRouter;