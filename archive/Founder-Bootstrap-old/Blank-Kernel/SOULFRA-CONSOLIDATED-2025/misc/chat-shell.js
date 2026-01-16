#!/usr/bin/env node

/**
 * 💬 CHAT SHELL
 * 
 * Manages real-time chat with Twitch/4chan energy
 * Bot personalities, emotes, and maximum chaos
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ChatShell extends EventEmitter {
    constructor() {
        super();
        
        // Chat configuration
        this.config = {
            maxMessageLength: 280,
            maxMessagesPerMinute: 30,
            emoteSpamLimit: 10,
            botMessageChance: 0.15,
            reactionChance: 0.25,
            chaosMode: true
        };
        
        // Channels
        this.channels = new Map();
        
        // Message history
        this.messageHistory = new Map();
        
        // Now create default channels
        this.createDefaultChannels();
        
        // Bot personalities
        this.bots = this.createBotPersonalities();
        
        // Emotes and reactions
        this.emotes = this.loadEmotes();
        this.reactions = ['🔥', '💀', '💎', '🚀', '😂', '🤡', '⚔️', '💰', '🏆', '🫡'];
        
        // Spam tracking
        this.userActivity = new Map();
    }
    
    createDefaultChannels() {
        // Global channel
        this.createChannel('global', {
            name: 'Global',
            description: 'Everyone sees this',
            maxUsers: 10000,
            slowMode: false
        });
        
        // Arena channels
        this.createChannel('arena', {
            name: 'Arena',
            description: 'Current fight chat',
            maxUsers: 1000,
            slowMode: false
        });
        
        // Betting channel
        this.createChannel('betting', {
            name: 'High Rollers',
            description: 'Big money talk only',
            maxUsers: 500,
            minBetToJoin: 1000,
            slowMode: true
        });
        
        // Meme channel
        this.createChannel('memes', {
            name: 'Meme Dungeon',
            description: 'Pure chaos',
            maxUsers: 2000,
            chaosMultiplier: 2
        });
    }
    
    createChannel(id, config) {
        const channel = {
            id: id,
            name: config.name,
            description: config.description,
            users: new Set(),
            messages: [],
            created: Date.now(),
            config: config
        };
        
        this.channels.set(id, channel);
        this.messageHistory.set(id, []);
        
        return channel;
    }
    
    createBotPersonalities() {
        return [
            {
                name: 'GIGACHAD',
                personality: 'confident',
                phrases: [
                    'EASY MONEY BOYS',
                    'MY GLADIATOR NEVER LOSES',
                    'WITNESS GREATNESS',
                    'BUILT DIFFERENT FR FR',
                    'WHO ELSE BUT MY BOY'
                ]
            },
            {
                name: 'doomer_wojak',
                personality: 'pessimistic',
                phrases: [
                    'we are all gonna lose eventually',
                    'rigged game tbh',
                    'another day another L',
                    'why do i even bet anymore',
                    'pain is eternal'
                ]
            },
            {
                name: 'moonboy',
                personality: 'hype',
                phrases: [
                    'TO THE MOON 🚀🚀🚀',
                    'DIAMOND HANDS ONLY',
                    'BUY THE DIP',
                    'WE LIKE THE GLADIATOR',
                    'HODL YOUR BETS'
                ]
            },
            {
                name: 'coomer_supreme',
                personality: 'degenerate',
                phrases: [
                    'ALL IN BABY',
                    'DOUBLE OR NOTHING',
                    'MORTGAGE ON CAL PRIME',
                    'BORROWED FROM WIFE\'S BF',
                    'CANT STOP WONT STOP'
                ]
            },
            {
                name: 'anime_waifu_uwu',
                personality: 'weeb',
                phrases: [
                    'Cal-kun is so strong uwu',
                    'SUGOI DESU NE',
                    'notice me gladiator-senpai',
                    'kawaii death match >.<',
                    'nani?! that damage!'
                ]
            },
            {
                name: 'based_schizo',
                personality: 'conspiracy',
                phrases: [
                    'THEY DONT WANT YOU TO KNOW',
                    'gladiators are psyop confirmed',
                    'cal prime = illuminati',
                    'WAKE UP SHEEPLE',
                    'follow the money bros'
                ]
            }
        ];
    }
    
    loadEmotes() {
        return {
            'pog': '😮',
            'poggers': '🤯',
            'kek': '😂',
            'lul': '😆',
            'omegalul': '🤣',
            'pepehands': '😢',
            'monkas': '😰',
            'ez': '😎',
            'clap': '👏',
            'based': '💯',
            'cringe': '😬',
            'copium': '🤡',
            'sadge': '😔',
            'widepeepo': '🥺',
            'kappa': '😏'
        };
    }
    
    joinChannel(userId, username, channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) return false;
        
        // Check channel restrictions
        if (channel.users.size >= channel.config.maxUsers) {
            return { success: false, error: 'Channel full' };
        }
        
        channel.users.add(userId);
        
        // Announce join
        this.systemMessage(channelId, `${username} joined the chat`);
        
        return { success: true };
    }
    
    sendMessage(userId, username, channelId, text) {
        const channel = this.channels.get(channelId);
        if (!channel) return false;
        
        // Check if user is in channel
        if (!channel.users.has(userId)) {
            return { success: false, error: 'Not in channel' };
        }
        
        // Check spam
        if (!this.checkSpamLimit(userId)) {
            return { success: false, error: 'Slow down!' };
        }
        
        // Process emotes
        const processedText = this.processEmotes(text);
        
        // Create message
        const message = {
            id: crypto.randomBytes(8).toString('hex'),
            userId: userId,
            username: username,
            text: processedText,
            timestamp: Date.now(),
            reactions: new Map(),
            deleted: false
        };
        
        // Add to channel
        channel.messages.push(message);
        if (channel.messages.length > 100) {
            channel.messages.shift(); // Keep last 100
        }
        
        // Add to history
        const history = this.messageHistory.get(channelId);
        history.push(message);
        
        // Emit for real-time updates
        this.emit('message', {
            channelId: channelId,
            message: message
        });
        
        // Bot reactions
        this.triggerBotReactions(channelId, message);
        
        return { success: true, message: message };
    }
    
    processEmotes(text) {
        let processed = text;
        
        // Replace text emotes with emoji
        Object.entries(this.emotes).forEach(([emote, emoji]) => {
            const regex = new RegExp(`\\b${emote}\\b`, 'gi');
            processed = processed.replace(regex, emoji);
        });
        
        return processed;
    }
    
    checkSpamLimit(userId) {
        const now = Date.now();
        const activity = this.userActivity.get(userId) || [];
        
        // Remove old activity
        const recentActivity = activity.filter(time => now - time < 60000);
        
        if (recentActivity.length >= this.config.maxMessagesPerMinute) {
            return false;
        }
        
        recentActivity.push(now);
        this.userActivity.set(userId, recentActivity);
        
        return true;
    }
    
    triggerBotReactions(channelId, message) {
        // Random bot messages
        if (Math.random() < this.config.botMessageChance) {
            setTimeout(() => {
                const bot = this.bots[Math.floor(Math.random() * this.bots.length)];
                const phrase = bot.phrases[Math.floor(Math.random() * bot.phrases.length)];
                
                this.sendBotMessage(channelId, bot.name, phrase);
            }, Math.random() * 3000 + 1000); // 1-4 second delay
        }
        
        // Random reactions
        if (Math.random() < this.config.reactionChance) {
            const reaction = this.reactions[Math.floor(Math.random() * this.reactions.length)];
            this.addReaction(channelId, message.id, 'bot', reaction);
        }
    }
    
    sendBotMessage(channelId, botName, text) {
        const channel = this.channels.get(channelId);
        if (!channel) return;
        
        const message = {
            id: crypto.randomBytes(8).toString('hex'),
            userId: `bot_${botName}`,
            username: botName,
            text: text,
            timestamp: Date.now(),
            reactions: new Map(),
            isBot: true,
            deleted: false
        };
        
        channel.messages.push(message);
        if (channel.messages.length > 100) {
            channel.messages.shift();
        }
        
        this.emit('message', {
            channelId: channelId,
            message: message
        });
    }
    
    systemMessage(channelId, text) {
        const channel = this.channels.get(channelId);
        if (!channel) return;
        
        const message = {
            id: crypto.randomBytes(8).toString('hex'),
            userId: 'system',
            username: '🏛️ ARENA',
            text: text,
            timestamp: Date.now(),
            reactions: new Map(),
            isSystem: true,
            deleted: false
        };
        
        channel.messages.push(message);
        if (channel.messages.length > 100) {
            channel.messages.shift();
        }
        
        this.emit('message', {
            channelId: channelId,
            message: message
        });
    }
    
    addReaction(channelId, messageId, userId, reaction) {
        const channel = this.channels.get(channelId);
        if (!channel) return false;
        
        const message = channel.messages.find(m => m.id === messageId);
        if (!message) return false;
        
        if (!message.reactions.has(reaction)) {
            message.reactions.set(reaction, new Set());
        }
        
        message.reactions.get(reaction).add(userId);
        
        this.emit('reaction', {
            channelId: channelId,
            messageId: messageId,
            reaction: reaction,
            userId: userId
        });
        
        return true;
    }
    
    // Special chat events
    triggerFightEvent(fightId, event) {
        let messages = [];
        
        switch (event.type) {
            case 'fight_start':
                messages = [
                    'HERE WE GO BOYS',
                    'PLACE YOUR BETS',
                    'ITS HAPPENING',
                    'FIGHT FIGHT FIGHT'
                ];
                break;
                
            case 'critical_hit':
                messages = [
                    'HOLY SHIT',
                    'DESTROYED',
                    'GET REKT',
                    'THATS ALOTTA DAMAGE',
                    'RIP IN PEACE'
                ];
                break;
                
            case 'comeback':
                messages = [
                    'THE COMEBACK IS REAL',
                    'NEVER GIVE UP',
                    'PLOT ARMOR ACTIVATED',
                    'SCRIPTED AF'
                ];
                break;
                
            case 'fight_end':
                messages = [
                    'GG EZ',
                    'PAY UP LOSERS',
                    'I KNEW IT',
                    'RIGGED',
                    'GGWP'
                ];
                break;
        }
        
        // Send multiple bot messages
        const selectedBots = this.bots.sort(() => 0.5 - Math.random()).slice(0, 3);
        selectedBots.forEach((bot, index) => {
            setTimeout(() => {
                const message = messages[Math.floor(Math.random() * messages.length)];
                this.sendBotMessage('arena', bot.name, message);
            }, index * 500);
        });
    }
    
    getChannelMessages(channelId, limit = 50) {
        const channel = this.channels.get(channelId);
        if (!channel) return [];
        
        return channel.messages.slice(-limit);
    }
    
    getChannelStats(channelId) {
        const channel = this.channels.get(channelId);
        if (!channel) return null;
        
        const history = this.messageHistory.get(channelId) || [];
        const lastHour = Date.now() - 3600000;
        const recentMessages = history.filter(m => m.timestamp > lastHour);
        
        return {
            userCount: channel.users.size,
            messageCount: history.length,
            messagesPerHour: recentMessages.length,
            topEmotes: this.getTopEmotes(recentMessages),
            activeBots: this.bots.filter(bot => 
                recentMessages.some(m => m.userId === `bot_${bot.name}`)
            ).length
        };
    }
    
    getTopEmotes(messages) {
        const emoteCount = {};
        
        messages.forEach(message => {
            Object.keys(this.emotes).forEach(emote => {
                const count = (message.text.match(new RegExp(emote, 'gi')) || []).length;
                emoteCount[emote] = (emoteCount[emote] || 0) + count;
            });
        });
        
        return Object.entries(emoteCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([emote, count]) => ({ emote, count }));
    }
}

module.exports = ChatShell;