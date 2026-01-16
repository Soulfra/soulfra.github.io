const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class CalChatServer {
  constructor(port, vaultLogger) {
    this.port = port;
    this.vaultLogger = vaultLogger;
    this.wss = null;
    this.clients = new Map();
    this.conversations = new Map();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      const client = {
        id: clientId,
        ws,
        userId: null,
        conversationId: null
      };

      this.clients.set(clientId, client);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(clientId, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        message: 'Welcome to Cal Chat'
      }));
    });

    console.log(`Cal Chat WebSocket server started on port ${this.port}`);
  }

  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    
    switch (data.type) {
      case 'auth':
        await this.handleAuth(client, data);
        break;
      
      case 'message':
        await this.handleChatMessage(client, data);
        break;
      
      case 'start_conversation':
        await this.startConversation(client, data);
        break;
      
      case 'end_conversation':
        await this.endConversation(client);
        break;
      
      case 'get_history':
        await this.sendHistory(client);
        break;
      
      default:
        client.ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  async handleAuth(client, data) {
    client.userId = data.userId || `user-${uuidv4()}`;
    
    await this.vaultLogger.log('cal-chat', 'user_authenticated', {
      clientId: client.id,
      userId: client.userId
    });

    client.ws.send(JSON.stringify({
      type: 'auth_success',
      userId: client.userId
    }));
  }

  async startConversation(client, data) {
    const conversationId = uuidv4();
    client.conversationId = conversationId;
    
    this.conversations.set(conversationId, {
      id: conversationId,
      userId: client.userId,
      messages: [],
      startTime: new Date().toISOString(),
      metadata: data.metadata || {}
    });

    await this.vaultLogger.log('cal-chat', 'conversation_started', {
      conversationId,
      userId: client.userId
    });

    client.ws.send(JSON.stringify({
      type: 'conversation_started',
      conversationId
    }));
  }

  async handleChatMessage(client, data) {
    if (!client.conversationId) {
      await this.startConversation(client, {});
    }

    const conversation = this.conversations.get(client.conversationId);
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      type: 'user',
      content: data.content,
      timestamp: new Date().toISOString()
    };
    
    conversation.messages.push(userMessage);

    // Echo back to user
    client.ws.send(JSON.stringify({
      type: 'message_received',
      message: userMessage
    }));

    // Generate Cal response
    const calResponse = await this.generateCalResponse(data.content, conversation);
    
    conversation.messages.push(calResponse);

    // Send Cal's response
    setTimeout(() => {
      client.ws.send(JSON.stringify({
        type: 'cal_response',
        message: calResponse
      }));
    }, 500);

    // Log interaction
    await this.vaultLogger.log('cal-chat', 'message_exchange', {
      conversationId: client.conversationId,
      userMessage: userMessage.content,
      calResponse: calResponse.content
    });
  }

  async generateCalResponse(userMessage, conversation) {
    // Simulate Cal's personality and responses
    const responses = {
      greeting: [
        "Hey there! I'm Cal. What's on your mind?",
        "Hello! Ready to explore some ideas together?",
        "Hi! Cal here. How can I help you today?"
      ],
      question: [
        "That's an interesting question. Let me think about that...",
        "Great question! Here's my perspective...",
        "I love when people ask thoughtful questions like that."
      ],
      general: [
        "I see what you're getting at. Tell me more.",
        "That's fascinating! Have you considered this angle?",
        "Interesting point. Let's dive deeper into that."
      ]
    };

    let responseType = 'general';
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.match(/hello|hi|hey|greetings/)) {
      responseType = 'greeting';
    } else if (lowerMessage.includes('?')) {
      responseType = 'question';
    }

    const responseOptions = responses[responseType];
    const selectedResponse = responseOptions[Math.floor(Math.random() * responseOptions.length)];

    // Add contextual elements based on conversation history
    let finalResponse = selectedResponse;
    if (conversation.messages.length > 4) {
      finalResponse += " By the way, we've been having a great conversation!";
    }

    return {
      id: uuidv4(),
      type: 'cal',
      content: finalResponse,
      timestamp: new Date().toISOString(),
      metadata: {
        responseType,
        conversationLength: conversation.messages.length
      }
    };
  }

  async endConversation(client) {
    if (!client.conversationId) return;

    const conversation = this.conversations.get(client.conversationId);
    if (conversation) {
      // Save conversation to vault
      await this.vaultLogger.saveConversation(client.userId, conversation.messages);
      
      // Clean up
      this.conversations.delete(client.conversationId);
      client.conversationId = null;

      client.ws.send(JSON.stringify({
        type: 'conversation_ended',
        summary: {
          messageCount: conversation.messages.length,
          duration: this.calculateDuration(conversation.startTime)
        }
      }));
    }
  }

  async sendHistory(client) {
    // In a real implementation, this would fetch from vault
    const history = [];
    
    client.ws.send(JSON.stringify({
      type: 'history',
      conversations: history
    }));
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client && client.conversationId) {
      this.endConversation(client);
    }
    this.clients.delete(clientId);
  }

  calculateDuration(startTime) {
    const start = new Date(startTime);
    const end = new Date();
    return Math.floor((end - start) / 1000);
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

module.exports = CalChatServer;