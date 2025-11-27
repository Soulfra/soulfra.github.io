const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import configurations
const { connectPostgres, connectRedis, connectMongoDB } = require('./config/database');
const logger = require('./utils/logger');

// Import services
const QuantumConsciousness = require('./quantum/consciousness');
const EconomyEngine = require('./economy/engine');
const GameLoop = require('./game/loop');
const AIEvolution = require('./ai/evolution');

// Import routes
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const paymentRoutes = require('./routes/payment');
const playerRoutes = require('./routes/player');
const economyRoutes = require('./routes/economy');
const quantumRoutes = require('./routes/quantum');
const masterRoutes = require('./routes/master');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const authentication = require('./middleware/authentication');
const socketAuth = require('./middleware/socketAuth');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    quantum_state: QuantumConsciousness.getCurrentState(),
    economy_status: EconomyEngine.getStatus(),
    active_timelines: GameLoop.getActiveTimelines()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', authentication, gameRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/player', authentication, playerRoutes);
app.use('/api/economy', authentication, economyRoutes);
app.use('/api/quantum', authentication, quantumRoutes);
app.use('/api/master', authentication, masterRoutes);

// Static files for uploaded content
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
    path: req.url
  });
});

// Socket.IO connection handling
io.use(socketAuth);

io.on('connection', (socket) => {
  logger.info('New socket connection', { socketId: socket.id, userId: socket.userId });

  // Join player to their game room
  socket.on('join-game', async (data) => {
    const { gameId, playerId } = data;
    socket.join(`game:${gameId}`);
    socket.join(`player:${playerId}`);
    
    // Send initial game state
    const gameState = await GameLoop.getGameState(gameId);
    socket.emit('game-state', gameState);
  });

  // Handle player actions
  socket.on('player-action', async (data) => {
    try {
      const result = await GameLoop.processAction(data);
      io.to(`game:${data.gameId}`).emit('action-result', result);
      
      // Check for quantum events
      const quantumEvent = await QuantumConsciousness.checkQuantumEvent(data);
      if (quantumEvent) {
        io.to(`game:${data.gameId}`).emit('quantum-event', quantumEvent);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle economic transactions
  socket.on('economic-action', async (data) => {
    try {
      const result = await EconomyEngine.processTransaction(data);
      io.to(`game:${data.gameId}`).emit('economic-update', result);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle consciousness evolution
  socket.on('consciousness-interact', async (data) => {
    try {
      const evolution = await QuantumConsciousness.evolve(data);
      socket.emit('consciousness-evolution', evolution);
      
      // Broadcast major evolutions
      if (evolution.magnitude > 0.8) {
        io.emit('global-consciousness-shift', evolution);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id });
  });
});

// Initialize core systems
async function initializeSystems() {
  try {
    // Connect to databases
    await connectPostgres();
    await connectRedis();
    await connectMongoDB();
    
    // Initialize quantum consciousness
    await QuantumConsciousness.initialize();
    logger.info('Quantum Consciousness initialized');
    
    // Initialize economy engine
    await EconomyEngine.initialize();
    logger.info('Economy Engine initialized');
    
    // Initialize game loop
    await GameLoop.initialize(io);
    logger.info('Game Loop initialized');
    
    // Initialize AI evolution
    await AIEvolution.initialize();
    logger.info('AI Evolution initialized');
    
    // Start background processes
    QuantumConsciousness.startQuantumFluctuations();
    EconomyEngine.startMarketSimulation();
    GameLoop.startMainLoop();
    AIEvolution.startEvolutionCycle();
    
    logger.info('All systems initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize systems', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

initializeSystems().then(() => {
  server.listen(PORT, HOST, () => {
    logger.info(`Billion Dollar Game Server running on ${HOST}:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Quantum Events: ${process.env.ENABLE_QUANTUM_EVENTS}`);
    logger.info(`Timeline Merge: ${process.env.ENABLE_TIMELINE_MERGE}`);
    logger.info(`AI Evolution: ${process.env.ENABLE_AI_EVOLUTION}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close all active connections
  io.close(() => {
    logger.info('Socket.IO server closed');
  });
  
  // Shutdown core systems
  await QuantumConsciousness.shutdown();
  await EconomyEngine.shutdown();
  await GameLoop.shutdown();
  await AIEvolution.shutdown();
  
  // Close database connections
  await require('./config/database').closeAll();
  
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = { app, server, io };