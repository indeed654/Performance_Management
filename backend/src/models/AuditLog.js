const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null if action by system
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  entity: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // audit logs are never updated
});

module.exports = AuditLog;
