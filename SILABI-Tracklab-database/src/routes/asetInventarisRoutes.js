const express = require('express');
const ctrl = require('../controllers/asetInventarisController');
const router = express.Router();

router.get('/', ctrl.getAllAssets);
router.get('/:id', ctrl.getAssetById);
router.post('/', ctrl.createAsset);
router.put('/:id', ctrl.updateAsset);
router.delete('/:id', ctrl.deleteAsset);

module.exports = router;