const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  checkIn: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  checkOut: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  workingHours: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'half_day', 'holiday', 'weekend'),
    defaultValue: 'present',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'attendance',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'date'], unique: true },
  ],
});

module.exports = Attendance;
