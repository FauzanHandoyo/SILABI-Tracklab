const express = require('express');
const ctrl = require('../controllers/asetInventarisController');
const { validateAsset } = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get statistics
router.get('/stats', ctrl.getStats);

// Get all assets (with optional filters: status, category, location)
router.get('/', ctrl.getAllAset);

// Get asset by ID
router.get('/:id', ctrl.getAsetById);

// Create new asset (admin or technician only)
router.post('/', authorize('admin', 'technician'), validateAsset, ctrl.createAset);

// Update asset (admin or technician only)
router.put('/:id', authorize('admin', 'technician'), ctrl.updateAset);

// Delete asset (admin only)
router.delete('/:id', authorize('admin'), ctrl.deleteAset);

module.exports = router;