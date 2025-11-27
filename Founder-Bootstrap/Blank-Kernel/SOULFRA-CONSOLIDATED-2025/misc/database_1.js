const { Sequelize } = require('sequelize');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// PostgreSQL connection
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'billion_dollar_game',
  username: process.env.DB_USER || 'bdg_user',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? logger.debug : false,
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

// Redis connection
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// MongoDB connection
let mongoConnection = null;

// Connection functions
async function connectPostgres() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connected successfully');
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('PostgreSQL models synchronized');
    }
  } catch (error) {
    logger.error('PostgreSQL connection failed', error);
    throw error;
  }
}

async function connectRedis() {
  return new Promise((resolve, reject) => {
    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
      resolve();
    });
    
    redisClient.on('error', (error) => {
      logger.error('Redis connection error', error);
      reject(error);
    });
  });
}

async function connectMongoDB() {
  try {
    mongoConnection = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/billion_dollar_game_ai', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', error);
    throw error;
  }
}

// Graceful shutdown
async function closeAll() {
  try {
    await sequelize.close();
    logger.info('PostgreSQL connection closed');
    
    redisClient.disconnect();
    logger.info('Redis connection closed');
    
    if (mongoConnection) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    }
  } catch (error) {
    logger.error('Error closing database connections', error);
  }
}

// Health check
async function checkHealth() {
  const health = {
    postgres: false,
    redis: false,
    mongodb: false
  };
  
  try {
    await sequelize.authenticate();
    health.postgres = true;
  } catch (error) {
    logger.error('PostgreSQL health check failed', error);
  }
  
  try {
    await redisClient.ping();
    health.redis = true;
  } catch (error) {
    logger.error('Redis health check failed', error);
  }
  
  try {
    if (mongoose.connection.readyState === 1) {
      health.mongodb = true;
    }
  } catch (error) {
    logger.error('MongoDB health check failed', error);
  }
  
  return health;
}

module.exports = {
  sequelize,
  redisClient,
  mongoose,
  connectPostgres,
  connectRedis,
  connectMongoDB,
  closeAll,
  checkHealth
};