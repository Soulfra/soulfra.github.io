const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./user')(sequelize, DataTypes);
const Game = require('./game')(sequelize, DataTypes);
const Player = require('./player')(sequelize, DataTypes);
const Timeline = require('./timeline')(sequelize, DataTypes);
const Achievement = require('./achievement')(sequelize, DataTypes);
const Transaction = require('./transaction')(sequelize, DataTypes);
const Market = require('./market')(sequelize, DataTypes);
const Asset = require('./asset')(sequelize, DataTypes);
const EconomicEvent = require('./economicEvent')(sequelize, DataTypes);
const QuantumState = require('./quantumState')(sequelize, DataTypes);
const ConsciousnessEvent = require('./consciousnessEvent')(sequelize, DataTypes);
const AIAgent = require('./aiAgent')(sequelize, DataTypes);
const Evolution = require('./evolution')(sequelize, DataTypes);
const Learning = require('./learning')(sequelize, DataTypes);

// Define associations
User.hasMany(Game, { foreignKey: 'user_id' });
Game.belongsTo(User, { foreignKey: 'user_id' });

Game.belongsTo(Timeline, { foreignKey: 'timeline_id' });
Timeline.hasMany(Game, { foreignKey: 'timeline_id' });

Player.hasMany(Achievement, { foreignKey: 'player_id' });
Achievement.belongsTo(Player, { foreignKey: 'player_id' });

Player.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(Player, { foreignKey: 'user_id' });

Asset.belongsTo(Market, { foreignKey: 'market_id' });
Market.hasMany(Asset, { foreignKey: 'market_id' });

Transaction.belongsTo(Asset, { foreignKey: 'asset_id' });
Asset.hasMany(Transaction, { foreignKey: 'asset_id' });

// Export models
module.exports = {
  sequelize,
  User,
  Game,
  Player,
  Timeline,
  Achievement,
  Transaction,
  Market,
  Asset,
  EconomicEvent,
  QuantumState,
  ConsciousnessEvent,
  AIAgent,
  Evolution,
  Learning
};