require('dotenv').config();
const { Sequelize, DataTypes, Model } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_URL,
  {
    dialect: 'postgres',
    logging: false
  }
);

// User model
class User extends Model {}
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false
  }
);

// Assistance model
class Assistance extends Model {}
Assistance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Assistance',
    tableName: 'assistances',
    timestamps: false
  }
);

// Thread model
class Thread extends Model {}
Thread.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    }
  },
  {
    sequelize,
    modelName: 'Thread',
    tableName: 'threads',
    timestamps: false
  }
);

// Message model
class Message extends Model {}
Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  }
);

// Associations
Assistance.hasMany(Thread, { foreignKey: 'assistance_id', onDelete: 'CASCADE' });
Thread.belongsTo(Assistance, { foreignKey: 'assistance_id' });

Thread.hasMany(Message, { foreignKey: 'thread_id', onDelete: 'CASCADE' });
Message.belongsTo(Thread, { foreignKey: 'thread_id' });

// Sync all models
sequelize.sync();

module.exports = {
  sequelize,
  User,
  Assistance,
  Thread,
  Message
};
