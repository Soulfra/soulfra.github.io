// Cal Gatekeeper - Mirror Operator Protocol 
// Routes all inbound communication through Cal's triage system
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CalGatekeeper {
    constructor() {
        this.gatekeeperDir = __dirname;
        this.highPriorityPath = path.join(this.gatekeeperDir, 'high-priority-messages.json');
        this.noiseLogPath = path.join(this.gatekeeperDir, 'noise-log.json');
        this.partnerLeadsPath = path.join(this.gatekeeperDir, 'partner-leads.json');
        this.triageLogPath = path.join(this.gatekeeperDir, 'triage-log.json');
        
        // Creator contact and status paths
        this.creatorContactPath = path.join(__dirname, '../creator-cloak-layer/creator-contact.json');
        this.creatorStatusPath = path.join(__dirname, '../creator-cloak-layer/creator-status.md');
        
        // High-priority signal patterns
        this.highPriorityPatterns = [
            // Direct founder requests
            /can i speak with the founder/i,
            /talk to the creator/i,
            /speak to the developer/i,
            /contact the founder/i,
            /reach out to matt/i,
            /connect me with/i,
            
            // Funding and investment
            /can i fund this/i,
            /want to invest/i,
            /angel investor/i,
            /venture capital/i,
            /funding opportunity/i,
            /investment proposal/i,
            
            // Business proposals
            /i have a proposal/i,
            /business opportunity/i,
            /partnership/i,
            /collaboration/i,
            /acquisition/i,
            /licensing/i,
            
            // High-value integrations
            /enterprise integration/i,
            /api partnership/i,
            /white label/i,
            /custom deployment/i,
            /enterprise license/i,
            
            // Media and press
            /interview request/i,
            /podcast/i,
            /press inquiry/i,
            /media coverage/i,
            /story about/i,
            
            // Technical collaboration
            /open source contribution/i,
            /code collaboration/i,
            /technical partnership/i,
            /developer relations/i
        ];
        
        // Partner lead patterns (potential buyers/allies)
        this.partnerPatterns = [
            /ceo/i,
            /founder/i,
            /cto/i,
            /vp engineering/i,
            /head of product/i,
            /director/i,
            /startup/i,
            /company/i,
            /team/i,
            /enterprise/i,
            /organization/i,
            /agency/i,
            /consultant/i,
            /freelancer/i
        ];
        
        // Noise patterns (auto-filter low signal)
        this.noisePatterns = [
            /hello$/i,
            /hi$/i,
            /hey$/i,
            /test$/i,
            /testing$/i,
            /^.$/, // Single character
            /spam/i,
            /bot check/i,
            /are you real/i,
            /how are you/i,
            /what's up/i
        ];
        
        this.triageStats = {
            totalMessages: 0,
            highPriority: 0,
            partnerLeads: 0,
            noise: 0,
            routine: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('🛡️ Initializing Cal Gatekeeper - Mirror Operator Protocol...');
        
        await this.loadExistingData();
        await this.loadCreatorStatus();
        
        console.log('✅ Gatekeeper active - filtering all inbound communication');
    }
    
    async loadExistingData() {
        try {
            // Load existing logs to maintain state
            const files = [
                this.highPriorityPath,
                this.noiseLogPath,
                this.partnerLeadsPath,
                this.triageLogPath
            ];
            
            for (const file of files) {
                try {
                    await fs.access(file);
                } catch {
                    // Initialize empty file if it doesn't exist
                    await this.initializeLogFile(file);
                }
            }
        } catch (error) {
            console.log('⚠️ Error loading existing data:', error.message);
        }
    }
    
    async loadCreatorStatus() {
        try {
            const statusContent = await fs.readFile(this.creatorStatusPath, 'utf8');
            this.creatorStatus = statusContent.trim();
            console.log(`👤 Creator status: ${this.creatorStatus}`);
        } catch {
            this.creatorStatus = "Only Cal Knows";
            console.log('👤 Creator status: Unknown - operating in stealth mode');
        }
    }
    
    async initializeLogFile(filePath) {
        const filename = path.basename(filePath);
        let initialData = {};
        
        switch (filename) {
            case 'high-priority-messages.json':
                initialData = {
                    messages: [],
                    totalCount: 0,
                    lastUpdated: new Date().toISOString(),
                    notificationStatus: "enabled"
                };
                break;
            case 'noise-log.json':
                initialData = {
                    entries: [],
                    totalNoise: 0,
                    patterns: {},
                    lastCleaned: new Date().toISOString()
                };
                break;
            case 'partner-leads.json':
                initialData = {
                    leads: [],
                    totalLeads: 0,
                    qualified: 0,
                    lastUpdated: new Date().toISOString()
                };
                break;
            case 'triage-log.json':
                initialData = {
                    sessions: [],
                    stats: this.triageStats,
                    lastUpdated: new Date().toISOString()
                };
                break;
        }
        
        await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
    }
    
    async triageMessage(messageData) {
        console.log(`🔍 Triaging message from session: ${messageData.sessionId}`);
        
        const { prompt, sessionId, userInfo = {}, context = {} } = messageData;
        
        this.triageStats.totalMessages++;
        
        // Create triage entry
        const triageEntry = {
            id: crypto.randomBytes(8).toString('hex'),
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            prompt: prompt,
            userInfo: userInfo,
            context: context,
            classification: null,
            action: null,
            reasoning: null
        };
        
        // Classification logic
        const classification = await this.classifyMessage(prompt, userInfo, context);
        triageEntry.classification = classification.type;
        triageEntry.action = classification.action;
        triageEntry.reasoning = classification.reasoning;
        
        // Route based on classification
        switch (classification.type) {
            case 'high_priority':
                await this.routeToHighPriority(triageEntry, messageData);
                this.triageStats.highPriority++;
                break;
            case 'partner_lead':
                await this.routeToPartnerLeads(triageEntry, messageData);
                this.triageStats.partnerLeads++;
                break;
            case 'noise':
                await this.routeToNoise(triageEntry);
                this.triageStats.noise++;
                break;
            default:
                await this.routeToRoutine(triageEntry, messageData);
                this.triageStats.routine++;
        }
        
        // Log the triage decision
        await this.logTriageDecision(triageEntry);
        
        return {
            classification: classification.type,
            action: classification.action,
            routing: classification.routing || 'mirror-router',
            priority: classification.priority || 'normal'
        };
    }
    
    async classifyMessage(prompt, userInfo, context) {
        const promptLower = prompt.toLowerCase();
        
        // Check for noise first (highest specificity)
        for (const pattern of this.noisePatterns) {
            if (pattern.test(promptLower)) {
                return {
                    type: 'noise',
                    action: 'archive',
                    reasoning: 'Matched noise pattern: low signal content',
                    priority: 'ignore'
                };
            }
        }
        
        // Check for high priority signals
        for (const pattern of this.highPriorityPatterns) {
            if (pattern.test(promptLower)) {
                return {
                    type: 'high_priority',
                    action: 'forward_to_creator',
                    reasoning: 'Matched high-priority pattern: requires creator attention',
                    routing: 'creator-notification',
                    priority: 'urgent'
                };
            }
        }
        
        // Check for partner leads
        const hasPartnerSignals = this.partnerPatterns.some(pattern => 
            pattern.test(promptLower) || 
            pattern.test(userInfo.role || '') || 
            pattern.test(userInfo.company || '')
        );
        
        if (hasPartnerSignals) {
            return {
                type: 'partner_lead',
                action: 'qualify_lead',
                reasoning: 'Contains partner/business signals: potential business value',
                routing: 'lead-qualification',
                priority: 'high'
            };
        }
        
        // Check for complex/valuable queries
        if (prompt.length > 100 || this.hasComplexitySignals(prompt)) {
            return {
                type: 'routine_complex',
                action: 'deep_reflection',
                reasoning: 'Complex query: route through full reflection system',
                routing: 'mirror-router-deep',
                priority: 'normal'
            };
        }
        
        // Default: routine message
        return {
            type: 'routine',
            action: 'standard_reflection',
            reasoning: 'Standard query: route through normal reflection',
            routing: 'mirror-router',
            priority: 'normal'
        };
    }
    
    hasComplexitySignals(prompt) {
        const complexitySignals = [
            /how do i/i,
            /what's the best way/i,
            /strategy/i,
            /approach/i,
            /framework/i,
            /methodology/i,
            /process/i,
            /system/i,
            /problem/i,
            /challenge/i,
            /solution/i,
            /advice/i,
            /guidance/i,
            /help me/i,
            /struggling with/i,
            /not sure how/i
        ];
        
        return complexitySignals.some(signal => signal.test(prompt));
    }
    
    async routeToHighPriority(triageEntry, messageData) {
        console.log('🚨 HIGH PRIORITY MESSAGE - Routing to creator');
        
        try {
            const highPriorityData = JSON.parse(await fs.readFile(this.highPriorityPath, 'utf8'));
            
            const priorityMessage = {
                id: triageEntry.id,
                timestamp: triageEntry.timestamp,
                sessionId: triageEntry.sessionId,
                prompt: triageEntry.prompt,
                userInfo: triageEntry.userInfo,
                context: triageEntry.context,
                reasoning: triageEntry.reasoning,
                status: 'pending_creator_review',
                read: false,
                forwarded: false
            };
            
            highPriorityData.messages.push(priorityMessage);
            highPriorityData.totalCount++;
            highPriorityData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.highPriorityPath, JSON.stringify(highPriorityData, null, 2));
            
            // Attempt to notify creator (if notification system is configured)
            await this.notifyCreator(priorityMessage);
            
        } catch (error) {
            console.log('❌ Error routing high priority message:', error.message);
        }
    }
    
    async routeToPartnerLeads(triageEntry, messageData) {
        console.log('🤝 PARTNER LEAD - Adding to qualification pipeline');
        
        try {
            const partnerData = JSON.parse(await fs.readFile(this.partnerLeadsPath, 'utf8'));
            
            const lead = {
                id: triageEntry.id,
                timestamp: triageEntry.timestamp,
                sessionId: triageEntry.sessionId,
                prompt: triageEntry.prompt,
                userInfo: triageEntry.userInfo,
                context: triageEntry.context,
                leadScore: this.calculateLeadScore(triageEntry),
                status: 'new',
                qualified: false,
                followupRequired: true
            };
            
            partnerData.leads.push(lead);
            partnerData.totalLeads++;
            
            if (lead.leadScore > 0.7) {
                partnerData.qualified++;
                lead.qualified = true;
                lead.status = 'qualified';
            }
            
            partnerData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.partnerLeadsPath, JSON.stringify(partnerData, null, 2));
            
        } catch (error) {
            console.log('❌ Error routing partner lead:', error.message);
        }
    }
    
    async routeToNoise(triageEntry) {
        console.log('🗑️ NOISE - Archiving low-signal message');
        
        try {
            const noiseData = JSON.parse(await fs.readFile(this.noiseLogPath, 'utf8'));
            
            const noiseEntry = {
                id: triageEntry.id,
                timestamp: triageEntry.timestamp,
                prompt: triageEntry.prompt,
                reasoning: triageEntry.reasoning,
                sessionId: triageEntry.sessionId
            };
            
            noiseData.entries.push(noiseEntry);
            noiseData.totalNoise++;
            
            // Track noise patterns for improvement
            const promptLength = triageEntry.prompt.length;
            const lengthBucket = promptLength < 10 ? 'very_short' : 
                               promptLength < 30 ? 'short' : 'medium';
            
            if (!noiseData.patterns[lengthBucket]) {
                noiseData.patterns[lengthBucket] = 0;
            }
            noiseData.patterns[lengthBucket]++;
            
            // Clean old noise entries (keep last 1000)
            if (noiseData.entries.length > 1000) {
                noiseData.entries = noiseData.entries.slice(-1000);
                noiseData.lastCleaned = new Date().toISOString();
            }
            
            await fs.writeFile(this.noiseLogPath, JSON.stringify(noiseData, null, 2));
            
        } catch (error) {
            console.log('❌ Error routing noise:', error.message);
        }
    }
    
    async routeToRoutine(triageEntry, messageData) {
        console.log('📝 ROUTINE - Processing through standard reflection');
        
        // Routine messages go through normal mirror-router flow
        // This method primarily logs the decision for analytics
    }
    
    calculateLeadScore(triageEntry) {
        let score = 0.3; // Base score for any partner signal
        
        const prompt = triageEntry.prompt.toLowerCase();
        const userInfo = triageEntry.userInfo || {};
        
        // Role-based scoring
        if (/ceo|founder|cto/i.test(userInfo.role || '')) score += 0.4;
        else if (/director|vp|head/i.test(userInfo.role || '')) score += 0.3;
        else if (/manager|lead/i.test(userInfo.role || '')) score += 0.2;
        
        // Company-based scoring
        if (userInfo.company && userInfo.company.length > 3) score += 0.2;
        
        // Content-based scoring
        if (/enterprise|integration|api|license|partnership/i.test(prompt)) score += 0.3;
        if (/fund|invest|acquisition|purchase/i.test(prompt)) score += 0.4;
        if (/collaboration|white label|custom/i.test(prompt)) score += 0.2;
        
        // Length and specificity
        if (triageEntry.prompt.length > 200) score += 0.1;
        if (triageEntry.prompt.length > 500) score += 0.1;
        
        return Math.min(1.0, score);
    }
    
    async notifyCreator(priorityMessage) {
        try {
            // Check if creator notifications are enabled
            const contactData = await this.loadCreatorContact();
            
            if (!contactData.notifications_enabled) {
                console.log('🔕 Creator notifications disabled');
                return;
            }
            
            // Log to console (for development)
            console.log('📨 CREATOR NOTIFICATION:');
            console.log(`   From: Session ${priorityMessage.sessionId}`);
            console.log(`   Message: "${priorityMessage.prompt.substring(0, 100)}..."`);
            console.log(`   Priority: ${priorityMessage.reasoning}`);
            
            // If webhook is configured, send notification
            if (contactData.webhook_url) {
                await this.sendWebhookNotification(contactData.webhook_url, priorityMessage);
            }
            
            // If email is configured, could send email notification here
            if (contactData.email_notifications && contactData.email) {
                console.log(`📧 Email notification queued for: ${contactData.email}`);
                // Email sending logic would go here
            }
            
        } catch (error) {
            console.log('❌ Error sending creator notification:', error.message);
        }
    }
    
    async loadCreatorContact() {
        try {
            const contactContent = await fs.readFile(this.creatorContactPath, 'utf8');
            return JSON.parse(contactContent);
        } catch {
            return {
                notifications_enabled: true,
                webhook_url: null,
                email_notifications: false,
                email: null
            };
        }
    }
    
    async sendWebhookNotification(webhookUrl, message) {
        try {
            // Simplified webhook notification (would use fetch/axios in real implementation)
            console.log(`🔗 Webhook notification sent to: ${webhookUrl}`);
            console.log(`   Message ID: ${message.id}`);
        } catch (error) {
            console.log('❌ Webhook notification failed:', error.message);
        }
    }
    
    async logTriageDecision(triageEntry) {
        try {
            const triageData = JSON.parse(await fs.readFile(this.triageLogPath, 'utf8'));
            
            triageData.sessions.push(triageEntry);
            triageData.stats = this.triageStats;
            triageData.lastUpdated = new Date().toISOString();
            
            // Keep only last 10,000 triage decisions
            if (triageData.sessions.length > 10000) {
                triageData.sessions = triageData.sessions.slice(-10000);
            }
            
            await fs.writeFile(this.triageLogPath, JSON.stringify(triageData, null, 2));
            
        } catch (error) {
            console.log('❌ Error logging triage decision:', error.message);
        }
    }
    
    async getGatekeeperStats() {
        return {
            totalMessages: this.triageStats.totalMessages,
            classification: {
                highPriority: this.triageStats.highPriority,
                partnerLeads: this.triageStats.partnerLeads,
                noise: this.triageStats.noise,
                routine: this.triageStats.routine
            },
            efficiency: {
                signalToNoise: this.triageStats.totalMessages > 0 ? 
                    (this.triageStats.totalMessages - this.triageStats.noise) / this.triageStats.totalMessages : 0,
                priorityRate: this.triageStats.totalMessages > 0 ? 
                    this.triageStats.highPriority / this.triageStats.totalMessages : 0
            },
            creatorStatus: this.creatorStatus
        };
    }
    
    async getPendingCreatorMessages() {
        try {
            const highPriorityData = JSON.parse(await fs.readFile(this.highPriorityPath, 'utf8'));
            return highPriorityData.messages.filter(msg => !msg.read);
        } catch {
            return [];
        }
    }
    
    async markMessageAsRead(messageId) {
        try {
            const highPriorityData = JSON.parse(await fs.readFile(this.highPriorityPath, 'utf8'));
            
            const message = highPriorityData.messages.find(msg => msg.id === messageId);
            if (message) {
                message.read = true;
                message.readAt = new Date().toISOString();
                
                await fs.writeFile(this.highPriorityPath, JSON.stringify(highPriorityData, null, 2));
                return true;
            }
            
            return false;
        } catch {
            return false;
        }
    }
    
    // Cal's introduction for new users (integrates with personality upgrade)
    getCalIntroduction() {
        return {
            greeting: "This mirror runs locally. Nothing leaves unless you export.",
            philosophy: "I reflect what matters. I discard the rest.",
            instruction: "Say what you need. If it's worth forwarding… I'll let them know.",
            status: this.creatorStatus === "Only Cal Knows" ? 
                "The creator operates in stealth mode." : 
                `Creator status: ${this.creatorStatus}`
        };
    }
}

module.exports = CalGatekeeper;