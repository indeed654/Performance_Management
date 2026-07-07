const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/today', attendanceController.getTodayStatus);
router.get('/my', attendanceController.getMyAttendance);
router.get('/', authorize('admin', 'manager'), attendanceController.getAllAttendance);
router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);

module.exports = router;
