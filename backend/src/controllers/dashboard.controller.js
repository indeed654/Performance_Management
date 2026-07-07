const { Op } = require('../config/memstore');
const { User, Department, Attendance, Leave, KRA, Goal, Performance, Task, Notification } = require('../models');
const { success, error } = require('../utils/response');

// GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().setDate(1)).toISOString().split('T')[0];

    const [
      totalEmployees,
      totalManagers,
      totalDepartments,
      presentToday,
      pendingLeaves,
      completedReviews,
    ] = await Promise.all([
      User.count({ where: { role: 'employee', isActive: true } }),
      User.count({ where: { role: 'manager', isActive: true } }),
      Department.count({ where: { isActive: true } }),
      Attendance.count({ where: { date: today, status: { [Op.in]: ['present', 'late'] } } }),
      Leave.count({ where: { status: 'pending' } }),
      Performance.count({ where: { status: 'completed' } }),
    ]);

    // Department headcount
    const deptStats = await Department.findAll({
      attributes: ['id', 'name'],
      include: [{
        model: User,
        as: 'members',
        attributes: [],
        where: { isActive: true },
        required: false,
      }],
    });

    // Recent joins this month
    const recentJoins = await User.findAll({
      where: { createdAt: { [Op.gte]: monthStart }, isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation', 'createdAt'],
      include: [{ model: Department, as: 'department', attributes: ['name'] }],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    // Top performers (highest final score)
    const topPerformers = await Performance.findAll({
      where: { status: 'completed', finalScore: { [Op.not]: null } },
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation'] }],
      order: [['finalScore', 'DESC']],
      limit: 5,
    });

    return success(res, {
      stats: { totalEmployees, totalManagers, totalDepartments, presentToday, pendingLeaves, completedReviews },
      recentJoins,
      topPerformers,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return error(res, 'Failed to load dashboard', 500);
  }
};

// GET /api/dashboard/manager
const getManagerDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const teamMembers = await User.findAll({
      where: { managerId: req.user.id, isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation'],
    });

    const teamIds = teamMembers.map(u => u.id);

    const [presentCount, pendingLeaves, pendingTasks, pendingReviews] = await Promise.all([
      Attendance.count({ where: { userId: { [Op.in]: teamIds }, date: today, status: { [Op.in]: ['present', 'late'] } } }),
      Leave.count({ where: { userId: { [Op.in]: teamIds }, status: 'pending' } }),
      Task.count({ where: { assignedTo: { [Op.in]: teamIds }, status: { [Op.in]: ['todo', 'in_progress'] } } }),
      Performance.count({ where: { userId: { [Op.in]: teamIds }, status: 'submitted' } }),
    ]);

    const recentLeaves = await Leave.findAll({
      where: { userId: { [Op.in]: teamIds }, status: 'pending' },
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });

    return success(res, {
      teamCount: teamMembers.length,
      presentCount,
      pendingLeaves,
      pendingTasks,
      pendingReviews,
      teamMembers,
      recentLeaves,
    });
  } catch (err) {
    return error(res, 'Failed to load dashboard', 500);
  }
};

// GET /api/dashboard/employee
const getEmployeeDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const [
      todayAttendance,
      myKRAs,
      myGoals,
      myTasks,
      unreadNotifications,
    ] = await Promise.all([
      Attendance.findOne({ where: { userId: req.user.id, date: today } }),
      KRA.count({ where: { userId: req.user.id, status: { [Op.ne]: 'completed' } } }),
      Goal.count({ where: { userId: req.user.id, status: { [Op.ne]: 'completed' } } }),
      Task.count({ where: { assignedTo: req.user.id, status: { [Op.in]: ['todo', 'in_progress'] } } }),
      Notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);

    const recentPerformance = await Performance.findAll({
      where: { userId: req.user.id },
      order: [['year', 'DESC'], ['createdAt', 'DESC']],
      limit: 3,
    });

    const upcomingGoals = await Goal.findAll({
      where: {
        userId: req.user.id,
        status: { [Op.ne]: 'completed' },
        dueDate: { [Op.gte]: today },
      },
      order: [['dueDate', 'ASC']],
      limit: 5,
    });

    return success(res, {
      todayAttendance,
      stats: { pendingKRAs: myKRAs, pendingGoals: myGoals, pendingTasks: myTasks, unreadNotifications },
      recentPerformance,
      upcomingGoals,
    });
  } catch (err) {
    return error(res, 'Failed to load dashboard', 500);
  }
};

module.exports = { getAdminDashboard, getManagerDashboard, getEmployeeDashboard };
