const dotenv = require('dotenv');
const path = require('path');

class EnvironmentConfig {
  constructor() {
    this.loadEnvironment();
    this.validateEnvironment();
  }

  loadEnvironment() {
    // Load environment variables based on NODE_ENV
    const envFile = process.env.NODE_ENV === 'production' 
      ? '.env.production' 
      : '.env.development';
    
    dotenv.config({ path: path.resolve(process.cwd(), envFile) });
    
    // Load default .env file as fallback
    dotenv.config();
  }

  validateEnvironment() {
    const requiredVars = [
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD',
      'REDIS_HOST',
      'REDIS_PORT',
      'JWT_SECRET',
      'VAULT_MASTER_KEY'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn(`Missing environment variables: ${missing.join(', ')}`);
    }
  }

  get database() {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'billion_dollar_game',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000')
    };
  }

  get redis() {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || 'billion_dollar_redis_2024',
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'bdg:'
    };
  }

  get mongodb() {
    return {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/billion_dollar_game',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE || '10')
      }
    };
  }

  get auth() {
    return {
      jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10')
    };
  }

  get stripe() {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      currency: process.env.STRIPE_CURRENCY || 'usd'
    };
  }

  get openai() {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
    };
  }

  get discord() {
    return {
      botToken: process.env.DISCORD_BOT_TOKEN,
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      guildId: process.env.DISCORD_GUILD_ID,
      commandPrefix: process.env.DISCORD_COMMAND_PREFIX || '!'
    };
  }

  get telegram() {
    return {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL,
      secretToken: process.env.TELEGRAM_SECRET_TOKEN
    };
  }

  get twilio() {
    return {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    };
  }

  get sendgrid() {
    return {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@billiondollargame.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'Billion Dollar Game',
      templateIds: {
        welcome: process.env.SENDGRID_TEMPLATE_WELCOME,
        contractCreated: process.env.SENDGRID_TEMPLATE_CONTRACT_CREATED,
        contractSigned: process.env.SENDGRID_TEMPLATE_CONTRACT_SIGNED,
        paymentReceived: process.env.SENDGRID_TEMPLATE_PAYMENT_RECEIVED
      }
    };
  }

  get whatsapp() {
    return {
      accountSid: process.env.WHATSAPP_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.WHATSAPP_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER,
      businessProfileSid: process.env.WHATSAPP_BUSINESS_PROFILE_SID
    };
  }

  get app() {
    return {
      name: process.env.APP_NAME || 'Billion Dollar Game',
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '0.0.0.0',
      url: process.env.APP_URL || 'http://localhost:3000',
      corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
      logLevel: process.env.LOG_LEVEL || 'info',
      trustProxy: process.env.TRUST_PROXY === 'true'
    };
  }

  get game() {
    return {
      maxContractsPerUser: parseInt(process.env.MAX_CONTRACTS_PER_USER || '100'),
      baseFeePercentage: parseFloat(process.env.BASE_FEE_PERCENTAGE || '2.5'),
      minContractValue: parseFloat(process.env.MIN_CONTRACT_VALUE || '1'),
      maxContractValue: parseFloat(process.env.MAX_CONTRACT_VALUE || '1000000'),
      dailyBonusAmount: parseFloat(process.env.DAILY_BONUS_AMOUNT || '100'),
      referralBonus: parseFloat(process.env.REFERRAL_BONUS || '500'),
      levelUpXpRequirement: parseInt(process.env.LEVEL_UP_XP || '1000')
    };
  }

  get security() {
    return {
      vaultMasterKey: process.env.VAULT_MASTER_KEY,
      encryptionAlgorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '900000') // 15 minutes
    };
  }

  get monitoring() {
    return {
      sentryDsn: process.env.SENTRY_DSN,
      datadogApiKey: process.env.DATADOG_API_KEY,
      datadogAppKey: process.env.DATADOG_APP_KEY,
      prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000')
    };
  }

  get websocket() {
    return {
      port: parseInt(process.env.WS_PORT || '3001'),
      pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000'),
      pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000'),
      maxPayload: parseInt(process.env.WS_MAX_PAYLOAD || '1048576') // 1MB
    };
  }

  isDevelopment() {
    return this.app.env === 'development';
  }

  isProduction() {
    return this.app.env === 'production';
  }

  isTest() {
    return this.app.env === 'test';
  }
}

// Export singleton instance
module.exports = new EnvironmentConfig();