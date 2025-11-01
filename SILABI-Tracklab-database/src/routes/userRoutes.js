const express = require('express');
const ctrl = require('../controllers/userController');
const { validateRegistration, validateUser } = require('../middlewares/validation');
const { authenticate, authorize } = require('../middlewares/auth');
const router = express.Router();

// Public routes
router.post('/register', validateRegistration, ctrl.register);

// Protected routes (require authentication)
router.get('/', authenticate, authorize('admin'), ctrl.getAllUsers);
router.get('/:id', authenticate, ctrl.getUserById);
router.post('/', authenticate, authorize('admin'), validateUser, ctrl.createUser);
router.put('/:id', authenticate, ctrl.updateUser);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deleteUser);

module.exports = router;