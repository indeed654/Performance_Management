const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(authenticate);

router.get('/stats', authorize('admin'), userController.getUserStats);
router.get('/', authorize('admin', 'manager'), userController.getUsers);
router.get('/:id', userController.getUserById);

router.post('/',
  authorize('admin'),
  [
    body('firstName').notEmpty().withMessage('First name required'),
    body('lastName').notEmpty().withMessage('Last name required'),
    body('email').isEmail().withMessage('Valid email required'),
    validate,
  ],
  userController.createUser
);

router.put('/:id', upload.single('avatar'), userController.updateUser);
router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
