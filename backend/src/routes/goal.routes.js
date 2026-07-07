const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goal.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.put('/:id', goalController.updateGoal);
router.delete('/:id', authorize('admin', 'manager'), goalController.deleteGoal);

module.exports = router;
