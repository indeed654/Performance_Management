const express = require('express');
const router = express.Router();
const kraController = require('../controllers/kra.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', kraController.getKRAs);
router.get('/:id', kraController.getKRAById);
router.post('/', authorize('admin', 'manager'), kraController.createKRA);
router.put('/:id', kraController.updateKRA);
router.delete('/:id', authorize('admin', 'manager'), kraController.deleteKRA);

module.exports = router;
