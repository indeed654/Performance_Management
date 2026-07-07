const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// KRA = Key Result Area
const KRA = sequelize.define('KRA', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  weightage: {
    // percentage weight for this KRA (e.g., 30 means 30%)
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 100 },
  },
  target: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  achievement: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  completionPercent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  status: {
    type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'on_hold'),
    defaultValue: 'not_started',
  },
  quarter: {
    type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'kras',
  timestamps: true,
});

module.exports = KRA;
