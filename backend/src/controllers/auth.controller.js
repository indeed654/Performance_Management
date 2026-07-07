const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { logAction } = require('../utils/audit');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Need password field that's excluded by default scope
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return error(res, 'Your account has been deactivated. Contact admin.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    await user.update({
      refreshToken,
      lastLogin: new Date(),
    });

    await logAction(user.id, 'LOGIN', 'User', user.id, null, req.ip);

    // Remove sensitive fields before sending
    const userData = user.toJSON();
    delete userData.password;
    delete userData.refreshToken;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;

    return success(res, { user: userData, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Login failed', 500);
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return error(res, 'Refresh token required', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== token) {
      return error(res, 'Invalid refresh token', 401);
    }

    const newAccessToken = generateAccessToken(user);
    return success(res, { accessToken: newAccessToken }, 'Token refreshed');
  } catch (err) {
    return error(res, 'Invalid or expired refresh token', 401);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await req.user.update({ refreshToken: null });
    await logAction(req.user.id, 'LOGOUT', 'User', req.user.id, null, req.ip);
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    return error(res, 'Logout failed', 500);
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return success(res, null, 'If an account exists, a reset email has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await user.update({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    });

    // In production, send email here via nodemailer
    // For now, return token in response (dev only)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return success(res, null, 'Password reset email sent');
  } catch (err) {
    return error(res, 'Failed to process request', 500);
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.scope('withPassword').findOne({
      where: {
        resetPasswordToken: hashedToken,
      },
    });

    if (!user || new Date() > user.resetPasswordExpires) {
      return error(res, 'Invalid or expired reset token', 400);
    }

    const hashed = await bcrypt.hash(password, 12);
    await user.update({
      password: hashed,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    return success(res, null, 'Password reset successful');
  } catch (err) {
    return error(res, 'Password reset failed', 500);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return success(res, req.user, 'User fetched');
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.scope('withPassword').findByPk(req.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return error(res, 'Current password is incorrect', 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashed });

    await logAction(req.user.id, 'CHANGE_PASSWORD', 'User', req.user.id, null, req.ip);
    return success(res, null, 'Password changed successfully');
  } catch (err) {
    return error(res, 'Failed to change password', 500);
  }
};

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, getMe, changePassword };
