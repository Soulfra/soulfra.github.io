// API Fallback Checker - Determines when to use cloud APIs vs local processing
const fs = require('fs').promises;
const path = require('path');

class APIFallbackChecker {
    constructor() {
        this.configPath = path.join(__dirname, '../mirroros/mode-switcher.json');
        this.usagePath = path.join(__dirname, '../vault/logs/api-usage.json');
        this.rateLimits = {
            soft: {
                maxCallsPerHour: 10,
                maxCallsPerDay: 50,
                cooldownMs: 60000 // 1 minute between calls
            },
            platform: {
                maxCallsPerHour: 100,
                maxCallsPerDay: 1000,
                cooldownMs: 5000 // 5 seconds between calls
            }
        };
        this.memoryThresholds = {
            warningMB: 40,
            criticalMB: 45,
            maxMB: 50
        };
    }
    
    async checkAPIAvailability(sessionId, context = {}) {
        console.log('🔍 Checking API availability for session:', sessionId);
        
        try {
            // Load current mode
            const mode = await this.getCurrentMode();
            
            // Check mode-specific rules
            const modeCheck = await this.checkModeRestrictions(mode, context);
            if (!modeCheck.allowed) {
                return modeCheck;
            }
            
            // Check rate limits
            const rateCheck = await this.checkRateLimits(sessionId, mode);
            if (!rateCheck.allowed) {
                return rateCheck;
            }
            
            // Check memory pressure
            const memoryCheck = this.checkMemoryPressure(context.memoryUsage);
            if (!memoryCheck.allowed) {
                return memoryCheck;
            }
            
            // Check user preference
            const preferenceCheck = this.checkUserPreference(context);
            if (!preferenceCheck.allowed) {
                return preferenceCheck;
            }
            
            // All checks passed
            return {
                allowed: true,
                mode: mode,
                reason: 'All checks passed',
                recommendations: this.generateRecommendations(mode, context)
            };
            
        } catch (error) {
            console.error('Error checking API availability:', error);
            return {
                allowed: false,
                reason: 'Error checking availability',
                fallback: 'local',
                error: error.message
            };
        }
    }
    
    async getCurrentMode() {
        try {
            const config = JSON.parse(await fs.readFile(this.configPath, 'utf-8'));
            return config.activeMode || 'soft';
        } catch {
            return 'soft'; // Default to soft mode
        }
    }
    
    async checkModeRestrictions(mode, context) {
        if (mode === 'soft') {
            // Soft mode restrictions
            if (!context.userConfirmed && !context.allowCloud) {
                return {
                    allowed: false,
                    reason: 'Cloud API disabled in Soft Mode',
                    suggestion: 'Enable cloud access in settings or use local processing',
                    fallback: 'local'
                };
            }
            
            // Check if it's a sensitive query
            if (this.isSensitiveContent(context.prompt)) {
                return {
                    allowed: false,
                    reason: 'Sensitive content detected - keeping it local',
                    fallback: 'local',
                    privacy: true
                };
            }
        }
        
        return { allowed: true };
    }
    
    async checkRateLimits(sessionId, mode) {
        const limits = this.rateLimits[mode] || this.rateLimits.soft;
        const usage = await this.getUsageStats(sessionId);
        
        // Check cooldown
        const timeSinceLastCall = Date.now() - (usage.lastCall || 0);
        if (timeSinceLastCall < limits.cooldownMs) {
            return {
                allowed: false,
                reason: 'Rate limit cooldown',
                waitMs: limits.cooldownMs - timeSinceLastCall,
                fallback: 'local'
            };
        }
        
        // Check hourly limit
        const hourlyCount = this.getHourlyCount(usage.calls);
        if (hourlyCount >= limits.maxCallsPerHour) {
            return {
                allowed: false,
                reason: 'Hourly API limit reached',
                limit: limits.maxCallsPerHour,
                current: hourlyCount,
                resetIn: this.getTimeUntilReset('hour'),
                fallback: 'local'
            };
        }
        
        // Check daily limit
        const dailyCount = this.getDailyCount(usage.calls);
        if (dailyCount >= limits.maxCallsPerDay) {
            return {
                allowed: false,
                reason: 'Daily API limit reached',
                limit: limits.maxCallsPerDay,
                current: dailyCount,
                resetIn: this.getTimeUntilReset('day'),
                fallback: 'local'
            };
        }
        
        return { allowed: true };
    }
    
    checkMemoryPressure(memoryUsageMB = 0) {
        if (memoryUsageMB >= this.memoryThresholds.criticalMB) {
            return {
                allowed: false,
                reason: 'Critical memory pressure',
                usage: memoryUsageMB,
                threshold: this.memoryThresholds.criticalMB,
                fallback: 'local',
                recommendation: 'Clear memory before using cloud API'
            };
        }
        
        if (memoryUsageMB >= this.memoryThresholds.warningMB) {
            // Allow but with warning
            return {
                allowed: true,
                warning: 'High memory usage',
                usage: memoryUsageMB,
                threshold: this.memoryThresholds.warningMB
            };
        }
        
        return { allowed: true };
    }
    
    checkUserPreference(context) {
        // Check explicit user preference
        if (context.preferLocal === true) {
            return {
                allowed: false,
                reason: 'User prefers local processing',
                fallback: 'local',
                respectingPreference: true
            };
        }
        
        // Check session-level preference
        if (context.sessionConfig?.localOnly === true) {
            return {
                allowed: false,
                reason: 'Session configured for local-only',
                fallback: 'local'
            };
        }
        
        return { allowed: true };
    }
    
