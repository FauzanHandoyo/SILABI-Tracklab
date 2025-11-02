const express = require('express');
const ctrl = require('../controllers/authController');
const router = express.Router();

router.post('/login', ctrl.login);

module.exports = router;