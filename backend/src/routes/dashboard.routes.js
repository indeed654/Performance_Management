const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/admin', authorize('admin'), dashboardController.getAdminDashboard);
router.get('/manager', authorize('admin', 'manager'), dashboardController.getManagerDashboard);
router.get('/employee', dashboardController.getEmployeeDashboard);

module.exports = router;
