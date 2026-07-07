const express = require('express');
const router = express.Router();
const deptController = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', deptController.getDepartments);
router.get('/:id', deptController.getDepartmentById);
router.post('/', authorize('admin'), deptController.createDepartment);
router.put('/:id', authorize('admin'), deptController.updateDepartment);
router.delete('/:id', authorize('admin'), deptController.deleteDepartment);

module.exports = router;
