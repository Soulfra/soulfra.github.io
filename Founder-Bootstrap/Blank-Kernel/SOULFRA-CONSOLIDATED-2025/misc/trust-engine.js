// Trust Engine - Monitors user behavior and calculates trust score for mode recommendations
const fs = require('fs').promises;
const path = require('path');

class TrustEngine {
    constructor() {
        this.configPath = path.join(__dirname, '../mirroros/mode-switcher.json');
        this.metricsPath = path.join(__dirname, '../vault/logs/trust-metrics.json');
        this.scoreWeights = {
            exportActivity: 0.25,
            forkActivity: 0.20,
            technicalQueries: 0.20,
            sessionDepth: 0.15,
            emotionalVulnerability: 0.10,
            consistentUsage: 0.10
        };
        
        this.behaviorPatterns = {
            builder: {
                indicators: [
                    'frequent_exports',
                    'multiple_forks',
                    'api_questions',
                    'technical_language',
                    'integration_queries'
                ],
                scoreBoost: 0.15
            },
            explorer: {
                indicators: [
                    'deep_conversations',
                    'emotional_sharing',
                    'consistent_returns',
                    'personal_growth_focus'
                ],
                scoreBoost: 0.05
            }
        };
    }
    
    async calculateTrustScore(sessionData) {
        console.log('🔐 Calculating trust score...');
        
        const config = await this.loadConfig();
        const metrics = await this.loadMetrics();
        
        // Calculate component scores
        const scores = {
            exportActivity: this.calculateExportScore(metrics, sessionData),
            forkActivity: this.calculateForkScore(metrics, sessionData),
            technicalQueries: this.calculateTechnicalScore(sessionData),
            sessionDepth: this.calculateDepthScore(sessionData),
            emotionalVulnerability: this.calculateEmotionalScore(sessionData),
            consistentUsage: this.calculateConsistencyScore(metrics)
        };
        
        // Calculate weighted score
        let trustScore = 0;
        for (const [component, weight] of Object.entries(this.scoreWeights)) {
            trustScore += scores[component] * weight;
        }
        
        // Apply pattern bonuses
        const patternBonus = this.detectBehaviorPatterns(sessionData, metrics);
        trustScore = Math.min(1.0, trustScore + patternBonus);
        
        // Update config
        config.trustScore = trustScore;
        config.metrics.totalInteractions++;
        
        // Check for upgrade trigger
        const shouldPromptUpgrade = this.checkUpgradeTriggers(config, trustScore);
        
        await this.saveConfig(config);
        await this.updateMetrics(metrics, sessionData, scores);
        
        return {
            trustScore: trustScore,
            components: scores,
            shouldPromptUpgrade: shouldPromptUpgrade,
            behaviorType: this.classifyBehavior(scores),
            recommendation: this.generateRecommendation(trustScore, config)
        };
    }
    
    calculateExportScore(metrics, sessionData) {
        const recentExports = sessionData.exportAttempts || 0;
        const historicalExports = metrics.totalExports || 0;
        const exportFrequency = historicalExports / Math.max(1, metrics.totalSessions);
        
        // Normalize to 0-1 scale
        const score = Math.min(1, (recentExports * 0.3 + exportFrequency * 0.7) / 5);
        return score;
    }
    
    calculateForkScore(metrics, sessionData) {
        const recentForks = sessionData.forkCount || 0;
        const historicalForks = metrics.totalForks || 0;
        const forkComplexity = sessionData.forkComplexity || 0; // Remix, guardian upgrades, etc.
        
        const score = Math.min(1, (recentForks * 0.4 + historicalForks * 0.3 + forkComplexity * 0.3) / 10);
        return score;
    }
    
    calculateTechnicalScore(sessionData) {
        const technicalKeywords = [
            'api', 'webhook', 'integration', 'export', 'json', 'database',
            'authentication', 'deployment', 'scaling', 'performance',
            'sdk', 'endpoint', 'callback', 'async', 'promise'
        ];
        
        const queries = sessionData.queries || [];
        let technicalCount = 0;
        
        queries.forEach(query => {
            const lowerQuery = query.toLowerCase();
            technicalCount += technicalKeywords.filter(keyword => 
                lowerQuery.includes(keyword)
            ).length;
        });
        
        const score = Math.min(1, technicalCount / 10);
        return score;
    }
    
