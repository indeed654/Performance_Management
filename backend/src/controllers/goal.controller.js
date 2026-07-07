const { Goal, User } = require('../models');
const { success, error } = require('../utils/response');

const getGoals = async (req, res) => {
  try {
    const { userId, status, category } = req.query;
    const where = {};

    if (req.user.role === 'employee') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (category) where.category = category;

    const goals = await Goal.findAll({
      where,
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
      order: [['dueDate', 'ASC']],
    });
    return success(res, goals);
  } catch (err) {
    return error(res, 'Failed to fetch goals', 500);
  }
};

const createGoal = async (req, res) => {
  try {
    const { userId, title, description, category, priority, dueDate } = req.body;
    const targetUser = req.user.role === 'employee' ? req.user.id : userId;

    const goal = await Goal.create({
      userId: targetUser,
      title,
      description,
      category,
      priority,
      dueDate,
      assignedBy: req.user.id,
    });
    return success(res, goal, 'Goal created', 201);
  } catch (err) {
    return error(res, 'Failed to create goal', 500);
  }
};

const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);
    if (!goal) return error(res, 'Goal not found', 404);

    if (req.user.role === 'employee' && goal.userId !== req.user.id) {
      return error(res, 'Access denied', 403);
    }

    const { title, description, completionPercent, status, priority, dueDate } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (completionPercent !== undefined) {
      updates.completionPercent = completionPercent;
      updates.status = completionPercent === 100 ? 'completed' : completionPercent > 0 ? 'in_progress' : goal.status;
    }
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;

    await goal.update(updates);
    return success(res, goal, 'Goal updated');
  } catch (err) {
    return error(res, 'Failed to update goal', 500);
  }
};

const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findByPk(req.params.id);
    if (!goal) return error(res, 'Goal not found', 404);
    await goal.destroy();
    return success(res, null, 'Goal deleted');
  } catch (err) {
    return error(res, 'Failed to delete goal', 500);
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal };
