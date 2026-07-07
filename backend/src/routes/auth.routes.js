const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
    validate,
  ],
  authController.login
);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authenticate, authController.logout);

router.post('/forgot-password',
  [body('email').isEmail(), validate],
  authController.forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
  ],
  authController.resetPassword
);

router.get('/me', authenticate, authController.getMe);

router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
    validate,
  ],
  authController.changePassword
);

module.exports = router;
