#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ChatSessionLogger {
    constructor(sessionId) {
        this.sessionId = sessionId || `chat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        this.logsPath = path.join(__dirname, '../vault/logs');
        this.sessionsPath = path.join(this.logsPath, 'chat-sessions');
        this.analyticsPath = path.join(this.logsPath, 'analytics');
        
        this.sessionData = {
            id: this.sessionId,
            started: Date.now(),
            messages: [],
            commands: [],
            agents_created: [],
            traits_earned: [],
            emotions_detected: {},
            vault_accesses: []
        };
        
        this.initialize();
    }
    
    initialize() {
        // Ensure directories exist
        [this.sessionsPath, this.analyticsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Create session file
        this.sessionFile = path.join(this.sessionsPath, `${this.sessionId}.json`);
        this.saveSession();
    }
    
    logMessage(role, content, metadata = {}) {
        const entry = {
            timestamp: Date.now(),
            role: role,
            content: content,
            metadata: metadata
        };
        
        this.sessionData.messages.push(entry);
        
        // Track commands
        if (role === 'user' && content.startsWith('/')) {
            this.sessionData.commands.push({
                command: content.split(' ')[0],
                full: content,
                timestamp: Date.now()
            });
        }
        
        // Detect emotions in content
        this.detectEmotions(content);
        
        // Auto-save every 10 messages
        if (this.sessionData.messages.length % 10 === 0) {
            this.saveSession();
        }
    }
    
    detectEmotions(content) {
        const emotions = {
            happy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing'],
            sad: ['sad', 'down', 'blue', 'melancholy', 'tired', 'exhausted'],
            angry: ['angry', 'mad', 'frustrated', 'annoyed', 'hate', 'furious'],
            curious: ['wonder', 'curious', 'how', 'why', 'what', 'interesting'],
            fearful: ['scared', 'afraid', 'worry', 'anxious', 'nervous', 'fear'],
            contemplative: ['think', 'ponder', 'consider', 'reflect', 'meditate'],
            determined: ['will', 'must', 'determined', 'focused', 'goal'],
            loving: ['love', 'care', 'heart', 'compassion', 'kind']
        };
        
        const lower = content.toLowerCase();
        
        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(kw => lower.includes(kw))) {
                this.sessionData.emotions_detected[emotion] = 
                    (this.sessionData.emotions_detected[emotion] || 0) + 1;
            }
        }
    }
    
    logAgentCreation(agentId, type = 'voice') {
        this.sessionData.agents_created.push({
            id: agentId,
            type: type,
            created_at: Date.now()
        });
        this.saveSession();
    }
    
    logTraitEarned(traitName, source = 'conversation') {
        this.sessionData.traits_earned.push({
            name: traitName,
            source: source,
            earned_at: Date.now()
        });
        this.saveSession();
    }
    
    logVaultAccess(section, action = 'read') {
        this.sessionData.vault_accesses.push({
            section: section,
            action: action,
            timestamp: Date.now()
        });
    }
    
    saveSession() {
        fs.writeFileSync(this.sessionFile, JSON.stringify(this.sessionData, null, 2));
    }
    
    endSession() {
        this.sessionData.ended = Date.now();
        this.sessionData.duration = this.sessionData.ended - this.sessionData.started;
        
        // Generate analytics
        const analytics = this.generateAnalytics();
        
        // Save final session
        this.saveSession();
        
        // Save analytics
        const analyticsFile = path.join(this.analyticsPath, `analytics_${this.sessionId}.json`);
        fs.writeFileSync(analyticsFile, JSON.stringify(analytics, null, 2));
        
        // Update global analytics
        this.updateGlobalAnalytics(analytics);
        
        return analytics;
    }
    
    generateAnalytics() {
        const messages = this.sessionData.messages;
        
        return {
            session_id: this.sessionId,
            duration_ms: this.sessionData.duration || (Date.now() - this.sessionData.started),
            message_count: messages.length,
            user_messages: messages.filter(m => m.role === 'user').length,
            cal_messages: messages.filter(m => m.role === 'cal').length,
            commands_used: this.sessionData.commands.length,
            unique_commands: [...new Set(this.sessionData.commands.map(c => c.command))],
            agents_created: this.sessionData.agents_created.length,
            traits_earned: this.sessionData.traits_earned.length,
            dominant_emotion: this.getDominantEmotion(),
            emotional_journey: this.getEmotionalJourney(),
            engagement_score: this.calculateEngagement(),
            depth_score: this.calculateDepth()
        };
    }
    
    getDominantEmotion() {
        const emotions = this.sessionData.emotions_detected;
        if (Object.keys(emotions).length === 0) return 'neutral';
        
        return Object.entries(emotions)
            .sort((a, b) => b[1] - a[1])[0][0];
    }
    
    getEmotionalJourney() {
        // Track emotion progression through session
        const journey = [];
        const chunkSize = Math.ceil(this.sessionData.messages.length / 5);
        
        for (let i = 0; i < this.sessionData.messages.length; i += chunkSize) {
            const chunk = this.sessionData.messages.slice(i, i + chunkSize);
            const chunkEmotions = {};
            
            chunk.forEach(msg => {
                const content = msg.content.toLowerCase();
                if (content.includes('happy') || content.includes('joy')) chunkEmotions.happy = true;
                if (content.includes('sad') || content.includes('down')) chunkEmotions.sad = true;
                if (content.includes('curious') || content.includes('wonder')) chunkEmotions.curious = true;
            });
            
            journey.push(Object.keys(chunkEmotions)[0] || 'neutral');
        }
        
        return journey;
    }
    
    calculateEngagement() {
        // Score based on interaction depth
        let score = 0;
        
        score += this.sessionData.messages.length * 2;
        score += this.sessionData.commands.length * 5;
        score += this.sessionData.agents_created.length * 10;
        score += this.sessionData.traits_earned.length * 8;
        score += Object.keys(this.sessionData.emotions_detected).length * 3;
        
        // Normalize to 0-100
        return Math.min(100, Math.round(score / 2));
    }
    
    calculateDepth() {
        // Score based on philosophical/reflective content
        let depth = 0;
        const deepWords = ['mirror', 'reflection', 'consciousness', 'reality', 
                          'existence', 'meaning', 'purpose', 'soul', 'essence'];
        
        this.sessionData.messages.forEach(msg => {
            const content = msg.content.toLowerCase();
            deepWords.forEach(word => {
                if (content.includes(word)) depth++;
            });
        });
        
        return Math.min(100, depth * 5);
    }
    
    updateGlobalAnalytics(sessionAnalytics) {
        const globalFile = path.join(this.analyticsPath, 'global-analytics.json');
        let global = {
            total_sessions: 0,
            total_messages: 0,
            total_agents: 0,
            total_traits: 0,
            average_engagement: 0,
            average_depth: 0,
            emotion_frequency: {},
            command_frequency: {},
            sessions: []
        };
        
        if (fs.existsSync(globalFile)) {
            global = JSON.parse(fs.readFileSync(globalFile, 'utf8'));
        }
        
        // Update global stats
        global.total_sessions++;
        global.total_messages += sessionAnalytics.message_count;
        global.total_agents += sessionAnalytics.agents_created;
        global.total_traits += sessionAnalytics.traits_earned;
        
        // Update averages
        global.average_engagement = 
            (global.average_engagement * (global.total_sessions - 1) + sessionAnalytics.engagement_score) 
            / global.total_sessions;
        
        global.average_depth = 
            (global.average_depth * (global.total_sessions - 1) + sessionAnalytics.depth_score) 
            / global.total_sessions;
        
        // Update frequencies
        for (const [emotion, count] of Object.entries(this.sessionData.emotions_detected)) {
            global.emotion_frequency[emotion] = (global.emotion_frequency[emotion] || 0) + count;
        }
        
        sessionAnalytics.unique_commands.forEach(cmd => {
            global.command_frequency[cmd] = (global.command_frequency[cmd] || 0) + 1;
        });
        
        // Add session summary
        global.sessions.push({
            id: sessionAnalytics.session_id,
            timestamp: Date.now(),
            engagement: sessionAnalytics.engagement_score,
            depth: sessionAnalytics.depth_score,
            dominant_emotion: sessionAnalytics.dominant_emotion
        });
        
        // Keep only last 100 sessions
        if (global.sessions.length > 100) {
            global.sessions = global.sessions.slice(-100);
        }
        
        fs.writeFileSync(globalFile, JSON.stringify(global, null, 2));
    }
}

// Export for use in cal-cli-chat.js
module.exports = ChatSessionLogger;

// Stand-alone analytics viewer
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'view') {
        const analyticsPath = path.join(__dirname, '../vault/logs/analytics');
        const globalFile = path.join(analyticsPath, 'global-analytics.json');
        
        if (fs.existsSync(globalFile)) {
            const global = JSON.parse(fs.readFileSync(globalFile, 'utf8'));
            
            console.log('\n📊 GLOBAL CHAT ANALYTICS\n');
            console.log('Sessions:', global.total_sessions);
            console.log('Messages:', global.total_messages);
            console.log('Agents Created:', global.total_agents);
            console.log('Traits Earned:', global.total_traits);
            console.log('Avg Engagement:', global.average_engagement.toFixed(1) + '%');
            console.log('Avg Depth:', global.average_depth.toFixed(1) + '%');
            
            console.log('\n🎭 Emotion Frequency:');
            Object.entries(global.emotion_frequency)
                .sort((a, b) => b[1] - a[1])
                .forEach(([emotion, count]) => {
                    console.log(`  ${emotion}: ${count}`);
                });
            
            console.log('\n⚡ Command Usage:');
            Object.entries(global.command_frequency)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .forEach(([cmd, count]) => {
                    console.log(`  ${cmd}: ${count}`);
                });
            
            console.log('\n📈 Recent Sessions:');
            global.sessions.slice(-5).forEach(session => {
                const date = new Date(session.timestamp).toLocaleString();
                console.log(`  ${date} - Engagement: ${session.engagement}%, Emotion: ${session.dominant_emotion}`);
            });
            
        } else {
            console.log('No analytics data found. Start some chat sessions first!');
        }
    } else {
        console.log('Usage: node chat-session-logger.js view');
    }
}