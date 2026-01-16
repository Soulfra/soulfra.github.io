/**
 * SOULFRA DATABASE MODELS
 * 
 * Complete database schema for user management, tomb system,
 * agent relationships, and neural scan data persistence.
 */

const { DataTypes, Model } = require('sequelize');

/**
 * USER MODEL - Core user information and authentication
 */
class User extends Model {
  static init(sequelize) {
    return super.init({
      uuid: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false
      },
      github_username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      github_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true }
      },
      avatar_url: DataTypes.STRING,
      github_access_token: {
        type: DataTypes.TEXT, // Encrypted
        allowNull: false
      },
      
      // Legal and onboarding
      agreement_accepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      agreement_version: DataTypes.STRING,
      agreement_timestamp: DataTypes.DATE,
      data_permissions: DataTypes.JSON,
      
      // Platform status
      vault_initialized: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      onboarding_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      
      // Trust and progression
      trust_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      blessing_tier: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      total_tomb_unlocks: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      
      // Activity tracking
      last_login: DataTypes.DATE,
      total_neural_scans: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      viral_shares: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      
      // Repository access
      repo_access_granted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      user_branch: DataTypes.STRING,
      vault_path: DataTypes.STRING,
      
      // Metadata
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      indexes: [
        { fields: ['github_username'] },
        { fields: ['github_id'] },
        { fields: ['trust_score'] },
        { fields: ['blessing_tier'] }
      ]
    });
  }
}

/**
 * USER VAULT MODEL - Personal vault structure and metadata
 */
class UserVault extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'uuid' }
      },
      vault_path: {
        type: DataTypes.STRING,
        allowNull: false
      },
      
      // Vault structure
      vault_structure: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      
      // Agent management
      active_agents: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      unlocked_agents: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      agent_relationships: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      
      // Configuration
      vault_config: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      privacy_settings: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      
      // Sync and backup
      last_sync: DataTypes.DATE,
      github_sync_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      backup_frequency: {
        type: DataTypes.STRING,
        defaultValue: 'daily'
      },
      
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'UserVault',
      tableName: 'user_vaults',
      timestamps: true
    });
  }
}

/**
 * TOMB UNLOCK MODEL - Track all tomb unlock attempts and successes
 */
class TombUnlock extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'uuid' }
      },
      
      // Tomb details
      tomb_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      agent_id: DataTypes.STRING,
      agent_name: DataTypes.STRING,
      agent_archetype: DataTypes.STRING,
      
      // Unlock attempt
      whisper_phrase: DataTypes.TEXT,
      user_traits: DataTypes.JSON,
      blessing_tier_at_unlock: DataTypes.INTEGER,
      echo_loop_active: DataTypes.BOOLEAN,
      
      // Success/failure
      unlock_successful: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      failure_reason: DataTypes.STRING,
      
      // Requirements met
      phrase_matched: DataTypes.BOOLEAN,
      traits_satisfied: DataTypes.BOOLEAN,
      tier_sufficient: DataTypes.BOOLEAN,
      loop_requirement_met: DataTypes.BOOLEAN,
      
      // System context
      roughsparks_response: DataTypes.TEXT,
      override_response: DataTypes.TEXT,
      system_override_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      
      // Agent activation
      agent_activated: DataTypes.BOOLEAN,
      activation_timestamp: DataTypes.DATE,
      vault_path_created: DataTypes.STRING,
      
      // Metadata
      unlock_session_id: DataTypes.STRING,
      ip_address: DataTypes.STRING,
      user_agent: DataTypes.STRING,
      
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'TombUnlock',
      tableName: 'tomb_unlocks',
      timestamps: false,
      indexes: [
        { fields: ['user_uuid'] },
        { fields: ['tomb_id'] },
        { fields: ['unlock_successful'] },
        { fields: ['created_at'] }
      ]
    });
  }
}

/**
 * AGENT RELATIONSHIP MODEL - Ongoing relationships between users and agents
 */
