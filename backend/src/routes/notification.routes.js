const express = require('express');
const router = express.Router();
const notifController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', notifController.getNotifications);
router.put('/:id/read', notifController.markAsRead);
router.delete('/:id', notifController.deleteNotification);

module.exports = router;
