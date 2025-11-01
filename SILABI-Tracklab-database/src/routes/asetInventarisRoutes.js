const express = require('express');
const ctrl = require('../controllers/asetInventarisController');
const { validateAsset } = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', ctrl.getAllAssets);
router.get('/:id', ctrl.getAssetById);
router.post('/', authorize('admin', 'technician'), validateAsset, ctrl.createAsset);
router.put('/:id', authorize('admin', 'technician'), ctrl.updateAsset);
router.delete('/:id', authorize('admin'), ctrl.deleteAsset);

module.exports = router;