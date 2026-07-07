const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    // used for icons/colors on the frontend
    type: DataTypes.ENUM('info', 'success', 'warning', 'leave', 'review', 'task', 'birthday'),
    defaultValue: 'info',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  link: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;
