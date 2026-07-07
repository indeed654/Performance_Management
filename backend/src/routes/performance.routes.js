const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performance.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', performanceController.getReviews);
router.get('/:id', performanceController.getReviewById);
router.post('/', authorize('admin', 'manager'), performanceController.createReview);
router.put('/:id/self-assessment', performanceController.submitSelfAssessment);
router.put('/:id/complete', authorize('admin', 'manager'), performanceController.completeReview);

module.exports = router;
