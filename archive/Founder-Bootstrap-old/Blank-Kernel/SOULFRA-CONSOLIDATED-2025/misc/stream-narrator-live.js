#!/usr/bin/env node
/**
 * stream-narrator-live.js
 * Real-time narration system for LoopMesh Dashboard
 */

const fs = require('fs');
const EventEmitter = require('events');

class StreamNarratorLive extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.streamPath = './radio/stream.txt';
        this.updateInterval = 2000;
        this.narrationHistory = [];
        this.isActive = false;
        
        this.agentVoices = {
            'Cal': { prefix: '🌟', style: 'mystical' },
            'Arty': { prefix: '🎭', style: 'creative' },
            'system': { prefix: '⚡', style: 'technical' }
        };
        
        this.initialize();
    }

    async initialize() {
        console.log('🎭 Initializing Stream Narrator...');
        
        // Ensure directories exist
        if (!fs.existsSync('./radio')) {
            fs.mkdirSync('./radio', { recursive: true });
        }
        
        // Initialize stream file
        if (!fs.existsSync(this.streamPath)) {
            const initial = `Stream initialized at ${new Date().toISOString()}
The LoopMesh awakens...
Agents prepare for reflection...`;
            fs.writeFileSync(this.streamPath, initial);
        }
        
        this.startMonitoring();
        console.log('✅ Stream Narrator initialized');
        this.emit('initialized');
    }

    startMonitoring() {
        this.isActive = true;
        
        this.monitorInterval = setInterval(() => {
            this.checkUpdates();
        }, this.updateInterval);
        
        console.log('📡 Stream monitoring active');
    }

    checkUpdates() {
        try {
            if (fs.existsSync(this.streamPath)) {
                const content = fs.readFileSync(this.streamPath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                const latest = lines[lines.length - 1];
                
                if (latest && latest.trim()) {
                    const narration = this.parseNarration(latest);
                    this.addNarration(narration);
                    this.emit('narration', narration);
                }
            }
        } catch (error) {
            console.warn('Stream check failed:', error.message);
        }
    }

    parseNarration(line) {
        let agent = 'system';
        let style = 'neutral';
        
        for (const [agentName, config] of Object.entries(this.agentVoices)) {
            if (line.toLowerCase().includes(agentName.toLowerCase())) {
                agent = agentName;
                style = config.style;
                break;
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            agent,
            text: line.trim(),
            style
        };
    }

    addNarration(narration) {
        this.narrationHistory.push(narration);
        if (this.narrationHistory.length > 20) {
            this.narrationHistory = this.narrationHistory.slice(-20);
        }
    }

    getCurrentNarration() {
        return this.narrationHistory[this.narrationHistory.length - 1] || {
            timestamp: new Date().toISOString(),
            agent: 'system',
            text: 'The LoopMesh is quiet...',
            style: 'neutral'
        };
    }

    getRecentNarrations(limit = 5) {
        return this.narrationHistory.slice(-limit);
    }

    addCustomNarration(agent, text) {
        const narration = {
            timestamp: new Date().toISOString(),
            agent,
            text,
            style: this.agentVoices[agent]?.style || 'neutral'
        };
        
        this.addNarration(narration);
        
        // Write to stream file
        const streamLine = `${new Date().toISOString()} | ${agent}: ${text}\n`;
        fs.appendFileSync(this.streamPath, streamLine);
        
        this.emit('narration', narration);
        return narration;
    }

    getStatus() {
        return {
            active: this.isActive,
            narration_count: this.narrationHistory.length,
            current: this.getCurrentNarration()
        };
    }

    cleanup() {
        this.isActive = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        this.removeAllListeners();
    }
}

module.exports = StreamNarratorLive;