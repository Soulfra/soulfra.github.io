const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const EventEmitter = require('events');
const config = require('../config/environment');

class WebSocketService extends EventEmitter {
  constructor(server) {
    super();
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });
    
    this.redis = new Redis(config.redis);
    this.pubClient = new Redis(config.redis);
    this.subClient = new Redis(config.redis);
    
    this.clients = new Map();
    this.rooms = new Map();
    
    this.setupWebSocketServer();
    this.setupRedisSubscriptions();
  }

  verifyClient(info, cb) {
    const token = this.extractToken(info.req);
    
    if (!token) {
      cb(false, 401, 'Unauthorized');
      return;
    }

    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret);
      info.req.userId = decoded.userId;
      cb(true);
    } catch (error) {
      cb(false, 401, 'Invalid token');
    }
  }

  extractToken(req) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return auth.substring(7);
    }
    
    // Also check query params for token
    const url = new URL(req.url, `http://${req.headers.host}`);
    return url.searchParams.get('token');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const userId = req.userId;
      const clientId = this.generateClientId();
      
      // Store client connection
      const client = {
        id: clientId,
        userId: userId,
        ws: ws,
        rooms: new Set(),
        lastPing: Date.now()
      };
      
      this.clients.set(clientId, client);
      
      // Send welcome message
      this.sendToClient(client, {
        type: 'connected',
        clientId: clientId,
        userId: userId
      });
      
      // Join user's personal room
      this.joinRoom(client, `user:${userId}`);
      
      // Setup client handlers
      this.setupClientHandlers(client);
      
      console.log(`WebSocket client connected: ${clientId} (User: ${userId})`);
    });

    // Setup ping/pong for connection health
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, config.websocket.pingInterval);
  }

  setupClientHandlers(client) {
    const ws = client.ws;
    
    ws.isAlive = true;
    
    ws.on('pong', () => {
      ws.isAlive = true;
      client.lastPing = Date.now();
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleClientMessage(client, message);
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
        this.sendError(client, 'Invalid message format');
      }
    });

    ws.on('close', () => {
      this.handleClientDisconnect(client);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${client.id}:`, error);
    });
  }

  handleClientMessage(client, message) {
    const { type, payload } = message;
    
    switch (type) {
      case 'subscribe':
        this.handleSubscribe(client, payload);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(client, payload);
        break;
      case 'join_room':
        this.handleJoinRoom(client, payload);
        break;
      case 'leave_room':
        this.handleLeaveRoom(client, payload);
        break;
      case 'send_message':
        this.handleSendMessage(client, payload);
        break;
      case 'ping':
        this.sendToClient(client, { type: 'pong', timestamp: Date.now() });
        break;
      default:
        this.emit('custom_message', { client, type, payload });
    }
  }

  handleSubscribe(client, { channels }) {
    if (!Array.isArray(channels)) return;
    
    channels.forEach(channel => {
      // Validate channel access
      if (this.canAccessChannel(client.userId, channel)) {
        this.joinRoom(client, channel);
        
        // Subscribe to Redis channel if not already subscribed
        if (!this.rooms.has(channel)) {
          this.subClient.subscribe(channel);
        }
      }
    });
    
    this.sendToClient(client, {
      type: 'subscribed',
      channels: Array.from(client.rooms)
    });
  }

  handleUnsubscribe(client, { channels }) {
    if (!Array.isArray(channels)) return;
    
    channels.forEach(channel => {
      this.leaveRoom(client, channel);
    });
    
    this.sendToClient(client, {
      type: 'unsubscribed',
      channels: Array.from(client.rooms)
    });
  }

  handleJoinRoom(client, { room }) {
    if (this.canAccessRoom(client.userId, room)) {
      this.joinRoom(client, room);
      
      // Notify others in room
      this.broadcastToRoom(room, {
        type: 'user_joined',
        userId: client.userId,
        room: room
      }, client.id);
    }
  }

  handleLeaveRoom(client, { room }) {
    this.leaveRoom(client, room);
    
    // Notify others in room
    this.broadcastToRoom(room, {
      type: 'user_left',
      userId: client.userId,
      room: room
    }, client.id);
  }

  handleSendMessage(client, { room, message }) {
    if (!client.rooms.has(room)) {
      this.sendError(client, 'Not in room');
      return;
    }
    
    this.broadcastToRoom(room, {
      type: 'room_message',
      room: room,
      userId: client.userId,
      message: message,
      timestamp: Date.now()
    });
  }

  handleClientDisconnect(client) {
    // Leave all rooms
    client.rooms.forEach(room => {
      this.leaveRoom(client, room);
    });
    
    // Remove client
    this.clients.delete(client.id);
    
    console.log(`WebSocket client disconnected: ${client.id}`);
  }

  joinRoom(client, room) {
    client.rooms.add(room);
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    
    this.rooms.get(room).add(client.id);
  }

  leaveRoom(client, room) {
    client.rooms.delete(room);
    
    const roomClients = this.rooms.get(room);
    if (roomClients) {
      roomClients.delete(client.id);
      
      // Clean up empty rooms
      if (roomClients.size === 0) {
        this.rooms.delete(room);
        this.subClient.unsubscribe(room);
      }
    }
  }

  canAccessChannel(userId, channel) {
    // Implement channel access control
    // For now, users can access their own channels and public channels
    if (channel.startsWith(`user:${userId}`)) return true;
    if (channel.startsWith('public:')) return true;
    if (channel === 'contracts' || channel === 'transactions') return true;
    
    return false;
  }

  canAccessRoom(userId, room) {
    // Implement room access control
    if (room.startsWith(`contract:`)) {
      // Check if user is part of the contract
      // This would require database lookup
      return true;
    }
    
    return this.canAccessChannel(userId, room);
  }

  setupRedisSubscriptions() {
    this.subClient.on('message', (channel, message) => {
      try {
        const data = JSON.parse(message);
        this.handleRedisMessage(channel, data);
      } catch (error) {
        console.error('Invalid Redis message:', error);
      }
    });

    // Subscribe to global channels
    this.subClient.subscribe('global:announcements');
    this.subClient.subscribe('global:stats');
  }

  handleRedisMessage(channel, data) {
    // Broadcast to all clients in the channel/room
    const roomClients = this.rooms.get(channel);
    
    if (roomClients) {
      roomClients.forEach(clientId => {
        const client = this.clients.get(clientId);
        if (client) {
          this.sendToClient(client, {
            type: 'channel_message',
            channel: channel,
            data: data
          });
        }
      });
    }
  }

  // Public methods for sending messages

  sendToUser(userId, message) {
    const channel = `user:${userId}`;
    this.publishToChannel(channel, message);
  }

  sendToClient(client, message) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  broadcastToRoom(room, message, excludeClientId = null) {
    const roomClients = this.rooms.get(room);
    
    if (roomClients) {
      roomClients.forEach(clientId => {
        if (clientId !== excludeClientId) {
          const client = this.clients.get(clientId);
          if (client) {
            this.sendToClient(client, message);
          }
        }
      });
    }
  }

  publishToChannel(channel, message) {
    this.pubClient.publish(channel, JSON.stringify(message));
  }

  sendError(client, error) {
    this.sendToClient(client, {
      type: 'error',
      error: error,
      timestamp: Date.now()
    });
  }

  // Notification methods for different events

  notifyContractUpdate(contractId, update) {
    this.publishToChannel(`contract:${contractId}`, {
      type: 'contract_update',
      contractId: contractId,
      update: update,
      timestamp: Date.now()
    });
  }

  notifyTransactionComplete(userId, transaction) {
    this.sendToUser(userId, {
      type: 'transaction_complete',
      transaction: transaction,
      timestamp: Date.now()
    });
  }

  notifyNewContract(contract) {
    this.publishToChannel('contracts', {
      type: 'new_contract',
      contract: contract,
      timestamp: Date.now()
    });
  }

  notifyLeaderboardUpdate(leaderboard) {
    this.publishToChannel('public:leaderboard', {
      type: 'leaderboard_update',
      leaderboard: leaderboard,
      timestamp: Date.now()
    });
  }

  notifyGlobalStats(stats) {
    this.publishToChannel('global:stats', {
      type: 'stats_update',
      stats: stats,
      timestamp: Date.now()
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectionStats() {
    const stats = {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      clientsByUser: new Map()
    };
    
    this.clients.forEach(client => {
      const userClients = stats.clientsByUser.get(client.userId) || 0;
      stats.clientsByUser.set(client.userId, userClients + 1);
    });
    
    return stats;
  }

  async close() {
    // Close all client connections
    this.wss.clients.forEach(ws => {
      ws.close();
    });
    
    // Close Redis connections
    await this.redis.quit();
    await this.pubClient.quit();
    await this.subClient.quit();
    
    // Close WebSocket server
    this.wss.close();
  }
}

module.exports = WebSocketService;