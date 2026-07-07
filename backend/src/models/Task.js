const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assignedBy: {
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
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  completionPercent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done', 'cancelled'),
    defaultValue: 'todo',
  },
}, {
  tableName: 'tasks',
  timestamps: true,
});

module.exports = Task;
