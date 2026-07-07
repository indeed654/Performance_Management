const { Department, User } = require('../models');
const { success, error } = require('../utils/response');
const { logAction } = require('../utils/audit');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation'], where: { isActive: true }, required: false },
      ],
      order: [['name', 'ASC']],
    });
    return success(res, departments);
  } catch (err) {
    return error(res, 'Failed to fetch departments', 500);
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id, {
      include: [
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar', 'designation', 'email'], where: { isActive: true }, required: false },
      ],
    });
    if (!dept) return error(res, 'Department not found', 404);
    return success(res, dept);
  } catch (err) {
    return error(res, 'Failed to fetch department', 500);
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, description, managerId } = req.body;

    const existing = await Department.findOne({ where: { name } });
    if (existing) return error(res, 'Department name already exists', 409);

    const dept = await Department.create({ name, description, managerId });
    await logAction(req.user.id, 'CREATE_DEPARTMENT', 'Department', dept.id, { name }, req.ip);
    return success(res, dept, 'Department created', 201);
  } catch (err) {
    return error(res, 'Failed to create department', 500);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return error(res, 'Department not found', 404);

    const { name, description, managerId, isActive } = req.body;
    await dept.update({ name, description, managerId, isActive });
    await logAction(req.user.id, 'UPDATE_DEPARTMENT', 'Department', dept.id, req.body, req.ip);
    return success(res, dept, 'Department updated');
  } catch (err) {
    return error(res, 'Failed to update department', 500);
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return error(res, 'Department not found', 404);

    const memberCount = await User.count({ where: { departmentId: dept.id, isActive: true } });
    if (memberCount > 0) {
      return error(res, 'Cannot delete department with active members', 400);
    }

    await dept.destroy();
    await logAction(req.user.id, 'DELETE_DEPARTMENT', 'Department', dept.id, null, req.ip);
    return success(res, null, 'Department deleted');
  } catch (err) {
    return error(res, 'Failed to delete department', 500);
  }
};

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
