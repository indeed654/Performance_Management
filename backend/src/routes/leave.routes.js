const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/my', leaveController.getMyLeaves);
router.get('/', authorize('admin', 'manager'), leaveController.getAllLeaves);
router.post('/apply', leaveController.applyLeave);
router.put('/:id/approve', authorize('admin', 'manager'), leaveController.approveLeave);
router.put('/:id/cancel', leaveController.cancelLeave);

module.exports = router;
