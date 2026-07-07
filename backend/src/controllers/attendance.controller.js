const { Op } = require('../config/memstore');
const { Attendance, User } = require('../models');
const { success, error, paginate } = require('../utils/response');

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await Attendance.findOne({ where: { userId: req.user.id, date: today } });

    if (existing && existing.checkIn) {
      return error(res, 'Already checked in today', 400);
    }

    const now = new Date().toTimeString().split(' ')[0];
    // Late if after 9:30 AM
    const isLate = new Date().getHours() > 9 || (new Date().getHours() === 9 && new Date().getMinutes() > 30);

    const record = existing
      ? await existing.update({ checkIn: now, status: isLate ? 'late' : 'present' })
      : await Attendance.create({ userId: req.user.id, date: today, checkIn: now, status: isLate ? 'late' : 'present' });

    return success(res, record, 'Checked in successfully');
  } catch (err) {
    return error(res, 'Check-in failed', 500);
  }
};

// POST /api/attendance/checkout
const checkOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId: req.user.id, date: today } });

    if (!record || !record.checkIn) return error(res, 'No check-in found for today', 400);
    if (record.checkOut) return error(res, 'Already checked out', 400);

    const now = new Date().toTimeString().split(' ')[0];

    // Calculate working hours
    const [inH, inM] = record.checkIn.split(':').map(Number);
    const [outH, outM] = now.split(':').map(Number);
    const workingHours = ((outH * 60 + outM) - (inH * 60 + inM)) / 60;

    // Half day if less than 4 hours
    const status = workingHours < 4 ? 'half_day' : record.status;

    await record.update({ checkOut: now, workingHours: Math.max(0, workingHours.toFixed(2)), status });
    return success(res, record, 'Checked out successfully');
  } catch (err) {
    return error(res, 'Check-out failed', 500);
  }
};

// GET /api/attendance/my  — current user's attendance
const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();

    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = new Date(y, m, 0).toISOString().split('T')[0];

    const records = await Attendance.findAll({
      where: { userId: req.user.id, date: { [Op.between]: [startDate, endDate] } },
      order: [['date', 'DESC']],
    });

    // Monthly summary
    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      totalWorkingHours: records.reduce((acc, r) => acc + parseFloat(r.workingHours || 0), 0).toFixed(2),
    };

    return success(res, { records, summary });
  } catch (err) {
    return error(res, 'Failed to fetch attendance', 500);
  }
};

// GET /api/attendance  — admin/manager view
const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 20, date, userId, month, year } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (date) where.date = date;
    if (userId) where.userId = userId;
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'employeeId', 'avatar'] }],
      limit: parseInt(limit),
      offset,
      order: [['date', 'DESC']],
    });

    return paginate(res, rows, count, page, limit);
  } catch (err) {
    return error(res, 'Failed to fetch attendance', 500);
  }
};

// GET /api/attendance/today  — today's status for current user
const getTodayStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ where: { userId: req.user.id, date: today } });
    return success(res, record || null, 'Today status fetched');
  } catch (err) {
    return error(res, 'Failed to fetch today status', 500);
  }
};

module.exports = { checkIn, checkOut, getMyAttendance, getAllAttendance, getTodayStatus };
