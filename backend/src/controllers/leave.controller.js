const { Op } = require('../config/memstore');
const { Leave, User, Notification } = require('../models');
const { success, error, paginate } = require('../utils/response');

// POST /api/leaves/apply
const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return error(res, 'End date must be after start date', 400);

    // Count business days (simple version - just date diff)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leave
    const overlap = await Leave.findOne({
      where: {
        userId: req.user.id,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } },
        ],
      },
    });
    if (overlap) return error(res, 'You already have a leave request for overlapping dates', 409);

    const leave = await Leave.create({
      userId: req.user.id,
      type,
      startDate,
      endDate,
      days,
      reason,
    });

    // Notify the manager
    if (req.user.managerId) {
      await Notification.create({
        userId: req.user.managerId,
        title: 'Leave Request',
        message: `${req.user.firstName} ${req.user.lastName} has applied for ${days} day(s) of ${type} leave.`,
        type: 'leave',
        link: '/leaves',
      });
    }

    return success(res, leave, 'Leave application submitted', 201);
  } catch (err) {
    console.error(err);
    return error(res, 'Failed to apply leave', 500);
  }
};

// GET /api/leaves/my
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    });
    return success(res, leaves);
  } catch (err) {
    return error(res, 'Failed to fetch leaves', 500);
  }
};

// GET /api/leaves  (admin/manager)
const getAllLeaves = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (userId) where.userId = userId;

    // Managers see only their team's leaves
    if (req.user.role === 'manager') {
      const teamIds = await User.findAll({
        where: { managerId: req.user.id },
        attributes: ['id'],
      });
      where.userId = { [Op.in]: teamIds.map(u => u.id) };
    }

    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'employeeId', 'avatar'] },
        { model: User, as: 'approver', attributes: ['id', 'firstName', 'lastName'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    return paginate(res, rows, count, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch leaves', 500);
  }
};

// PUT /api/leaves/:id/approve
const approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id, {
      include: [{ model: User, as: 'employee' }],
    });
    if (!leave) return error(res, 'Leave not found', 404);
    if (leave.status !== 'pending') return error(res, 'Leave is not pending', 400);

    const { action, comment } = req.body; // action: 'approve' | 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';

    await leave.update({
      status,
      approvedBy: req.user.id,
      approverComment: comment,
      approvedAt: new Date(),
    });

    // Notify the employee
    await Notification.create({
      userId: leave.userId,
      title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your ${leave.type} leave from ${leave.startDate} to ${leave.endDate} has been ${status}.`,
      type: 'leave',
      link: '/leaves',
    });

    return success(res, leave, `Leave ${status} successfully`);
  } catch (err) {
    return error(res, 'Failed to process leave', 500);
  }
};

// PUT /api/leaves/:id/cancel (employee cancels own pending leave)
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findByPk(req.params.id);
    if (!leave) return error(res, 'Leave not found', 404);
    if (leave.userId !== req.user.id) return error(res, 'Not your leave', 403);
    if (leave.status !== 'pending') return error(res, 'Only pending leaves can be cancelled', 400);

    await leave.update({ status: 'cancelled' });
    return success(res, leave, 'Leave cancelled');
  } catch (err) {
    return error(res, 'Failed to cancel leave', 500);
  }
};

module.exports = { applyLeave, getMyLeaves, getAllLeaves, approveLeave, cancelLeave };
