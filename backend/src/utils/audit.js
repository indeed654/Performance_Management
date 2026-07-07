const { AuditLog } = require('../models');

// Simple helper to log actions without cluttering controllers
const logAction = async (userId, action, entity, entityId = null, details = null, ipAddress = null) => {
  try {
    await AuditLog.create({ userId, action, entity, entityId, details, ipAddress });
  } catch (err) {
    // Don't fail requests if audit logging errors
    console.error('Audit log error:', err.message);
  }
};

module.exports = { logAction };
