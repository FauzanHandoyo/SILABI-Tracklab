const express = require('express');
const router = express.Router();
const { register, login, verifyToken } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected route
router.get('/verify', authenticate, verifyToken);

module.exports = router;