#!/usr/bin/env node
/**
 * Announcer Shell
 * Core broadcast logic for Cal and Arty's commentary
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class AnnouncerShell extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Configuration
        this.config = this.loadConfig(config);
        this.agents = new Map();
        
        // Output streams
        this.outputs = {
            cli: config.enableCLI !== false,
            file: config.streamFile || path.join(__dirname, '../radio/stream.txt'),
            websocket: null, // Will be initialized if available
            external: new Map() // Twitter, YouTube, etc.
        };
        
        // Commentary history for variety
        this.recentCommentary = [];
        this.maxHistorySize = 100;
        
        // Stats
        this.stats = {
            total_announcements: 0,
            by_agent: {},
            by_event: {},
            start_time: new Date()
        };
        
        this.ensureDirectories();
        this.initializeAgents();
    }
    
    loadConfig(overrides = {}) {
        const configPath = path.join(__dirname, 'announcer_config.json');
        let config = {
            agents: {
                cal: {
                    name: 'Cal',
                    personality: 'wise',
                    tone: 'contemplative',
                    topics: ['loops', 'harmony', 'philosophy'],
                    enabled: true
                },
                arty: {
                    name: 'Arty',
                    personality: 'chaotic',
                    tone: 'energetic',
                    topics: ['duels', 'bets', 'drama'],
                    enabled: true
                }
            },
            variety_threshold: 0.7,
            announcement_delay: 0,
            filters: {
                min_importance: 0.3
            }
        };
        
        // Load from file if exists
        if (fs.existsSync(configPath)) {
            try {
                const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                config = { ...config, ...fileConfig };
            } catch (err) {
                console.error('Error loading config:', err);
            }
        }
        
        return { ...config, ...overrides };
    }
    
    ensureDirectories() {
        const dirs = [
            path.dirname(this.outputs.file),
            path.join(__dirname, 'logs')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    initializeAgents() {
        // Initialize Cal
        if (this.config.agents.cal.enabled) {
            const CalVoice = require('./agents/CalVoice');
            this.agents.set('cal', new CalVoice(this.config.agents.cal));
        }
        
        // Initialize Arty
        if (this.config.agents.arty.enabled) {
            const ArtyVoice = require('./agents/ArtyVoice');
            this.agents.set('arty', new ArtyVoice(this.config.agents.arty));
        }
    }
    
    async announce(eventType, eventData, options = {}) {
        try {
            // Determine which agent should speak
            const agent = this.selectAgent(eventType, eventData, options);
            if (!agent) return null;
            
            // Generate commentary
            const commentary = await agent.generateCommentary(eventType, eventData);
            if (!commentary) return null;
            
            // Check for variety
            if (!this.isCommentaryUnique(commentary.text)) {
                // Try alternative phrasing
                commentary.text = await agent.generateAlternative(eventType, eventData);
            }
            
            // Create announcement
            const announcement = {
                id: this.generateAnnouncementId(),
                timestamp: new Date().toISOString(),
                agent: agent.name,
                event_type: eventType,
                text: commentary.text,
                tone: commentary.tone || agent.config.tone,
                importance: commentary.importance || 0.5,
                metadata: {
                    ...eventData,
                    ...commentary.metadata
                }
            };
            
            // Apply delay if configured
            if (this.config.announcement_delay > 0) {
                await this.delay(this.config.announcement_delay);
            }
            
            // Broadcast
            await this.broadcast(announcement);
            
            // Update stats
            this.updateStats(announcement);
            
            // Emit event
            this.emit('announcement', announcement);
            
            return announcement;
            
        } catch (err) {
            console.error('Announcement error:', err);
            this.emit('error', err);
            return null;
        }
    }
    
    selectAgent(eventType, eventData, options) {
        // Override agent if specified
        if (options.agent) {
            return this.agents.get(options.agent);
        }
        
        // Determine based on event type and topic relevance
        let bestAgent = null;
        let bestScore = 0;
        
        for (const [name, agent] of this.agents) {
            const score = agent.calculateRelevance(eventType, eventData);
            if (score > bestScore) {
                bestScore = score;
                bestAgent = agent;
            }
        }
        
        // Minimum relevance threshold
        if (bestScore < this.config.filters.min_importance) {
            return null;
        }
        
        return bestAgent;
    }
    
    isCommentaryUnique(text) {
        // Check against recent history
        const similar = this.recentCommentary.filter(recent => {
            return this.calculateSimilarity(text, recent) > this.config.variety_threshold;
        });
        
        return similar.length === 0;
    }
    
    calculateSimilarity(text1, text2) {
        // Simple word overlap similarity
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return intersection.size / union.size;
    }
    
    async broadcast(announcement) {
        const outputs = [];
        
        // CLI output
        if (this.outputs.cli) {
            const cliFormat = `[${announcement.agent.toUpperCase()}] ${announcement.text}`;
            console.log(cliFormat);
            outputs.push('cli');
        }
        
        // File stream
        if (this.outputs.file) {
            const streamFormat = [
                announcement.timestamp,
                announcement.agent.toUpperCase(),
                announcement.event_type,
                announcement.text
            ].join('|') + '\n';
            
            fs.appendFileSync(this.outputs.file, streamFormat);
            outputs.push('file');
        }
        
        // WebSocket broadcast
        if (this.outputs.websocket) {
            try {
                await this.outputs.websocket.broadcast('narration:live', announcement);
                outputs.push('websocket');
            } catch (err) {
                console.error('WebSocket broadcast failed:', err);
            }
        }
        
        // External broadcasts (Twitter, YouTube, etc.)
        for (const [platform, broadcaster] of this.outputs.external) {
            if (broadcaster.shouldBroadcast(announcement)) {
                try {
                    await broadcaster.broadcast(announcement);
                    outputs.push(platform);
                } catch (err) {
                    console.error(`${platform} broadcast failed:`, err);
                }
            }
        }
        
        // Update recent commentary
        this.recentCommentary.push(announcement.text);
        if (this.recentCommentary.length > this.maxHistorySize) {
            this.recentCommentary.shift();
        }
        
        // Log broadcast
        this.logAnnouncement(announcement, outputs);
        
        return outputs;
    }
    
    updateStats(announcement) {
        this.stats.total_announcements++;
        
        // By agent
        if (!this.stats.by_agent[announcement.agent]) {
            this.stats.by_agent[announcement.agent] = 0;
        }
        this.stats.by_agent[announcement.agent]++;
        
        // By event type
        if (!this.stats.by_event[announcement.event_type]) {
            this.stats.by_event[announcement.event_type] = 0;
        }
        this.stats.by_event[announcement.event_type]++;
    }
    
    logAnnouncement(announcement, outputs) {
        const logEntry = {
            ...announcement,
            outputs,
            logged_at: new Date().toISOString()
        };
        
        const logFile = path.join(
            __dirname,
            'logs',
            `announcements-${new Date().toISOString().split('T')[0]}.log`
        );
        
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
    
    generateAnnouncementId() {
        return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Configuration methods
    
    setWebSocket(wsService) {
        this.outputs.websocket = wsService;
    }
    
    addExternalBroadcaster(platform, broadcaster) {
        this.outputs.external.set(platform, broadcaster);
    }
    
    setAgent(name, agent) {
        this.agents.set(name, agent);
    }
    
    // Utility methods
    
    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.start_time.getTime(),
            agents_active: Array.from(this.agents.keys())
        };
    }
    
    getRecentAnnouncements(limit = 10) {
        // This would query from logs
        return this.recentCommentary.slice(-limit);
    }
}

module.exports = AnnouncerShell;

// Example usage
if (require.main === module) {
    const announcer = new AnnouncerShell();
    
    // Test announcements
    const testEvents = [
        {
            type: 'loop_created',
            data: { loop_id: 'loop_12345', whisper: 'Build something amazing' }
        },
        {
            type: 'duel_created',
            data: { duel_id: 'duel_67890', target: 'loop_12345', odds: { success: 2.5 } }
        },
        {
            type: 'task_complete',
            data: { task_id: 'task_11111', result: 'success', duration: 1200 }
        }
    ];
    
    // Announce test events
    async function runTests() {
        for (const event of testEvents) {
            await announcer.announce(event.type, event.data);
            await announcer.delay(2000); // 2 second delay between
        }
        
        console.log('\nStats:', announcer.getStats());
    }
    
    runTests();
}