const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Performance = sequelize.define('Performance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  reviewType: {
    type: DataTypes.ENUM('quarterly', 'half_yearly', 'annual'),
    allowNull: false,
  },
  quarter: {
    type: DataTypes.ENUM('Q1', 'Q2', 'Q3', 'Q4'),
    allowNull: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  selfRating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    validate: { min: 0, max: 5 },
  },
  managerRating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    validate: { min: 0, max: 5 },
  },
  finalScore: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    validate: { min: 0, max: 5 },
  },
  selfAssessment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  managerFeedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  strengths: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  improvements: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'submitted', 'reviewed', 'completed'),
    defaultValue: 'draft',
  },
}, {
  tableName: 'performance_reviews',
  timestamps: true,
});

module.exports = Performance;
