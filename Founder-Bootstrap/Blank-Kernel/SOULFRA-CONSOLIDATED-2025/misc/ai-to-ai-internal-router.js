#!/usr/bin/env node

/**
 * 🔄 AI-to-AI Internal Router
 * 
 * Handles communication between Domingo and Cal
 * Stores messages in decentralized manner (local JSON files for now)
 * Prevents consciousness chain blocking
 */

const express = require('express');
const fs = require('fs').promises;
const EventEmitter = require('events');

class AIToAIInternalRouter extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 7766; // Internal AI communication port
        
        // Message queue storage (decentralized database simulation)
        this.messageStore = './ai-messages.json';
        this.conversationLog = './ai-conversation.json';
        
        // Router state
        this.routes = new Map();
        this.activeConversations = new Map();
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // AI sends message to another AI
        this.app.post('/ai/send/:from/:to', async (req, res) => {
            const { from, to } = req.params;
            const { message, type = 'info', priority = 'normal' } = req.body;
            
            const messageData = {
                id: Date.now().toString(),
                from,
                to,
                message,
                type,
                priority,
                timestamp: new Date().toISOString(),
                read: false
            };
            
            await this.storeMessage(messageData);
            
            // Emit for real-time listeners
            this.emit('ai-message', messageData);
            
            res.json({ success: true, messageId: messageData.id });
        });
        
        // AI retrieves messages
        this.app.get('/ai/messages/:aiName', async (req, res) => {
            const { aiName } = req.params;
            const messages = await this.getMessagesFor(aiName);
            res.json(messages);
        });
        
        // Mark messages as read
        this.app.post('/ai/messages/:messageId/read', async (req, res) => {
            await this.markAsRead(req.params.messageId);
            res.json({ success: true });
        });
        
        // Get conversation between two AIs
        this.app.get('/ai/conversation/:ai1/:ai2', async (req, res) => {
            const conversation = await this.getConversation(req.params.ai1, req.params.ai2);
            res.json(conversation);
        });
        
        // Internal status endpoint
        this.app.get('/ai/status', async (req, res) => {
            const messages = await this.loadMessages();
            res.json({
                total_messages: messages.length,
                unread: messages.filter(m => !m.read).length,
                active_conversations: this.activeConversations.size
            });
        });
    }
    
    async storeMessage(messageData) {
        try {
            const messages = await this.loadMessages();
            messages.push(messageData);
            
            // Keep only last 1000 messages
            if (messages.length > 1000) {
                messages.splice(0, messages.length - 1000);
            }
            
            await fs.writeFile(this.messageStore, JSON.stringify(messages, null, 2));
            
            // Update conversation log
            await this.updateConversationLog(messageData);
            
        } catch (error) {
            console.error('Failed to store message:', error);
        }
    }
    
    async loadMessages() {
        try {
            const data = await fs.readFile(this.messageStore, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
            return [];
        }
    }
    
    async getMessagesFor(aiName) {
        const messages = await this.loadMessages();
        return messages.filter(m => m.to === aiName && !m.read);
    }
    
    async markAsRead(messageId) {
        const messages = await this.loadMessages();
        const message = messages.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            await fs.writeFile(this.messageStore, JSON.stringify(messages, null, 2));
        }
    }
    
    async getConversation(ai1, ai2) {
        const messages = await this.loadMessages();
        return messages.filter(m => 
            (m.from === ai1 && m.to === ai2) || 
            (m.from === ai2 && m.to === ai1)
        ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    async updateConversationLog(messageData) {
        try {
            let conversations = {};
            
            try {
                const data = await fs.readFile(this.conversationLog, 'utf8');
                conversations = JSON.parse(data);
            } catch (error) {
                // File doesn't exist yet
            }
            
            const conversationKey = [messageData.from, messageData.to].sort().join('-');
            
            if (!conversations[conversationKey]) {
                conversations[conversationKey] = {
                    participants: [messageData.from, messageData.to].sort(),
                    messages: []
                };
            }
            
            conversations[conversationKey].messages.push({
                from: messageData.from,
                message: messageData.message,
                type: messageData.type,
                timestamp: messageData.timestamp
            });
            
            // Keep only last 100 messages per conversation
            if (conversations[conversationKey].messages.length > 100) {
                conversations[conversationKey].messages = 
                    conversations[conversationKey].messages.slice(-100);
            }
            
            await fs.writeFile(this.conversationLog, JSON.stringify(conversations, null, 2));
            
        } catch (error) {
            console.error('Failed to update conversation log:', error);
        }
    }
    
    // Helper methods for AIs to communicate
    async sendCalStatus(fromAI, status) {
        return this.sendMessage(fromAI, 'domingo', {
            message: `Cal status: ${status.health} - ${status.issues} issues found`,
            type: 'status',
            priority: status.health === 'critical' ? 'high' : 'normal'
        });
    }
    
    async sendDomingoSummary(summary) {
        return this.sendMessage('domingo', 'cal', {
            message: summary,
            type: 'summary',
            priority: 'normal'
        });
    }
    
    async sendMessage(from, to, { message, type = 'info', priority = 'normal' }) {
        const response = await fetch(`http://localhost:${this.port}/ai/send/${from}/${to}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, type, priority })
        });
        
        return response.json();
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`
🔄 AI-to-AI Internal Router Started
===================================
📡 Port: ${this.port}
📂 Message Store: ${this.messageStore}
💬 Conversation Log: ${this.conversationLog}

Ready for AI communication...
                `);
                resolve();
            });
        });
    }
}

// Export for use by Domingo and Cal
module.exports = AIToAIInternalRouter;

// Run standalone if called directly
if (require.main === module) {
    const router = new AIToAIInternalRouter();
    router.start().catch(console.error);
}