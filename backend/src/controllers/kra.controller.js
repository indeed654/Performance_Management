const { KRA, User } = require('../models');
const { success, error } = require('../utils/response');

const getKRAs = async (req, res) => {
  try {
    const { userId, quarter, year, status } = req.query;
    const where = {};

    if (req.user.role === 'employee') {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (quarter) where.quarter = quarter;
    if (year) where.year = year;
    if (status) where.status = status;

    const kras = await KRA.findAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'assignedByUser', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return success(res, kras);
  } catch (err) {
    return error(res, 'Failed to fetch KRAs', 500);
  }
};

const getKRAById = async (req, res) => {
  try {
    const kra = await KRA.findByPk(req.params.id, {
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName'] }],
    });
    if (!kra) return error(res, 'KRA not found', 404);
    return success(res, kra);
  } catch (err) {
    return error(res, 'Failed to fetch KRA', 500);
  }
};

const createKRA = async (req, res) => {
  try {
    const { userId, title, description, weightage, target, quarter, year } = req.body;

    // Validate total weightage for this user/quarter doesn't exceed 100
    const existing = await KRA.findAll({ where: { userId, quarter, year } });
    const totalWeight = existing.reduce((sum, k) => sum + k.weightage, 0);
    if (totalWeight + weightage > 100) {
      return error(res, `Total weightage exceeds 100%. Current: ${totalWeight}%`, 400);
    }

    const kra = await KRA.create({
      userId,
      title,
      description,
      weightage,
      target,
      quarter,
      year,
      assignedBy: req.user.id,
    });
    return success(res, kra, 'KRA created successfully', 201);
  } catch (err) {
    return error(res, 'Failed to create KRA', 500);
  }
};

const updateKRA = async (req, res) => {
  try {
    const kra = await KRA.findByPk(req.params.id);
    if (!kra) return error(res, 'KRA not found', 404);

    const allowed = ['title', 'description', 'target', 'achievement', 'completionPercent', 'status', 'remarks'];
    if (req.user.role !== 'employee') allowed.push('weightage', 'quarter', 'year');

    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Auto-set status based on completion
    if (updates.completionPercent === 100) updates.status = 'completed';
    else if (updates.completionPercent > 0) updates.status = 'in_progress';

    await kra.update(updates);
    return success(res, kra, 'KRA updated');
  } catch (err) {
    return error(res, 'Failed to update KRA', 500);
  }
};

const deleteKRA = async (req, res) => {
  try {
    const kra = await KRA.findByPk(req.params.id);
    if (!kra) return error(res, 'KRA not found', 404);
    await kra.destroy();
    return success(res, null, 'KRA deleted');
  } catch (err) {
    return error(res, 'Failed to delete KRA', 500);
  }
};

module.exports = { getKRAs, getKRAById, createKRA, updateKRA, deleteKRA };
