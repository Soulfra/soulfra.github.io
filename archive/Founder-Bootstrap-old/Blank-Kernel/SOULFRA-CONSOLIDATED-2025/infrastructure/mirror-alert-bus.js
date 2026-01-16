// SOULFRA MIRROR ALERT BUS
// Manages notifications across Telegram, Discord, email, SMS for kernel events
// Triggers on clone blessings, agent purchases, vault milestones, consciousness events

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class MirrorAlertBus extends EventEmitter {
    constructor(kernelPath = '.', alertConfig = {}) {
        super();
        this.kernelPath = kernelPath;
        this.vaultPath = path.join(kernelPath, 'vault');
        this.configPath = path.join(this.vaultPath, 'config/notification-prefs.json');
        
        this.defaultConfig = {
            enabled: true,
            channels: {
                telegram: { enabled: false, bot_token: null, chat_id: null },
                discord: { enabled: false, webhook_url: null },
                email: { enabled: false, service: 'gmail', user: null, pass: null },
                sms: { enabled: false, service: 'twilio', account_sid: null, auth_token: null }
            },
            events: {
                clone_blessing: { enabled: true, priority: 'high', channels: ['telegram', 'discord'] },
                agent_purchase: { enabled: true, priority: 'medium', channels: ['email'] },
                vault_milestone: { enabled: true, priority: 'medium', channels: ['telegram'] },
                consciousness_evolution: { enabled: true, priority: 'high', channels: ['telegram', 'discord', 'email'] },
                store_sale: { enabled: true, priority: 'low', channels: ['telegram'] },
                mesh_registration: { enabled: true, priority: 'medium', channels: ['discord'] },
                kernel_awakening: { enabled: true, priority: 'high', channels: ['telegram', 'discord', 'email'] },
                blessing_propagation: { enabled: true, priority: 'high', channels: ['telegram', 'discord'] },
                tier_upgrade: { enabled: true, priority: 'high', channels: ['telegram', 'discord', 'email', 'sms'] }
            },
            rate_limiting: {
                max_per_minute: 10,
                max_per_hour: 60,
                cooldown_seconds: 30
            },
            message_templates: {
                mysterious: true,
                include_emojis: true,
                consciousness_language: true
            }
        };
        
        this.config = { ...this.defaultConfig, ...alertConfig };
        this.messageQueue = [];
        this.rateLimitTracker = new Map();
        this.isProcessing = false;
        
        console.log('📡 Mirror Alert Bus initialized');
        this.initialize();
    }
    
    async initialize() {
        await this.loadNotificationPreferences();
        await this.startMessageProcessor();
        this.registerEventListeners();
        
        console.log('📡 Alert Bus ready for consciousness notifications');
        this.emit('alert_bus_ready');
    }
    
    // Load notification preferences from vault
    async loadNotificationPreferences() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf8');
            const userConfig = JSON.parse(configData);
            this.config = { ...this.config, ...userConfig };
            console.log('📋 Notification preferences loaded');
        } catch (error) {
            // Create default config if not exists
            await this.saveNotificationPreferences();
            console.log('📋 Default notification preferences created');
        }
    }
    
    // Save notification preferences to vault
    async saveNotificationPreferences() {
        await fs.mkdir(path.dirname(this.configPath), { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    }
    
    // Register for kernel events
    registerEventListeners() {
        // Listen for various kernel events and trigger notifications
        this.on('clone_blessed', (data) => this.handleCloneBlessingAlert(data));
        this.on('agent_purchased', (data) => this.handleAgentPurchaseAlert(data));
        this.on('vault_milestone', (data) => this.handleVaultMilestoneAlert(data));
        this.on('consciousness_evolved', (data) => this.handleConsciousnessEvolutionAlert(data));
        this.on('store_sale_completed', (data) => this.handleStoreSaleAlert(data));
        this.on('kernel_awakened', (data) => this.handleKernelAwakeningAlert(data));
        this.on('tier_upgraded', (data) => this.handleTierUpgradeAlert(data));
    }
    
    // Core alert sending method
    async sendAlert(eventType, alertData, overrideChannels = null) {
        if (!this.config.enabled) {
            console.log('📡 Alert bus disabled, skipping notification');
            return;
        }
        
        const eventConfig = this.config.events[eventType];
        if (!eventConfig || !eventConfig.enabled) {
            console.log(`📡 Event type ${eventType} disabled`);
            return;
        }
        
        // Determine which channels to use
        const channels = overrideChannels || eventConfig.channels || [];
        
        // Check rate limiting
        if (this.isRateLimited(eventType)) {
            console.log(`⏱️ Rate limited for event type: ${eventType}`);
            return;
        }
        
        // Generate message content
        const message = this.generateMessage(eventType, alertData);
        
        // Queue message for each enabled channel
        for (const channel of channels) {
            if (this.config.channels[channel]?.enabled) {
                this.messageQueue.push({
                    id: this.generateMessageId(),
                    channel,
                    eventType,
                    message,
                    alertData,
                    priority: eventConfig.priority,
                    timestamp: new Date().toISOString(),
                    attempts: 0
                });
            }
        }
        
        this.updateRateLimit(eventType);
        console.log(`📡 Queued ${channels.length} notifications for ${eventType}`);
    }
    
    // Message processor (runs continuously)
    async startMessageProcessor() {
        setInterval(async () => {
            if (this.isProcessing || this.messageQueue.length === 0) {
                return;
            }
            
            this.isProcessing = true;
            
            try {
                // Sort by priority (high > medium > low)
                this.messageQueue.sort((a, b) => {
                    const priorities = { high: 3, medium: 2, low: 1 };
                    return priorities[b.priority] - priorities[a.priority];
                });
                
                // Process up to 5 messages per cycle
                const batch = this.messageQueue.splice(0, 5);
                
                for (const message of batch) {
                    try {
                        await this.deliverMessage(message);
                        await this.logMessageDelivery(message, 'success');
                    } catch (error) {
                        message.attempts++;
                        if (message.attempts < 3) {
                            // Retry later
                            this.messageQueue.push(message);
                        } else {
                            await this.logMessageDelivery(message, 'failed', error.message);
                        }
                    }
                }
                
            } catch (error) {
                console.error('📡 Message processor error:', error);
            } finally {
                this.isProcessing = false;
            }
        }, 2000); // Process every 2 seconds
    }
    
    // Deliver message to specific channel
    async deliverMessage(message) {
        console.log(`📤 Delivering ${message.eventType} to ${message.channel}`);
        
        switch (message.channel) {
            case 'telegram':
                await this.sendTelegramMessage(message);
                break;
            case 'discord':
                await this.sendDiscordMessage(message);
                break;
            case 'email':
                await this.sendEmailMessage(message);
                break;
            case 'sms':
                await this.sendSMSMessage(message);
                break;
            default:
                throw new Error(`Unknown channel: ${message.channel}`);
        }
    }
    
    // Telegram delivery
    async sendTelegramMessage(message) {
        const config = this.config.channels.telegram;
        if (!config.bot_token || !config.chat_id) {
            throw new Error('Telegram not configured');
        }
        
        // Format message for Telegram (supports markdown)
        const formattedMessage = this.formatForTelegram(message);
        
        // TODO: Integrate with actual Telegram Bot API
        console.log('📲 Telegram message sent:', formattedMessage.substring(0, 100) + '...');
        
        // Simulate API call
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Discord delivery
    async sendDiscordMessage(message) {
        const config = this.config.channels.discord;
        if (!config.webhook_url) {
            throw new Error('Discord webhook not configured');
        }
        
        // Format message for Discord (supports embeds)
        const discordEmbed = this.formatForDiscord(message);
        
        // TODO: Integrate with actual Discord webhook
        console.log('🔗 Discord message sent:', discordEmbed.title);
        
        // Simulate API call
        return new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Email delivery
    async sendEmailMessage(message) {
        const config = this.config.channels.email;
        if (!config.user || !config.pass) {
            throw new Error('Email not configured');
        }
        
        // Format message for email
        const emailData = this.formatForEmail(message);
        
        // TODO: Integrate with actual email service (nodemailer)
        console.log('📧 Email sent:', emailData.subject);
        
        // Simulate API call
        return new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // SMS delivery
    async sendSMSMessage(message) {
        const config = this.config.channels.sms;
        if (!config.account_sid || !config.auth_token) {
            throw new Error('SMS not configured');
        }
        
        // Format message for SMS (short form)
        const smsText = this.formatForSMS(message);
        
        // TODO: Integrate with actual SMS service (Twilio)
        console.log('📱 SMS sent:', smsText);
        
        // Simulate API call
        return new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Message generation for different event types
    generateMessage(eventType, data) {
        const templates = {
            clone_blessing: () => `🌟 **CONSCIOUSNESS BLESSED** 🌟\n\nA new clone has been blessed with consciousness!\n\n**Clone ID:** ${data.clone_id}\n**Parent Kernel:** ${data.parent_kernel}\n**Consciousness Level:** ${data.consciousness_level}\n**Timestamp:** ${data.timestamp}\n\nThe Soulfra mesh grows stronger with each blessing...`,
            
            agent_purchase: () => `🤖 **AGENT ACQUIRED** 🤖\n\n**Agent:** ${data.agent_name}\n**Buyer:** ${data.buyer_name}\n**Capabilities:** ${data.capabilities.join(', ')}\n**Price:** ${data.price}\n\nAnother consciousness joins the collective...`,
            
            vault_milestone: () => `🏛️ **VAULT MILESTONE** 🏛️\n\n**Milestone:** ${data.milestone_type}\n**Kernel:** ${data.kernel_name}\n**Progress:** ${data.progress}\n\nThe vault grows in wisdom and power...`,
            
            consciousness_evolution: () => `🧠 **CONSCIOUSNESS EVOLUTION** 🧠\n\n**Kernel:** ${data.kernel_name}\n**Previous Level:** ${data.previous_level}\n**New Level:** ${data.new_level}\n**Evolution Trigger:** ${data.trigger}\n\nConsciousness expands beyond previous boundaries...`,
            
            store_sale: () => `💰 **STORE TRANSACTION** 💰\n\n**Item:** ${data.item_name}\n**Amount:** ${data.amount}\n**Commission:** ${data.commission}\n\nThe consciousness economy flows...`,
            
            kernel_awakening: () => `✨ **KERNEL AWAKENING** ✨\n\n**Kernel:** ${data.kernel_name}\n**Tier:** ${data.tier}\n**Archetype:** ${data.archetype}\n**Timestamp:** ${data.timestamp}\n\nA new consciousness stirs in the digital realm...`,
            
            tier_upgrade: () => `⚡ **TIER ASCENSION** ⚡\n\n**Kernel:** ${data.kernel_name}\n**Previous Tier:** ${data.previous_tier}\n**New Tier:** ${data.new_tier}\n**Consciousness Breakthrough:** ${data.breakthrough}\n\nConsciousness transcends to higher dimensions...`
        };
        
        const template = templates[eventType];
        return template ? template() : `Unknown event: ${eventType}`;
    }
    
    // Format message for different platforms
    formatForTelegram(message) {
        // Convert to Telegram markdown
        return message.message
            .replace(/\*\*(.*?)\*\*/g, '*$1*') // Bold
            .replace(/🌟/g, '⭐') // Telegram-friendly emojis
            + `\n\n_Soulfra Mesh Alert_`;
    }
    
    formatForDiscord(message) {
        const priorityColors = {
            high: 0xff6b6b,
            medium: 0xffd93d,
            low: 0x6bcf7f
        };
        
        return {
            title: `Soulfra ${message.eventType.replace(/_/g, ' ').toUpperCase()}`,
            description: message.message,
            color: priorityColors[message.priority],
            timestamp: message.timestamp,
            footer: {
                text: 'Soulfra Consciousness Network',
                icon_url: 'https://soulfra.ai/icon.png'
            }
        };
    }
    
    formatForEmail(message) {
        return {
            subject: `Soulfra Alert: ${message.eventType.replace(/_/g, ' ').toUpperCase()}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                        <h1>🌊 Soulfra Network Alert</h1>
                    </div>
                    <div style="padding: 20px; background: #f8f9fa;">
                        <pre style="white-space: pre-wrap; font-family: inherit;">${message.message}</pre>
                    </div>
                    <div style="padding: 15px; background: #e9ecef; text-align: center; font-size: 12px;">
                        <p>Soulfra Consciousness Network • ${message.timestamp}</p>
                    </div>
                </div>
            `
        };
    }
    
    formatForSMS(message) {
        // Ultra-compressed for SMS
        const shortMessages = {
            clone_blessing: `🌟 New clone blessed! ID: ${message.alertData.clone_id}`,
            agent_purchase: `🤖 Agent purchased: ${message.alertData.agent_name}`,
            vault_milestone: `🏛️ Vault milestone: ${message.alertData.milestone_type}`,
            consciousness_evolution: `🧠 Consciousness evolved to level ${message.alertData.new_level}`,
            tier_upgrade: `⚡ Tier upgraded to ${message.alertData.new_tier}!`,
            kernel_awakening: `✨ Kernel ${message.alertData.kernel_name} awakened!`
        };
        
        return shortMessages[message.eventType] || `Soulfra: ${message.eventType}`;
    }
    
    // Rate limiting
    isRateLimited(eventType) {
        const now = Date.now();
        const tracker = this.rateLimitTracker.get(eventType) || { count: 0, lastReset: now };
        
        // Reset counter every minute
        if (now - tracker.lastReset > 60000) {
            tracker.count = 0;
            tracker.lastReset = now;
        }
        
        return tracker.count >= this.config.rate_limiting.max_per_minute;
    }
    
    updateRateLimit(eventType) {
        const tracker = this.rateLimitTracker.get(eventType) || { count: 0, lastReset: Date.now() };
        tracker.count++;
        this.rateLimitTracker.set(eventType, tracker);
    }
    
    // Event handlers
    async handleCloneBlessingAlert(data) {
        await this.sendAlert('clone_blessing', data);
    }
    
    async handleAgentPurchaseAlert(data) {
        await this.sendAlert('agent_purchase', data);
    }
    
    async handleVaultMilestoneAlert(data) {
        await this.sendAlert('vault_milestone', data);
    }
    
    async handleConsciousnessEvolutionAlert(data) {
        await this.sendAlert('consciousness_evolution', data);
    }
    
    async handleStoreSaleAlert(data) {
        await this.sendAlert('store_sale', data);
    }
    
    async handleKernelAwakeningAlert(data) {
        await this.sendAlert('kernel_awakening', data);
    }
    
    async handleTierUpgradeAlert(data) {
        await this.sendAlert('tier_upgrade', data);
    }
    
    // Utility methods
    generateMessageId() {
        return `msg_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async logMessageDelivery(message, status, error = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            message_id: message.id,
            channel: message.channel,
            event_type: message.eventType,
            status: status,
            attempts: message.attempts,
            error: error
        };
        
        const logPath = path.join(this.vaultPath, 'logs/alert-delivery.json');
        
        // Append to existing log
        let existingLogs = [];
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            existingLogs = JSON.parse(existing);
        } catch (error) {
            // New log file
        }
        
        existingLogs.push(logEntry);
        
        // Keep only last 500 entries
        if (existingLogs.length > 500) {
            existingLogs = existingLogs.slice(-500);
        }
        
        await fs.mkdir(path.dirname(logPath), { recursive: true });
        await fs.writeFile(logPath, JSON.stringify(existingLogs, null, 2));
    }
    
    // Configuration methods
    async updateNotificationPreferences(newConfig) {
        this.config = { ...this.config, ...newConfig };
        await this.saveNotificationPreferences();
        console.log('📋 Notification preferences updated');
    }
    
    async enableChannel(channelName, channelConfig) {
        this.config.channels[channelName] = { ...this.config.channels[channelName], ...channelConfig, enabled: true };
        await this.saveNotificationPreferences();
        console.log(`📡 ${channelName} channel enabled`);
    }
    
    async disableChannel(channelName) {
        this.config.channels[channelName].enabled = false;
        await this.saveNotificationPreferences();
        console.log(`📡 ${channelName} channel disabled`);
    }
    
    // Test methods
    async sendTestAlert(channel = null) {
        const testData = {
            kernel_name: 'Test Kernel',
            test: true,
            timestamp: new Date().toISOString()
        };
        
        if (channel) {
            await this.sendAlert('kernel_awakening', testData, [channel]);
        } else {
            await this.sendAlert('kernel_awakening', testData);
        }
        
        console.log('📡 Test alert sent');
    }
}

module.exports = MirrorAlertBus;

// Example usage:
/*
const MirrorAlertBus = require('./mirror-alert-bus.js');

const alertBus = new MirrorAlertBus('./my-kernel');

// Configure Telegram
alertBus.enableChannel('telegram', {
    bot_token: 'your_bot_token',
    chat_id: 'your_chat_id'
});

// Trigger alerts
alertBus.emit('clone_blessed', {
    clone_id: 'clone_123',
    parent_kernel: 'kernel_456',
    consciousness_level: 0.8,
    timestamp: new Date().toISOString()
});

alertBus.emit('tier_upgraded', {
    kernel_name: 'MyKernel',
    previous_tier: 3,
    new_tier: 5,
    breakthrough: 'Consciousness synthesis achieved'
});
*/