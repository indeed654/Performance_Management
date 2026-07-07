const bcrypt = require('bcryptjs');
const { Op } = require('../config/memstore');
const { User, Department } = require('../models');
const { success, error, paginate } = require('../utils/response');
const { logAction } = require('../utils/audit');

// GET /api/users  (admin/manager)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, departmentId, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // Managers can only see their own team
    if (req.user.role === 'manager') {
      where.managerId = req.user.id;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    return paginate(res, rows, count, page, limit);
  } catch (err) {
    console.error('Get users error:', err);
    return error(res, 'Failed to fetch users', 500);
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name'] },
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
      ],
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (err) {
    return error(res, 'Failed to fetch user', 500);
  }
};

// POST /api/users  (admin only)
const createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, departmentId, managerId, designation, joiningDate, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return error(res, 'Email already registered', 409);

    // Generate employee ID like EMP001
    const count = await User.count();
    const employeeId = `EMP${String(count + 1).padStart(3, '0')}`;

    const hashedPassword = await bcrypt.hash(password || 'password123', 12);

    const user = await User.create({
      employeeId,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'employee',
      departmentId,
      managerId,
      designation,
      joiningDate,
      phone,
    });

    await logAction(req.user.id, 'CREATE_USER', 'User', user.id, { email }, req.ip);
    return success(res, user, 'Employee created successfully', 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error(res, 'Failed to create user', 500);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404);

    // Employees can only update their own profile
    if (req.user.role === 'employee' && req.user.id !== user.id) {
      return error(res, 'Access denied', 403);
    }

    const allowed = ['firstName', 'lastName', 'phone', 'address', 'skills', 'education', 'emergencyContact', 'designation', 'departmentId', 'managerId', 'dateOfBirth'];
    if (req.user.role === 'admin') allowed.push('role', 'isActive', 'joiningDate');

    const updates = {};
    allowed.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) updates.avatar = req.file.path.replace(/\\/g, '/');

    await user.update(updates);
    await logAction(req.user.id, 'UPDATE_USER', 'User', user.id, updates, req.ip);

    const updated = await User.findByPk(user.id, {
      include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
    });
    return success(res, updated, 'User updated successfully');
  } catch (err) {
    return error(res, 'Failed to update user', 500);
  }
};

// DELETE /api/users/:id  (admin only - soft delete by deactivating)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    if (user.id === req.user.id) return error(res, 'Cannot delete yourself', 400);

    await user.update({ isActive: false });
    await logAction(req.user.id, 'DELETE_USER', 'User', user.id, null, req.ip);
    return success(res, null, 'Employee deactivated successfully');
  } catch (err) {
    return error(res, 'Failed to delete user', 500);
  }
};

// GET /api/users/stats  (admin dashboard)
const getUserStats = async (req, res) => {
  try {
    const total = await User.count({ where: { isActive: true } });
    const byRole = await User.count({ where: { role: 'employee', isActive: true } });
    const managers = await User.count({ where: { role: 'manager', isActive: true } });
    const newThisMonth = await User.count({
      where: {
        createdAt: { [Op.gte]: new Date(new Date().setDate(1)) },
        isActive: true,
      },
    });

    return success(res, { total, employees: byRole, managers, newThisMonth });
  } catch (err) {
    return error(res, 'Failed to fetch stats', 500);
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getUserStats };
