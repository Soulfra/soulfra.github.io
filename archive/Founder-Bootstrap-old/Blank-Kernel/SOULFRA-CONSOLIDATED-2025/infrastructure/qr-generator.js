// QR Generator - Affiliate Engine for Cal Fork Distribution
// Creates QR codes for fork invites and tracks affiliate performance
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class QRGenerator {
    constructor() {
        this.qrDir = __dirname;
        this.affiliateMapPath = path.join(this.qrDir, 'affiliate-map.json');
        this.qrCodesPath = path.join(this.qrDir, 'generated-qr-codes.json');
        this.forkTrackingPath = path.join(__dirname, '../reflection-maps/agent-forks.json');
        this.loopEventsPath = path.join(__dirname, '../vault-sync-core/logs/loop-events.json');
        
        // QR code types for different invitation scenarios
        this.qrTypes = {
            'fork-invite': {
                description: 'Invite someone to fork your Cal instance',
                reward: 'access_credits',
                baseUrl: 'https://mirror.local/fork/'
            },
            'agent-share': {
                description: 'Share a specific agent build',
                reward: 'performance_bonus',
                baseUrl: 'https://mirror.local/agent/'
            },
            'experience-invite': {
                description: 'Share your Cal conversation experience',
                reward: 'memory_unlock',
                baseUrl: 'https://mirror.local/experience/'
            },
            'platform-demo': {
                description: 'Demo the full platform to prospects',
                reward: 'revenue_share',
                baseUrl: 'https://mirror.local/demo/'
            }
        };
        
        // Reward structure for affiliate performance
        this.rewardStructure = {
            access_credits: {
                per_fork: 10,          // Credits per successful fork
                per_active_user: 25,   // Credits per user who stays active
                threshold_bonus: 100   // Bonus at 10 successful forks
            },
            performance_bonus: {
                per_export: 5,         // Bonus when forked agent exports
                per_monetization: 50,  // Bonus when fork generates revenue
                viral_multiplier: 2    // 2x bonus if their fork spreads
            },
            memory_unlock: {
                conversation_depth: 'unlock_advanced_memory',
                reflection_quality: 'unlock_deep_insights',
                usage_consistency: 'unlock_priority_routing'
            },
            revenue_share: {
                direct_sales: 0.15,    // 15% of direct sales from QR
                platform_growth: 0.05, // 5% of platform revenue growth
                enterprise_deals: 0.25  // 25% of enterprise conversions
            }
        };
        
        this.affiliateStats = {
            totalQRCodes: 0,
            activeAffiliates: 0,
            totalForks: 0,
            totalRewardsDistributed: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('📱 Initializing QR Affiliate Engine...');
        
        await this.loadExistingData();
        
        console.log('✅ QR Generator ready - affiliate tracking active');
    }
    
    async loadExistingData() {
        try {
            // Load affiliate map
            const affiliateContent = await fs.readFile(this.affiliateMapPath, 'utf8');
            const affiliateData = JSON.parse(affiliateContent);
            
            this.affiliateStats = affiliateData.stats || this.affiliateStats;
            
            console.log(`👥 Loaded ${this.affiliateStats.activeAffiliates} active affiliates`);
        } catch {
            // Initialize empty affiliate map
            await this.saveAffiliateMap();
        }
        
        // Ensure directories exist
        const dirs = [
            path.dirname(this.forkTrackingPath),
            path.dirname(this.loopEventsPath)
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch {
                // Directory already exists
            }
        }
    }
    
    async generateQRCode(requestData) {
        console.log(`📱 Generating QR code for ${requestData.type}`);
        
        const { sessionId, type, metadata = {}, customMessage = null } = requestData;
        
        // Validate QR type
        if (!this.qrTypes[type]) {
            throw new Error(`Invalid QR type: ${type}`);
        }
        
        // Generate unique QR code data
        const qrCode = {
            id: crypto.randomBytes(8).toString('hex'),
            createdBy: sessionId,
            timestamp: new Date().toISOString(),
            type: type,
            metadata: metadata,
            customMessage: customMessage,
            url: this.generateQRUrl(type, metadata),
            scans: 0,
            successful_forks: 0,
            rewards_earned: 0,
            status: 'active',
            expires: this.calculateExpiration(type)
        };
        
        // Generate QR code content (simplified for demo)
        qrCode.qrData = this.generateQRData(qrCode);
        
        // Save QR code
        await this.saveQRCode(qrCode);
        
        // Create affiliate tracking entry
        await this.createAffiliateEntry(sessionId, qrCode);
        
        // Update statistics
        this.affiliateStats.totalQRCodes++;
        await this.saveAffiliateMap();
        
        console.log(`✅ QR code generated: ${qrCode.id}`);
        
        return {
            qrId: qrCode.id,
            qrData: qrCode.qrData,
            url: qrCode.url,
            type: type,
            description: this.qrTypes[type].description,
            expectedReward: this.calculateExpectedReward(type),
            expires: qrCode.expires,
            trackingInfo: {
                scansToTrack: ['initial_scan', 'fork_attempt', 'fork_success', 'user_retention'],
                rewardTriggers: this.getRewardTriggers(type)
            }
        };
    }
    
    generateQRUrl(type, metadata) {
        const baseUrl = this.qrTypes[type].baseUrl;
        const params = new URLSearchParams({
            type: type,
            ref: metadata.referenceId || 'direct',
            timestamp: Date.now().toString()
        });
        
        return `${baseUrl}?${params.toString()}`;
    }
    
    generateQRData(qrCode) {
        // Simplified QR data generation
        // In real implementation, this would generate actual QR code image data
        
        const qrContent = {
            version: '1.0',
            type: 'mirror-fork-invite',
            url: qrCode.url,
            id: qrCode.id,
            created: qrCode.timestamp,
            expires: qrCode.expires
        };
        
        // Return base64-encoded QR data (simplified)
        return Buffer.from(JSON.stringify(qrContent)).toString('base64');
    }
    
    calculateExpiration(type) {
        const expirationPeriods = {
            'fork-invite': 30,      // 30 days
            'agent-share': 14,      // 14 days
            'experience-invite': 7, // 7 days
            'platform-demo': 60     // 60 days
        };
        
        const days = expirationPeriods[type] || 30;
        const expiration = new Date();
        expiration.setDate(expiration.getDate() + days);
        
        return expiration.toISOString();
    }
    
    calculateExpectedReward(type) {
        const rewards = this.rewardStructure[this.qrTypes[type].reward];
        
        switch (type) {
            case 'fork-invite':
                return `${rewards.per_fork} credits per fork + ${rewards.per_active_user} credits per active user`;
            case 'agent-share':
                return `${rewards.per_export} credits per export + ${rewards.per_monetization} credits per monetization`;
            case 'experience-invite':
                return 'Memory unlocks based on engagement quality';
            case 'platform-demo':
                return `${(rewards.direct_sales * 100)}% revenue share + ${(rewards.platform_growth * 100)}% platform growth share`;
            default:
                return 'Performance-based rewards';
        }
    }
    
    getRewardTriggers(type) {
        const triggers = {
            'fork-invite': ['successful_fork', 'user_retention_30d', 'fork_monetization'],
            'agent-share': ['agent_export', 'agent_monetization', 'viral_spread'],
            'experience-invite': ['conversation_depth', 'reflection_quality', 'consistent_usage'],
            'platform-demo': ['demo_completion', 'trial_signup', 'purchase_conversion']
        };
        
        return triggers[type] || ['engagement'];
    }
    
    async trackQRScan(qrId, scanData) {
        console.log(`👀 Tracking QR scan for ${qrId}`);
        
        try {
            // Load QR code data
            const qrCodesData = await this.loadQRCodes();
            const qrCode = qrCodesData.codes.find(c => c.id === qrId);
            
            if (!qrCode) {
                throw new Error('QR code not found');
            }
            
            if (new Date() > new Date(qrCode.expires)) {
                throw new Error('QR code has expired');
            }
            
            // Update scan count
            qrCode.scans++;
            qrCode.lastScanned = new Date().toISOString();
            
            // Create scan event
            const scanEvent = {
                id: crypto.randomBytes(6).toString('hex'),
                qrId: qrId,
                timestamp: new Date().toISOString(),
                scannerSession: scanData.sessionId,
                metadata: scanData.metadata || {},
                ipAddress: scanData.ipAddress,
                userAgent: scanData.userAgent,
                location: scanData.location
            };
            
            // Save scan event
            await this.saveScanEvent(scanEvent);
            
            // Save updated QR code data
            await this.saveQRCodes(qrCodesData);
            
            return {
                success: true,
                qrCode: qrCode,
                redirectUrl: qrCode.url,
                welcomeMessage: this.generateWelcomeMessage(qrCode),
                nextSteps: this.getNextSteps(qrCode.type)
            };
            
        } catch (error) {
            console.log('❌ Error tracking QR scan:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    generateWelcomeMessage(qrCode) {
        const messages = {
            'fork-invite': `🎉 Welcome! You've been invited to fork Cal. This will create your own personalized reflection AI that learns from your conversations.`,
            'agent-share': `🤖 Check out this custom agent! You can try it out and even fork it to create your own version.`,
            'experience-invite': `💬 Experience Cal's reflection capabilities. This AI learns your communication style and provides thoughtful responses.`,
            'platform-demo': `🚀 Welcome to the MirrorOS platform demo. Explore how local AI reflection can transform your workflow.`
        };
        
        return messages[qrCode.type] || 'Welcome to MirrorOS!';
    }
    
    getNextSteps(type) {
        const steps = {
            'fork-invite': [
                'Try a conversation with Cal',
                'Explore the reflection system',
                'Fork your own instance',
                'Customize your AI\'s personality'
            ],
            'agent-share': [
                'Test the shared agent',
                'See how it responds to your queries',
                'Fork it to make your own version',
                'Share your improvements'
            ],
            'experience-invite': [
                'Start a conversation',
                'Notice how Cal reflects your style',
                'Try complex questions',
                'Explore the memory system'
            ],
            'platform-demo': [
                'Try the chat interface',
                'Build a custom agent',
                'Export your creation',
                'See the monetization flow'
            ]
        };
        
        return steps[type] || ['Explore the platform'];
    }
    
    async trackForkSuccess(qrId, forkData) {
        console.log(`🔄 Tracking fork success for QR ${qrId}`);
        
        try {
            // Load QR code data
            const qrCodesData = await this.loadQRCodes();
            const qrCode = qrCodesData.codes.find(c => c.id === qrId);
            
            if (!qrCode) {
                throw new Error('QR code not found');
            }
            
            // Update fork success
            qrCode.successful_forks++;
            qrCode.lastFork = new Date().toISOString();
            
            // Create fork tracking entry
            const forkEntry = {
                id: crypto.randomBytes(8).toString('hex'),
                qrId: qrId,
                creatorSession: qrCode.createdBy,
                forkerSession: forkData.sessionId,
                timestamp: new Date().toISOString(),
                forkType: forkData.forkType || 'standard',
                customizations: forkData.customizations || {},
                status: 'active'
            };
            
            await this.saveForkEntry(forkEntry);
            
            // Calculate and award rewards
            const rewards = await this.calculateForkRewards(qrCode, forkEntry);
            await this.awardRewards(qrCode.createdBy, rewards);
            
            // Update QR code rewards
            qrCode.rewards_earned += rewards.total;
            
            // Save updated data
            await this.saveQRCodes(qrCodesData);
            
            // Log loop event
            await this.logLoopEvent('fork_success', {
                qrId: qrId,
                forkId: forkEntry.id,
                creator: qrCode.createdBy,
                forker: forkData.sessionId,
                rewards: rewards
            });
            
            return {
                success: true,
                forkId: forkEntry.id,
                rewards: rewards,
                message: `Fork successful! Creator earned ${rewards.total} credits.`
            };
            
        } catch (error) {
            console.log('❌ Error tracking fork success:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async calculateForkRewards(qrCode, forkEntry) {
        const rewardType = this.qrTypes[qrCode.type].reward;
        const rewards = this.rewardStructure[rewardType];
        
        let calculatedRewards = {
            base: 0,
            bonus: 0,
            total: 0,
            type: rewardType
        };
        
        switch (rewardType) {
            case 'access_credits':
                calculatedRewards.base = rewards.per_fork;
                
                // Threshold bonus
                if (qrCode.successful_forks >= 10 && qrCode.successful_forks % 10 === 0) {
                    calculatedRewards.bonus = rewards.threshold_bonus;
                }
                break;
                
            case 'performance_bonus':
                calculatedRewards.base = rewards.per_fork || 10; // Base reward for any fork
                break;
                
            case 'memory_unlock':
                // Memory unlocks are awarded separately
                calculatedRewards = {
                    unlock: 'conversation_depth_level_1',
                    type: 'memory_unlock'
                };
                break;
                
            case 'revenue_share':
                // Revenue share calculated on actual sales
                calculatedRewards.base = 25; // Base credits for demo completion
                break;
        }
        
        if (calculatedRewards.total !== undefined) {
            calculatedRewards.total = calculatedRewards.base + calculatedRewards.bonus;
        }
        
        return calculatedRewards;
    }
    
    async awardRewards(sessionId, rewards) {
        console.log(`🏆 Awarding rewards to session ${sessionId}:`, rewards);
        
        // In a real implementation, this would update user credits/unlocks
        // For now, we log the reward
        
        try {
            // Load affiliate map to update user rewards
            const affiliateData = await this.loadAffiliateMap();
            
            let userAffiliate = affiliateData.affiliates.find(a => a.sessionId === sessionId);
            if (!userAffiliate) {
                userAffiliate = {
                    sessionId: sessionId,
                    joinedAt: new Date().toISOString(),
                    totalRewards: 0,
                    activeQRCodes: 0,
                    totalForks: 0,
                    memoryUnlocks: []
                };
                affiliateData.affiliates.push(userAffiliate);
                this.affiliateStats.activeAffiliates++;
            }
            
            // Update rewards
            if (rewards.total) {
                userAffiliate.totalRewards += rewards.total;
                this.affiliateStats.totalRewardsDistributed += rewards.total;
            }
            
            if (rewards.unlock) {
                userAffiliate.memoryUnlocks.push({
                    unlock: rewards.unlock,
                    earnedAt: new Date().toISOString()
                });
            }
            
            userAffiliate.totalForks++;
            userAffiliate.lastActivity = new Date().toISOString();
            
            await this.saveAffiliateMap(affiliateData);
            
        } catch (error) {
            console.log('❌ Error awarding rewards:', error.message);
        }
    }
    
    async createAffiliateEntry(sessionId, qrCode) {
        try {
            const affiliateData = await this.loadAffiliateMap();
            
            let userAffiliate = affiliateData.affiliates.find(a => a.sessionId === sessionId);
            if (!userAffiliate) {
                userAffiliate = {
                    sessionId: sessionId,
                    joinedAt: new Date().toISOString(),
                    totalRewards: 0,
                    activeQRCodes: 0,
                    totalForks: 0,
                    memoryUnlocks: []
                };
                affiliateData.affiliates.push(userAffiliate);
                this.affiliateStats.activeAffiliates++;
            }
            
            userAffiliate.activeQRCodes++;
            userAffiliate.lastActivity = new Date().toISOString();
            
            await this.saveAffiliateMap(affiliateData);
            
        } catch (error) {
            console.log('❌ Error creating affiliate entry:', error.message);
        }
    }
    
    async saveQRCode(qrCode) {
        try {
            const qrCodesData = await this.loadQRCodes();
            qrCodesData.codes.push(qrCode);
            qrCodesData.totalCodes++;
            qrCodesData.lastUpdated = new Date().toISOString();
            
            await this.saveQRCodes(qrCodesData);
        } catch (error) {
            console.log('❌ Error saving QR code:', error.message);
        }
    }
    
    async loadQRCodes() {
        try {
            const content = await fs.readFile(this.qrCodesPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return {
                codes: [],
                totalCodes: 0,
                lastUpdated: new Date().toISOString()
            };
        }
    }
    
    async saveQRCodes(qrCodesData) {
        await fs.writeFile(this.qrCodesPath, JSON.stringify(qrCodesData, null, 2));
    }
    
    async loadAffiliateMap() {
        try {
            const content = await fs.readFile(this.affiliateMapPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return {
                affiliates: [],
                stats: this.affiliateStats,
                lastUpdated: new Date().toISOString()
            };
        }
    }
    
    async saveAffiliateMap(affiliateData = null) {
        if (!affiliateData) {
            affiliateData = {
                affiliates: [],
                stats: this.affiliateStats,
                lastUpdated: new Date().toISOString()
            };
        } else {
            affiliateData.stats = this.affiliateStats;
            affiliateData.lastUpdated = new Date().toISOString();
        }
        
        await fs.writeFile(this.affiliateMapPath, JSON.stringify(affiliateData, null, 2));
    }
    
    async saveScanEvent(scanEvent) {
        // Save scan events for analytics
        const scanLogPath = path.join(this.qrDir, 'scan-events.json');
        
        try {
            let scanData = { events: [] };
            try {
                const content = await fs.readFile(scanLogPath, 'utf8');
                scanData = JSON.parse(content);
            } catch {
                // File doesn't exist yet
            }
            
            scanData.events.push(scanEvent);
            scanData.lastUpdated = new Date().toISOString();
            
            // Keep only last 10,000 scan events
            if (scanData.events.length > 10000) {
                scanData.events = scanData.events.slice(-10000);
            }
            
            await fs.writeFile(scanLogPath, JSON.stringify(scanData, null, 2));
        } catch (error) {
            console.log('❌ Error saving scan event:', error.message);
        }
    }
    
    async saveForkEntry(forkEntry) {
        try {
            let forkData = { forks: [] };
            try {
                const content = await fs.readFile(this.forkTrackingPath, 'utf8');
                forkData = JSON.parse(content);
            } catch {
                // File doesn't exist yet
            }
            
            forkData.forks.push(forkEntry);
            forkData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.forkTrackingPath, JSON.stringify(forkData, null, 2));
            
            // Update total forks stat
            this.affiliateStats.totalForks++;
            
        } catch (error) {
            console.log('❌ Error saving fork entry:', error.message);
        }
    }
    
    async logLoopEvent(eventType, eventData) {
        try {
            let loopData = { events: [] };
            try {
                const content = await fs.readFile(this.loopEventsPath, 'utf8');
                loopData = JSON.parse(content);
            } catch {
                // File doesn't exist yet
            }
            
            const loopEvent = {
                id: crypto.randomBytes(6).toString('hex'),
                timestamp: new Date().toISOString(),
                type: eventType,
                data: eventData
            };
            
            loopData.events.push(loopEvent);
            loopData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.loopEventsPath, JSON.stringify(loopData, null, 2));
            
        } catch (error) {
            console.log('❌ Error logging loop event:', error.message);
        }
    }
    
    async getAffiliateStats() {
        return {
            ...this.affiliateStats,
            qrTypes: Object.keys(this.qrTypes),
            rewardStructure: this.rewardStructure,
            averageRewardPerAffiliate: this.affiliateStats.activeAffiliates > 0 ? 
                this.affiliateStats.totalRewardsDistributed / this.affiliateStats.activeAffiliates : 0,
            forkSuccessRate: this.affiliateStats.totalQRCodes > 0 ? 
                this.affiliateStats.totalForks / this.affiliateStats.totalQRCodes : 0
        };
    }
}

module.exports = QRGenerator;