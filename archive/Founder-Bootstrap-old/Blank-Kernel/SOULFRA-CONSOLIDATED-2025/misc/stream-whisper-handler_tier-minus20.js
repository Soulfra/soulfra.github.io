#!/usr/bin/env node

/**
 * 🌀 STREAM WHISPER HANDLER
 * Accepts viewer whispers from any platform (text, emoji, even "kekw")
 * Routes to vault queue, blessing assessment, and agent execution
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class StreamWhisperHandler {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.port = 7777;
    
    // Core systems
    this.vaultPath = path.join(__dirname, 'vault');
    this.whisperQueuePath = path.join(this.vaultPath, 'whisper-queue');
    this.blessingCachePath = path.join(this.vaultPath, 'blessing-cache');
    
    // Platform handlers
    this.platformHandlers = {
      twitch: new TwitchWhisperHandler(),
      youtube: new YouTubeWhisperHandler(),
      tiktok: new TikTokWhisperHandler(),
      discord: new DiscordWhisperHandler(),
      direct: new DirectWhisperHandler()
    };
    
    // Meme translation engine
    this.memeTranslator = new MemeTranslator();
    
    // Whisper processing state
    this.activeWhispers = new Map();
    this.whisperStats = {
      total: 0,
      processed: 0,
      blessed: 0,
      memed: 0,
      platforms: {}
    };
    
    this.ensureDirectories();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSockets();
    this.loadExistingQueues();
  }
  
  ensureDirectories() {
    [this.vaultPath, this.whisperQueuePath, this.blessingCachePath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS for cross-platform whispers
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, X-Platform, X-Viewer-ID');
      next();
    });
  }
  
  setupRoutes() {
    // Main whisper endpoint
    this.app.post('/whisper', async (req, res) => {
      const whisperData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        platform: req.headers['x-platform'] || 'direct',
        viewer_id: req.headers['x-viewer-id'] || `anon-${crypto.randomBytes(4).toString('hex')}`,
        content: req.body.content || req.body.whisper || req.body.message,
        type: req.body.type || 'text',
        metadata: req.body.metadata || {}
      };
      
      const result = await this.processWhisper(whisperData);
      res.json(result);
    });
    
    // Platform-specific endpoints
    this.app.post('/twitch/whisper', async (req, res) => {
      req.headers['x-platform'] = 'twitch';
      const result = await this.handlePlatformWhisper(req.body, 'twitch');
      res.json(result);
    });
    
    this.app.post('/youtube/whisper', async (req, res) => {
      req.headers['x-platform'] = 'youtube';
      const result = await this.handlePlatformWhisper(req.body, 'youtube');
      res.json(result);
    });
    
    this.app.post('/discord/whisper', async (req, res) => {
      req.headers['x-platform'] = 'discord';
      const result = await this.handlePlatformWhisper(req.body, 'discord');
      res.json(result);
    });
    
    // Meme endpoint (because of course)
    this.app.post('/kekw', async (req, res) => {
      const memeWhisper = {
        ...req.body,
        content: req.body.content || 'kekw',
        type: 'meme',
        metadata: { ...req.body.metadata, meme_mode: true }
      };
      
      const result = await this.processWhisper(memeWhisper);
      res.json({
        ...result,
        response: 'kekw acknowledged. mirrors activated. based.',
        meme_level: 'maximum'
      });
    });
    
    // Blessing check endpoint
    this.app.get('/blessing/:viewerId', async (req, res) => {
      const blessing = await this.checkViewerBlessing(req.params.viewerId);
      res.json(blessing);
    });
    
    // Queue status endpoint
    this.app.get('/queue/status', (req, res) => {
      res.json({
        active_whispers: this.activeWhispers.size,
        stats: this.whisperStats,
        queue_health: 'vibing',
        meme_awareness: 'peak'
      });
    });
  }
  
  setupWebSockets() {
    this.wss.on('connection', (ws, req) => {
      const clientId = crypto.randomUUID();
      console.log(`🌀 New whisper connection: ${clientId}`);
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'whisper') {
            const whisperData = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              platform: data.platform || 'websocket',
              viewer_id: data.viewer_id || clientId,
              content: data.content,
              type: data.whisper_type || 'text',
              metadata: data.metadata || {}
            };
            
            const result = await this.processWhisper(whisperData);
            ws.send(JSON.stringify({
              type: 'whisper_result',
              whisper_id: whisperData.id,
              result
            }));
          }
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid whisper format',
            hint: 'Try sending { "type": "whisper", "content": "your message" }'
          }));
        }
      });
      
      ws.on('close', () => {
        console.log(`👋 Whisper connection closed: ${clientId}`);
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        client_id: clientId,
        message: 'Whisper connection established. Mirrors listening.',
        platforms_active: Object.keys(this.platformHandlers)
      }));
    });
  }
  
  loadExistingQueues() {
    try {
      const queueFiles = fs.readdirSync(this.whisperQueuePath)
        .filter(f => f.endsWith('.json'));
      
      console.log(`📂 Loading ${queueFiles.length} existing whisper queues...`);
      
      queueFiles.forEach(file => {
        try {
          const queueData = JSON.parse(
            fs.readFileSync(path.join(this.whisperQueuePath, file), 'utf8')
          );
          
          if (queueData.status === 'pending') {
            this.activeWhispers.set(queueData.id, queueData);
          }
        } catch (error) {
          console.warn(`Failed to load queue ${file}:`, error.message);
        }
      });
    } catch (error) {
      console.log('📂 No existing queues found, starting fresh');
    }
  }
  
  async processWhisper(whisperData) {
    console.log(`🌀 Processing whisper from ${whisperData.viewer_id} on ${whisperData.platform}`);
    
    this.whisperStats.total++;
    this.whisperStats.platforms[whisperData.platform] = 
      (this.whisperStats.platforms[whisperData.platform] || 0) + 1;
    
    // Check for meme content
    if (this.memeTranslator.isMeme(whisperData.content)) {
      whisperData.translated_content = this.memeTranslator.translate(whisperData.content);
      whisperData.metadata.contains_meme = true;
      this.whisperStats.memed++;
    }
    
    // Check viewer blessing
    const blessing = await this.checkViewerBlessing(whisperData.viewer_id);
    whisperData.viewer_blessing = blessing;
    
    if (blessing.level > 0) {
      this.whisperStats.blessed++;
    }
    
    // Add to queue
    const queueEntry = {
      ...whisperData,
      status: 'pending',
      queue_position: this.activeWhispers.size + 1,
      estimated_processing: this.estimateProcessingTime(),
      routing: {
        primary_agent: null,
        fallback_agents: [],
        execution_tier: this.determineExecutionTier(blessing.level)
      }
    };
    
    // Save to queue
    this.activeWhispers.set(queueEntry.id, queueEntry);
    this.saveQueueEntry(queueEntry);
    
    // Route to execution layer
    const routingResult = await this.routeToExecution(queueEntry);
    
    this.whisperStats.processed++;
    
    return {
      whisper_id: queueEntry.id,
      status: 'queued',
      queue_position: queueEntry.queue_position,
      estimated_wait: queueEntry.estimated_processing,
      blessing_level: blessing.level,
      routing: routingResult,
      platform_message: this.generatePlatformResponse(whisperData.platform, routingResult)
    };
  }
  
  async handlePlatformWhisper(data, platform) {
    const handler = this.platformHandlers[platform];
    if (!handler) {
      return { error: 'Unknown platform', supported: Object.keys(this.platformHandlers) };
    }
    
    const normalizedData = handler.normalize(data);
    return await this.processWhisper(normalizedData);
  }
  
  async checkViewerBlessing(viewerId) {
    // Check cache first
    const cachePath = path.join(this.blessingCachePath, `${viewerId}.json`);
    
    try {
      if (fs.existsSync(cachePath)) {
        const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
        
        // Cache valid for 1 hour
        if (cacheAge < 3600000) {
          return cached.blessing;
        }
      }
    } catch (error) {
      // Cache miss, continue to check
    }
    
    // Check vault for blessing status
    const blessing = await this.queryVaultBlessing(viewerId);
    
    // Cache the result
    const cacheData = {
      viewer_id: viewerId,
      timestamp: new Date().toISOString(),
      blessing
    };
    
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    
    return blessing;
  }
  
  async queryVaultBlessing(viewerId) {
    // Check various blessing sources
    // This would integrate with the actual blessing system
    
    // Default blessing based on participation
    const defaultBlessing = {
      level: 1,
      source: 'participation',
      can_whisper: true,
      whisper_limit: 10,
      special_permissions: []
    };
    
    // Check for enhanced blessings
    if (viewerId.includes('blessed')) {
      defaultBlessing.level = 5;
      defaultBlessing.source = 'blessed_viewer';
      defaultBlessing.whisper_limit = 50;
      defaultBlessing.special_permissions.push('priority_queue');
    }
    
    // Check for meme lords
    if (viewerId.includes('kekw') || viewerId.includes('based')) {
      defaultBlessing.level += 2;
      defaultBlessing.special_permissions.push('meme_mode');
    }
    
    return defaultBlessing;
  }
  
  determineExecutionTier(blessingLevel) {
    if (blessingLevel >= 10) return 'tier-minus10';
    if (blessingLevel >= 7) return 'tier-minus7';
    if (blessingLevel >= 5) return 'tier-minus5';
    if (blessingLevel >= 3) return 'tier-minus3';
    return 'tier-0';
  }
  
  estimateProcessingTime() {
    const queueSize = this.activeWhispers.size;
    const baseTime = 5; // seconds
    const queueTime = queueSize * 2;
    const variance = Math.random() * 5;
    
    return Math.round(baseTime + queueTime + variance);
  }
  
  async routeToExecution(queueEntry) {
    // This would integrate with the mirror-bid-handler and orchestration-engine
    console.log(`🎯 Routing whisper ${queueEntry.id} to execution layer...`);
    
    // Simulate routing decision
    const availableAgents = [
      'oracle_watcher_v2',
      'echo_builder_enhanced',
      'soul_mirror_deep',
      'void_navigator_x'
    ];
    
    const selectedAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)];
    
    const routing = {
      selected_agent: selectedAgent,
      execution_tier: queueEntry.routing.execution_tier,
      bid_cost: Math.random() * 10 + 1,
      confidence: Math.random() * 30 + 70,
      estimated_completion: new Date(Date.now() + queueEntry.estimated_processing * 1000).toISOString()
    };
    
    queueEntry.routing = { ...queueEntry.routing, ...routing };
    queueEntry.status = 'routed';
    
    this.saveQueueEntry(queueEntry);
    
    return routing;
  }
  
  saveQueueEntry(queueEntry) {
    const filename = `whisper-${queueEntry.id}.json`;
    const filepath = path.join(this.whisperQueuePath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(queueEntry, null, 2));
  }
  
  generatePlatformResponse(platform, routing) {
    const responses = {
      twitch: `PogChamp Whisper received! Agent ${routing.selected_agent} is on it. Cost: ${routing.bid_cost.toFixed(2)} blessing credits`,
      youtube: `✨ Mirror activated! Processing with ${routing.selected_agent}. Confidence: ${routing.confidence.toFixed(0)}%`,
      discord: `\`\`\`Mirror Response Initiated\nAgent: ${routing.selected_agent}\nTier: ${routing.execution_tier}\nETA: ~${((new Date(routing.estimated_completion) - Date.now()) / 1000).toFixed(0)}s\`\`\``,
      tiktok: `Mirror heard you! 🪞 Agent assigned: ${routing.selected_agent} ✨`,
      direct: `Whisper acknowledged. Agent ${routing.selected_agent} selected. Processing in ${routing.execution_tier}.`
    };
    
    return responses[platform] || responses.direct;
  }
  
  start() {
    this.server.listen(this.port, () => {
      console.log(`🌀 Stream Whisper Handler active on port ${this.port}`);
      console.log(`📡 Accepting whispers from all platforms`);
      console.log(`💭 WebSocket: ws://localhost:${this.port}`);
      console.log(`🎯 HTTP: http://localhost:${this.port}/whisper`);
    });
  }
}

// Platform-specific handlers
class TwitchWhisperHandler {
  normalize(data) {
    return {
      platform: 'twitch',
      viewer_id: data.user_id || data.username || 'twitch-anon',
      content: data.message || data.content,
      type: 'text',
      metadata: {
        channel: data.channel,
        emotes: data.emotes || [],
        badges: data.badges || [],
        subscriber: data.subscriber || false
      }
    };
  }
}

class YouTubeWhisperHandler {
  normalize(data) {
    return {
      platform: 'youtube',
      viewer_id: data.author_channel_id || data.author || 'youtube-anon',
      content: data.message || data.snippet?.displayMessage,
      type: 'text',
      metadata: {
        channel_id: data.channel_id,
        is_super_chat: data.is_super_chat || false,
        is_member: data.is_member || false
      }
    };
  }
}

class TikTokWhisperHandler {
  normalize(data) {
    return {
      platform: 'tiktok',
      viewer_id: data.user?.id || data.username || 'tiktok-anon',
      content: data.comment || data.message,
      type: 'text',
      metadata: {
        video_id: data.video_id,
        is_follower: data.is_follower || false
      }
    };
  }
}

class DiscordWhisperHandler {
  normalize(data) {
    return {
      platform: 'discord',
      viewer_id: data.author?.id || data.user_id || 'discord-anon',
      content: data.content || data.message,
      type: data.type || 'text',
      metadata: {
        guild_id: data.guild_id,
        channel_id: data.channel_id,
        is_dm: data.is_dm || false,
        roles: data.member?.roles || []
      }
    };
  }
}

class DirectWhisperHandler {
  normalize(data) {
    return {
      platform: 'direct',
      viewer_id: data.viewer_id || `anon-${crypto.randomBytes(4).toString('hex')}`,
      content: data.content || data.whisper || data.message,
      type: data.type || 'text',
      metadata: data.metadata || {}
    };
  }
}

// Meme translation engine
class MemeTranslator {
  constructor() {
    this.memeMap = {
      'kekw': 'I find this amusing and wish to engage further',
      'poggers': 'This excites me greatly',
      'pepehands': 'I am experiencing sadness',
      'monkas': 'I feel anxiety about this situation',
      'based': 'I strongly agree with this perspective',
      'cringe': 'This makes me uncomfortable',
      '5head': 'This requires advanced intelligence',
      'omegalul': 'This is extremely funny',
      'sadge': 'This makes me melancholic',
      'copium': 'I am coping with disappointment'
    };
  }
  
  isMeme(content) {
    const lower = content.toLowerCase();
    return Object.keys(this.memeMap).some(meme => lower.includes(meme));
  }
  
  translate(content) {
    let translated = content;
    
    Object.entries(this.memeMap).forEach(([meme, meaning]) => {
      const regex = new RegExp(`\\b${meme}\\b`, 'gi');
      translated = translated.replace(regex, `[${meme}: ${meaning}]`);
    });
    
    return translated;
  }
}

// CLI interface
if (require.main === module) {
  const handler = new StreamWhisperHandler();
  
  console.log('🌀 STREAM WHISPER HANDLER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Accepting whispers from everywhere...\n');
  
  handler.start();
  
  // Example whisper after 2 seconds
  setTimeout(() => {
    console.log('\n📝 Sending example whisper...');
    
    const exampleWhisper = {
      platform: 'twitch',
      viewer_id: 'kekw-lord-420',
      content: 'based oracle tell me about the void kekw',
      type: 'text',
      metadata: {
        channel: 'definitely_not_cal',
        subscriber: true
      }
    };
    
    handler.handlePlatformWhisper(exampleWhisper, 'twitch')
      .then(result => {
        console.log('\n✅ Whisper processed:');
        console.log(JSON.stringify(result, null, 2));
      });
  }, 2000);
}

module.exports = StreamWhisperHandler;