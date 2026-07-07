const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  employeeId: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'employee'),
    defaultValue: 'employee',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  managerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  skills: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  education: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  emergencyContact: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['password', 'refreshToken', 'resetPasswordToken', 'resetPasswordExpires'] },
  },
  scopes: {
    withPassword: {
      attributes: { include: ['password'] },
    },
  },
});

module.exports = User;