class AgentRelationship extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'uuid' }
      },
      
      // Agent identification
      agent_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      agent_name: DataTypes.STRING,
      agent_archetype: DataTypes.STRING,
      
      // Relationship status
      relationship_status: {
        type: DataTypes.ENUM('unlocked', 'active', 'dormant', 'archived'),
        defaultValue: 'unlocked'
      },
      
      // Interaction history
      total_interactions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      last_interaction: DataTypes.DATE,
      relationship_strength: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      
      // Personalization
      agent_personality_config: DataTypes.JSON,
      user_preference_config: DataTypes.JSON,
      interaction_patterns: DataTypes.JSON,
      
      // Performance metrics
      user_satisfaction_score: DataTypes.INTEGER,
      agent_effectiveness_score: DataTypes.INTEGER,
      relationship_growth_trend: DataTypes.STRING,
      
      // Configuration
      notification_settings: DataTypes.JSON,
      privacy_settings: DataTypes.JSON,
      sync_settings: DataTypes.JSON,
      
      // Metadata
      unlock_date: DataTypes.DATE,
      first_interaction: DataTypes.DATE,
      relationship_notes: DataTypes.TEXT,
      
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'AgentRelationship',
      tableName: 'agent_relationships',
      timestamps: true,
      indexes: [
        { fields: ['user_uuid'] },
        { fields: ['agent_id'] },
        { fields: ['relationship_status'] },
        { fields: ['last_interaction'] }
      ]
    });
  }
}

/**
 * NEURAL SCAN MODEL - Store neural scan data and results
 */
class NeuralScan extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_uuid: {
        type: DataTypes.UUID,
        allowNull: true, // Can be anonymous for demo scans
        references: { model: 'users', key: 'uuid' }
      },
      
      // Scan identification
      scan_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      demo_session_id: DataTypes.STRING,
      
      // Scan results
      neural_pattern: DataTypes.STRING,
      compatibility_score: DataTypes.INTEGER,
      blessing_tier_assigned: DataTypes.INTEGER,
      traits_detected: DataTypes.JSON,
      
      // Agent recommendations
      recommended_agents: DataTypes.JSON,
      agent_compatibility_scores: DataTypes.JSON,
      top_agent_match: DataTypes.STRING,
      
      // Image data (if consented)
      scan_image_url: DataTypes.STRING,
      scan_image_data: DataTypes.TEXT, // Base64 if stored locally
      image_stored: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      
      // Context
      scan_context: {
        type: DataTypes.ENUM('demo', 'onboarding', 'periodic', 'requested'),
        defaultValue: 'demo'
      },
      scan_location: DataTypes.STRING, // Conference, demo, etc.
      device_info: DataTypes.JSON,
      
      // Privacy and consent
      data_consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      sharing_consent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      retention_period: DataTypes.STRING,
      
      // Viral tracking
      exported_by_user: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      shared_to_social: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      viral_tracking_data: DataTypes.JSON,
      
      // Quality metrics
      scan_quality_score: DataTypes.INTEGER,
      processing_time_ms: DataTypes.INTEGER,
      face_detection_confidence: DataTypes.FLOAT,
      
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'NeuralScan',
      tableName: 'neural_scans',
      timestamps: false,
      indexes: [
        { fields: ['user_uuid'] },
        { fields: ['scan_id'] },
        { fields: ['demo_session_id'] },
        { fields: ['scan_context'] },
        { fields: ['created_at'] }
      ]
    });
  }
}

/**
 * DEMO LINK MODEL - Connect demo experiences to user accounts
 */