    calculateDepthScore(sessionData) {
        const messageCount = sessionData.messageCount || 0;
        const sessionDuration = sessionData.duration || 0;
        const avgMessageLength = sessionData.avgMessageLength || 0;
        
        // Depth indicators
        const depthFactors = {
            longSession: sessionDuration > 1800000 ? 0.3 : 0, // 30+ minutes
            manyMessages: messageCount > 20 ? 0.3 : messageCount / 66.67,
            thoughtfulMessages: avgMessageLength > 100 ? 0.4 : avgMessageLength / 250
        };
        
        const score = Object.values(depthFactors).reduce((a, b) => a + b, 0);
        return Math.min(1, score);
    }
    
    calculateEmotionalScore(sessionData) {
        const emotionalMarkers = [
            'feel', 'felt', 'feeling', 'emotion', 'afraid', 'worried',
            'anxious', 'happy', 'sad', 'angry', 'frustrated', 'confused',
            'overwhelmed', 'lost', 'stuck', 'struggling', 'help me'
        ];
        
        const messages = sessionData.messages || [];
        let emotionalCount = 0;
        let vulnerabilityScore = 0;
        
        messages.forEach(msg => {
            const lowerMsg = msg.toLowerCase();
            const markers = emotionalMarkers.filter(marker => lowerMsg.includes(marker));
            emotionalCount += markers.length;
            
            // Deep vulnerability indicators
            if (lowerMsg.includes('i don\'t know') || 
                lowerMsg.includes('i\'m scared') ||
                lowerMsg.includes('help me')) {
                vulnerabilityScore += 0.2;
            }
        });
        
        const score = Math.min(1, (emotionalCount / 20) * 0.5 + vulnerabilityScore * 0.5);
        return score;
    }
    
    calculateConsistencyScore(metrics) {
        const daysSinceFirst = (Date.now() - new Date(metrics.firstSession || Date.now())) / 86400000;
        const sessionsPerDay = metrics.totalSessions / Math.max(1, daysSinceFirst);
        const returnRate = metrics.returningSessions / Math.max(1, metrics.totalSessions);
        
        const score = Math.min(1, sessionsPerDay * 0.5 + returnRate * 0.5);
        return score;
    }
    
    detectBehaviorPatterns(sessionData, metrics) {
        let patternBonus = 0;
        
        // Check builder pattern
        const builderIndicators = {
            frequent_exports: (sessionData.exportAttempts || 0) > 2,
            multiple_forks: (sessionData.forkCount || 0) > 1,
            api_questions: (sessionData.queries || []).some(q => 
                q.toLowerCase().includes('api') || q.toLowerCase().includes('integrate')),
            technical_language: this.calculateTechnicalScore(sessionData) > 0.5
        };
        
        const builderMatches = Object.values(builderIndicators).filter(Boolean).length;
        if (builderMatches >= 3) {
            patternBonus += this.behaviorPatterns.builder.scoreBoost;
        }
        
        // Check explorer pattern
        const explorerIndicators = {
            deep_conversations: this.calculateDepthScore(sessionData) > 0.6,
            emotional_sharing: this.calculateEmotionalScore(sessionData) > 0.4,
            consistent_returns: metrics.returningSessions > 5
        };
        
        const explorerMatches = Object.values(explorerIndicators).filter(Boolean).length;
        if (explorerMatches >= 2) {
            patternBonus += this.behaviorPatterns.explorer.scoreBoost;
        }
        
        return patternBonus;
    }
    
