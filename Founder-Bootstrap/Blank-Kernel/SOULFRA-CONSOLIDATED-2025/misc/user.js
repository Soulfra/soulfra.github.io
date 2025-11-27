module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stripe_customer_id: {
      type: DataTypes.STRING,
      unique: true
    },
    phone_number: {
      type: DataTypes.STRING,
      unique: true
    },
    voice_signature: {
      type: DataTypes.TEXT
    },
    consciousness_signature: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_transcended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    total_spent: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    total_earned: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    highest_balance: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0
    },
    games_played: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    billion_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    last_login: {
      type: DataTypes.DATE
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
    tableName: 'users',
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['username']
      },
      {
        fields: ['stripe_customer_id']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  return User;
};