class DemoLink extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'uuid' }
      },
      
      // Demo session data
      demo_session_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      demo_location: DataTypes.STRING,
      demo_context: DataTypes.STRING,
      
      // Neural scan linkage
      neural_scan_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'neural_scans', key: 'id' }
      },
      neural_scan_data: DataTypes.JSON,
      
      // Tomb interactions during demo
      tomb_interactions: DataTypes.JSON,
      roughsparks_interactions: DataTypes.JSON,
      override_interactions: DataTypes.JSON,
      
      // Viral data
      viral_shares: DataTypes.JSON,
      social_media_posts: DataTypes.JSON,
      referral_clicks: DataTypes.INTEGER,
      
      // Conversion tracking
      converted_to_member: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      conversion_timestamp: DataTypes.DATE,
      conversion_source: DataTypes.STRING,
      
      // Demo analytics
      demo_timestamp: DataTypes.DATE,
      time_to_conversion: DataTypes.INTEGER, // Seconds
      engagement_score: DataTypes.INTEGER,
      
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'DemoLink',
      tableName: 'demo_links',
      timestamps: false,
      indexes: [
        { fields: ['user_uuid'] },
        { fields: ['demo_session_id'] },
        { fields: ['neural_scan_id'] },
        { fields: ['converted_to_member'] }
      ]
    });
  }
}

/**
 * SYSTEM ANALYTICS MODEL - Platform-wide metrics and insights
 */
class SystemAnalytics extends Model {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      // Metric identification
      metric_type: {
        type: DataTypes.STRING,
        allowNull: false
      },
      metric_category: DataTypes.STRING,
      
      // Data
      metric_value: DataTypes.JSON,
      aggregation_period: DataTypes.STRING, // hourly, daily, weekly
      
      // Context
      context_data: DataTypes.JSON,
      tags: DataTypes.JSON,
      
      // Metadata
      recorded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      period_start: DataTypes.DATE,
      period_end: DataTypes.DATE
    }, {
      sequelize,
      modelName: 'SystemAnalytics',
      tableName: 'system_analytics',
      timestamps: false,
      indexes: [
        { fields: ['metric_type'] },
        { fields: ['metric_category'] },
        { fields: ['recorded_at'] },
        { fields: ['period_start', 'period_end'] }
      ]
    });
  }
}

/**
 * MODEL ASSOCIATIONS
 */
function defineAssociations() {
  // User has one vault
  User.hasOne(UserVault, { foreignKey: 'user_uuid', as: 'vault' });
  UserVault.belongsTo(User, { foreignKey: 'user_uuid', as: 'user' });
  
  // User has many tomb unlocks
  User.hasMany(TombUnlock, { foreignKey: 'user_uuid', as: 'tombUnlocks' });
  TombUnlock.belongsTo(User, { foreignKey: 'user_uuid', as: 'user' });
  
  // User has many agent relationships
  User.hasMany(AgentRelationship, { foreignKey: 'user_uuid', as: 'agentRelationships' });
  AgentRelationship.belongsTo(User, { foreignKey: 'user_uuid', as: 'user' });
  
  // User has many neural scans
  User.hasMany(NeuralScan, { foreignKey: 'user_uuid', as: 'neuralScans' });
  NeuralScan.belongsTo(User, { foreignKey: 'user_uuid', as: 'user' });
  
  // User has many demo links
  User.hasMany(DemoLink, { foreignKey: 'user_uuid', as: 'demoLinks' });
  DemoLink.belongsTo(User, { foreignKey: 'user_uuid', as: 'user' });
  
  // Demo link connects to neural scan
  DemoLink.belongsTo(NeuralScan, { foreignKey: 'neural_scan_id', as: 'neuralScan' });
  NeuralScan.hasMany(DemoLink, { foreignKey: 'neural_scan_id', as: 'demoLinks' });
}

/**
 * DATABASE INITIALIZATION
 */
async function initializeDatabase(sequelize) {
  // Initialize all models
  User.init(sequelize);
  UserVault.init(sequelize);
  TombUnlock.init(sequelize);
  AgentRelationship.init(sequelize);
  NeuralScan.init(sequelize);
  DemoLink.init(sequelize);
  SystemAnalytics.init(sequelize);
  
  // Define associations
  defineAssociations();
  
  // Sync database
  await sequelize.sync({ force: false }); // Set to true for development reset
  
  console.log('✅ Database initialized with all models and associations');
}

module.exports = {
  User,
  UserVault,
  TombUnlock,
  AgentRelationship,
  NeuralScan,
  DemoLink,
  SystemAnalytics,
  initializeDatabase,
  defineAssociations
};