    checkUpgradeTriggers(config, trustScore) {
        // Don't prompt if already in platform mode
        if (config.activeMode === 'platform') return false;
        
        // Don't prompt if recently dismissed
        if (config.lastUpgradePrompt) {
            const daysSincePrompt = (Date.now() - new Date(config.lastUpgradePrompt)) / 86400000;
            if (daysSincePrompt < 7) return false;
        }
        
        // Check trust score threshold
        if (trustScore >= config.upgradeThreshold) return true;
        
        // Check activity triggers
        if (config.triggers.autoUpgradeEnabled) {
            if (config.metrics.forkCount >= config.triggers.promptAfterForks) return true;
            if (config.metrics.exportAttempts >= config.triggers.promptAfterExports) return true;
        }
        
        return false;
    }
    
    classifyBehavior(scores) {
        const sortedScores = Object.entries(scores)
            .sort((a, b) => b[1] - a[1]);
        
        const topBehavior = sortedScores[0][0];
        
        const behaviorMap = {
            exportActivity: 'builder',
            forkActivity: 'architect',
            technicalQueries: 'developer',
            sessionDepth: 'explorer',
            emotionalVulnerability: 'seeker',
            consistentUsage: 'regular'
        };
        
        return behaviorMap[topBehavior] || 'balanced';
    }
    
    generateRecommendation(trustScore, config) {
        if (config.activeMode === 'platform') {
            if (trustScore < 0.3) {
                return "You might find Soft Mode more comfortable for personal reflection.";
            }
            return "Platform Mode suits your builder mindset perfectly!";
        }
        
        // In soft mode
        if (trustScore >= 0.8) {
            return "You're ready for Platform Mode! Unlock powerful builder tools when you're ready.";
        } else if (trustScore >= 0.6) {
            return "You're exploring deeper features. Platform Mode is available when you need it.";
        } else if (trustScore >= 0.4) {
            return "Soft Mode is perfect for your current journey. Take your time.";
        }
        
        return "Enjoy the gentle space of Soft Mode. I'm here when you need me.";
    }
    
    async updateMetrics(metrics, sessionData, scores) {
        // Update metrics with session data
        metrics.totalSessions = (metrics.totalSessions || 0) + 1;
        metrics.totalExports = (metrics.totalExports || 0) + (sessionData.exportAttempts || 0);
        metrics.totalForks = (metrics.totalForks || 0) + (sessionData.forkCount || 0);
        
        if (!metrics.firstSession) {
            metrics.firstSession = new Date().toISOString();
        }
        
        metrics.lastSession = new Date().toISOString();
        metrics.lastScores = scores;
        
        // Track returning sessions
        if (sessionData.isReturning) {
            metrics.returningSessions = (metrics.returningSessions || 0) + 1;
        }
        
        await this.saveMetrics(metrics);
    }
    
    async monitorRealtime(userId, action, data = {}) {
        // Real-time trust score updates for specific actions
        const actionWeights = {
            'export_attempt': 0.05,
            'fork_created': 0.08,
            'technical_query': 0.03,
            'emotional_share': 0.02,
            'session_start': 0.01,
            'upgrade_interest': 0.10
        };
        
        const weight = actionWeights[action] || 0;
        if (weight === 0) return;
        
        const config = await this.loadConfig();
        
        // Apply incremental update
        config.trustScore = Math.min(1.0, config.trustScore + weight);
        
        // Update specific metrics
        if (action === 'export_attempt') config.metrics.exportAttempts++;
        if (action === 'fork_created') config.metrics.forkCount++;
        
        await this.saveConfig(config);
        
        return {
            newScore: config.trustScore,
            action: action,
            impact: weight
        };
    }
    
    async loadConfig() {
        try {
            const content = await fs.readFile(this.configPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading config:', error);
            return {};
        }
    }
    
    async saveConfig(config) {
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    async loadMetrics() {
        try {
            const content = await fs.readFile(this.metricsPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            // Initialize if doesn't exist
            return {
                totalSessions: 0,
                totalExports: 0,
                totalForks: 0,
                returningSessions: 0,
                firstSession: null,
                lastSession: null
            };
        }
    }
    
    async saveMetrics(metrics) {
        await fs.mkdir(path.dirname(this.metricsPath), { recursive: true });
        await fs.writeFile(this.metricsPath, JSON.stringify(metrics, null, 2));
    }
}

module.exports = TrustEngine;