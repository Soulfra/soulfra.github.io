// MirrorOS Demo Configuration
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3080,
    wsPort: process.env.WS_PORT || 3081,
    host: process.env.HOST || 'localhost'
  },

  // Module configurations
  modules: {
    calChat: {
      enabled: true,
      maxMessageLength: 1000,
      historyLimit: 100,
      aiResponseDelay: 500
    },
    agentMonetization: {
      enabled: true,
      stripeKey: process.env.STRIPE_KEY || 'sk_test_demo',
      exportFormats: ['json', 'zip', 'api'],
      pricingTiers: {
        basic: { price: 0, features: ['5 agents', 'basic export'] },
        pro: { price: 29, features: ['unlimited agents', 'all exports', 'API access'] },
        enterprise: { price: 99, features: ['white label', 'custom integrations', 'priority support'] }
      }
    },
    vibeGraph: {
      enabled: true,
      emotions: ['happy', 'sad', 'excited', 'calm', 'frustrated', 'satisfied'],
      sentimentThreshold: 0.7,
      voiceAnalysis: true,
      maxRecordingLength: 60 // seconds
    },
    qrCheckIn: {
      enabled: true,
      checkInRadius: 100, // meters
      rewardPoints: 10,
      locations: [
        { id: 'loc-1', name: 'Demo Center', lat: 37.7749, lng: -122.4194 },
        { id: 'loc-2', name: 'Innovation Lab', lat: 37.7751, lng: -122.4180 }
      ]
    },
    agentPromotion: {
      enabled: true,
      promotionThreshold: 4.5, // rating out of 5
      reviewsRequired: 3,
      categories: ['helpful', 'creative', 'efficient', 'friendly']
    }
  },

  // Vault configuration
  vault: {
    basePath: './vault',
    loggingEnabled: true,
    encryptionEnabled: false,
    backupInterval: 3600000 // 1 hour
  },

  // Integration settings
  integrations: {
    mirrorChain: {
      enabled: true,
      endpoint: 'http://localhost:8080/api/chain'
    },
    calRiven: {
      enabled: true,
      apiEndpoint: 'http://localhost:9000/api/cal'
    }
  }
};