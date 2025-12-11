const express = require('express');
const ctrl = require('../controllers/asetRequestController');
const { validateRequest } = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all asset requests (with optional filters: status, asset_id, user_id)
router.get('/', ctrl.getAllRequests);

// Get asset request by ID
router.get('/:id', ctrl.getRequestById);

// Create new asset request
router.post('/', validateRequest, ctrl.createRequest);

// Update asset request
router.put('/:id', authorize('admin', 'technician'), ctrl.updateRequest);

// Delete asset request
router.delete('/:id', authorize('admin', 'technician'), ctrl.deleteRequest);

// Approve asset request
router.put('/:id/approve', authorize('admin', 'technician'), ctrl.approveRequest);

// Deny asset request
router.put('/:id/deny', authorize('admin', 'technician'), ctrl.denyRequest);

module.exports = router;