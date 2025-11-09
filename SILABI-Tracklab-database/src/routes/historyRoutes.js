const express = require('express');
const ctrl = require('../controllers/historyController');
const { authenticate } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all history (with optional filters: asset_id, days, event_type, limit)
router.get('/', ctrl.getAllHistory);

// Get history by ID
router.get('/:id', ctrl.getHistoryById);

// Get history for specific asset
router.get('/asset/:assetId', ctrl.getAssetHistory);

// Create history record
router.post('/', ctrl.createHistory);

module.exports = router;