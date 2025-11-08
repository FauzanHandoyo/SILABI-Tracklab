const express = require('express');
const ctrl = require('../controllers/userController');
const { validateRegistration, validateUser } = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const router = express.Router();

// Public routes
router.post('/register', validateRegistration, ctrl.register);

// Protected routes (require authentication)
router.use(authenticate);

// Current user profile routes
router.get('/me', ctrl.getCurrentUser);
router.put('/me', validateUser, ctrl.updateCurrentUser);

// Admin only routes
router.get('/', authorize('admin'), ctrl.getAllUsers);
router.post('/', authorize('admin'), validateRegistration, ctrl.createUser);
router.get('/:id', authorize('admin'), ctrl.getUserById);
router.put('/:id', authorize('admin'), validateUser, ctrl.updateUser);
router.delete('/:id', authorize('admin'), ctrl.deleteUser);

module.exports = router;