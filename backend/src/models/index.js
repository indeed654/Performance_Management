/**
 * Re-exports all models from the in-memory store.
 * Drops the Sequelize DB dependency entirely.
 */
const sequelize = require('../config/database');
const {
  User, Department, Attendance, Leave, KRA, Goal,
  Performance, Project, Task, Notification, AuditLog,
} = require('../config/memstore');

module.exports = {
  sequelize,
  User, Department, Attendance, Leave, KRA, Goal,
  Performance, Project, Task, Notification, AuditLog,
};