    isSensitiveContent(prompt) {
        if (!prompt) return false;
        
        const sensitivePatterns = [
            /\b(password|secret|private key|api key)\b/i,
            /\b(ssn|social security)\b/i,
            /\b(credit card|bank account|routing number)\b/i,
            /\b(medical|health|diagnosis|prescription)\b/i,
            /\b(confidential|classified|restricted)\b/i
        ];
        
        return sensitivePatterns.some(pattern => pattern.test(prompt));
    }
    
    async getUsageStats(sessionId) {
        try {
            const usage = JSON.parse(await fs.readFile(this.usagePath, 'utf-8'));
            return usage[sessionId] || { calls: [], lastCall: 0 };
        } catch {
            return { calls: [], lastCall: 0 };
        }
    }
    
    async updateUsageStats(sessionId, callData) {
        let usage = {};
        
        try {
            usage = JSON.parse(await fs.readFile(this.usagePath, 'utf-8'));
        } catch {
            // New file
        }
        
        if (!usage[sessionId]) {
            usage[sessionId] = { calls: [], lastCall: 0 };
        }
        
        usage[sessionId].calls.push({
            timestamp: Date.now(),
            ...callData
        });
        
        usage[sessionId].lastCall = Date.now();
        
        // Clean old entries (keep last 24 hours)
        const cutoff = Date.now() - 86400000;
        usage[sessionId].calls = usage[sessionId].calls.filter(
            call => call.timestamp > cutoff
        );
        
        await fs.mkdir(path.dirname(this.usagePath), { recursive: true });
        await fs.writeFile(this.usagePath, JSON.stringify(usage, null, 2));
    }
    
    getHourlyCount(calls) {
        const hourAgo = Date.now() - 3600000;
        return calls.filter(call => call.timestamp > hourAgo).length;
    }
    
    getDailyCount(calls) {
        const dayAgo = Date.now() - 86400000;
        return calls.filter(call => call.timestamp > dayAgo).length;
    }
    
    getTimeUntilReset(period) {
        const now = new Date();
        
        if (period === 'hour') {
            const nextHour = new Date(now);
            nextHour.setHours(now.getHours() + 1, 0, 0, 0);
            return nextHour.getTime() - now.getTime();
        }
        
        if (period === 'day') {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow.getTime() - now.getTime();
        }
        
        return 0;
    }
    
    generateRecommendations(mode, context) {
        const recommendations = [];
        
        if (mode === 'soft') {
            recommendations.push('Consider enabling local-first mode for better privacy');
            
            if (context.memoryUsage > 20) {
                recommendations.push('High memory usage - local processing recommended');
            }
        }
        
        if (mode === 'platform') {
            if (context.promptComplexity === 'high') {
                recommendations.push('Complex query - cloud API recommended for best results');
            }
            
            if (context.batchProcessing) {
                recommendations.push('Batch multiple prompts to optimize API usage');
            }
        }
        
        return recommendations;
    }
    
    async generateFallbackResponse(prompt, context = {}) {
        // Generate a helpful local response when API is not available
        const reason = context.reason || 'API unavailable';
        
        const responses = {
            'Rate limit cooldown': `I'm processing locally to respect rate limits. Let me reflect on: "${prompt.substring(0, 50)}..."`,
            'Hourly API limit reached': `We've used our hourly cloud allowance. Here's my local perspective on your question...`,
            'Daily API limit reached': `Daily cloud limit reached. Good news - I can still help locally! Regarding your question...`,
            'Critical memory pressure': `Running low on memory, so I'll keep this local and efficient. About your query...`,
            'User prefers local processing': `Keeping it local as requested. Here's my reflection...`,
            'Sensitive content detected': `I'll handle this privately on your device. Let me help with that...`,
            'Cloud API disabled in Soft Mode': `In Soft Mode, I process things gently and locally. Let me think about this...`
        };
        
        const baseResponse = responses[reason] || `Processing locally: ${reason}`;
        
        return {
            response: baseResponse,
            type: 'local_fallback',
            reason: reason,
            capabilities: this.getLocalCapabilities()
        };
    }
    
    getLocalCapabilities() {
        return [
            'Basic pattern matching',
            'Reflection and rephrasing',
            'Simple Q&A',
            'Emotional support',
            'Privacy-preserving processing',
            'Offline availability'
        ];
    }
    
    async checkWhisperAvailability() {
        // Check if Whisper.js or similar is available for local transcription
        return {
            available: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
            fallback: 'browser_speech_api',
            quality: 'good',
            languages: ['en-US', 'en-GB', 'es-ES', 'fr-FR']
        };
    }
    
    async estimateCost(prompt, model = 'claude-3-sonnet') {
        const tokenEstimate = Math.ceil(prompt.length / 4);
        const responseEstimate = tokenEstimate * 2;
        const totalTokens = tokenEstimate + responseEstimate;
        
        const costs = {
            'claude-3-sonnet': 0.000003,
            'gpt-3.5-turbo': 0.000002,
            'gpt-4': 0.00003
        };
        
        const costPerToken = costs[model] || costs['claude-3-sonnet'];
        
        return {
            inputTokens: tokenEstimate,
            outputTokens: responseEstimate,
            totalTokens: totalTokens,
            estimatedCost: totalTokens * costPerToken,
            model: model
        };
    }
}

module.exports = APIFallbackChecker;