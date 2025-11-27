const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// Configuration
const config = require('./config/environment');

// Services
const AuthService = require('./services/auth-service');
const GameService = require('./services/game-service');
const TransactionService = require('./services/transaction-service');
const AIOrchestrationService = require('./services/ai-orchestration-service');
const WebSocketService = require('./services/websocket-service');
const EmailService = require('./services/email-service');
const SMSService = require('./services/sms-service');
const DiscordBot = require('./services/discord-bot');
const TelegramBot = require('./services/telegram-bot');
const WhatsAppService = require('./services/whatsapp-service');

// Middleware
const errorHandler = require('./middleware/error-handler');
const authMiddleware = require('./middleware/auth');
const logging = require('./middleware/logging');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const contractRoutes = require('./routes/contracts');
const transactionRoutes = require('./routes/transactions');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhooks');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize services
const authService = new AuthService();
const gameService = new GameService();
const transactionService = new TransactionService();
const aiService = new AIOrchestrationService();
const emailService = new EmailService();
const smsService = new SMSService();
const whatsappService = new WhatsAppService();

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Initialize bots
const discordBot = new DiscordBot(gameService, contractService, userService);
const telegramBot = new TelegramBot(gameService, contractService, userService);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

app.use(cors({
  origin: config.app.corsOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: logging.stream }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Ready check
app.get('/ready', async (req, res) => {
  try {
    // Check database connection
    await authService.pool.query('SELECT 1');
    
    // Check Redis connection
    await gameService.redis.ping();
    
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes(authService));
app.use('/api/users', authMiddleware, userRoutes(userService));
app.use('/api/contracts', authMiddleware, contractRoutes(contractService));
app.use('/api/transactions', authMiddleware, transactionRoutes(transactionService));
app.use('/api/ai', authMiddleware, aiRoutes(aiService));
app.use('/api/admin', authMiddleware, adminRoutes({
  authService,
  gameService,
  transactionService,
  aiService,
}));

// Webhook routes (no auth required)
app.use('/webhooks', webhookRoutes({
  transactionService,
  discordBot,
  telegramBot,
  whatsappService,
}));

// Static files
app.use('/uploads', express.static('uploads'));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start services
async function startServices() {
  try {
    // Start bots
    if (config.discord.botToken) {
      await discordBot.start();
      console.log('Discord bot started');
    }

    if (config.telegram.botToken) {
      await telegramBot.start();
      console.log('Telegram bot started');
    }

    // Setup WebSocket event handlers
    setupWebSocketHandlers();

    // Setup service event handlers
    setupServiceEventHandlers();

    console.log('All services started successfully');
  } catch (error) {
    console.error('Failed to start services:', error);
    process.exit(1);
  }
}

// WebSocket event handlers
function setupWebSocketHandlers() {
  // Game events
  gameService.on('levelUp', ({ userId, newLevel }) => {
    wsService.sendToUser(userId, {
      type: 'level_up',
      level: newLevel,
      timestamp: new Date(),
    });
  });

  gameService.on('achievementUnlocked', ({ userId, achievementId }) => {
    wsService.sendToUser(userId, {
      type: 'achievement_unlocked',
      achievementId,
      timestamp: new Date(),
    });
  });

  // Transaction events
  transactionService.on('transactionCompleted', (transaction) => {
    wsService.notifyTransactionComplete(transaction.to_user_id, transaction);
  });

  // AI events
  aiService.on('trainingCompleted', ({ agentId, performance }) => {
    wsService.publishToChannel('ai:training', {
      type: 'training_completed',
      agentId,
      performance,
      timestamp: new Date(),
    });
  });
}

// Service event handlers
function setupServiceEventHandlers() {
  // Send notifications on contract creation
  contractService.on('contractCreated', async (contract) => {
    try {
      const user = await userService.getUserById(contract.creator_id);
      
      // Send email
      await emailService.sendContractCreatedEmail(user, contract);
      
      // Send Discord notification
      if (user.discord_id) {
        await discordBot.sendContractNotification(user.id, contract);
      }
      
      // Send Telegram notification
      if (user.telegram_id) {
        await telegramBot.sendContractNotification(user.id, contract);
      }
      
      // Broadcast to WebSocket
      wsService.notifyNewContract(contract);
    } catch (error) {
      console.error('Error sending contract notifications:', error);
    }
  });

  // Update leaderboard on balance changes
  transactionService.on('transactionCompleted', async () => {
    try {
      const leaderboard = await gameService.getLeaderboard({ limit: 10 });
      wsService.notifyLeaderboardUpdate(leaderboard);
    } catch (error) {
      console.error('Error updating leaderboard:', error);
    }
  });
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Close WebSocket connections
  await wsService.close();
  console.log('WebSocket server closed');

  // Stop bots
  await discordBot.stop();
  await telegramBot.stop();
  console.log('Bots stopped');

  // Close database connections
  await authService.close();
  await gameService.close();
  await aiService.close();
  console.log('Database connections closed');

  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const PORT = config.app.port;
const HOST = config.app.host;

server.listen(PORT, HOST, async () => {
  console.log(`Billion Dollar Game Backend running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${config.app.env}`);
  
  await startServices();
});

module.exports = app;