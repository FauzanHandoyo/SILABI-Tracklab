const express = require('express');
const ctrl = require('../controllers/userController');
const router = express.Router();

router.get('/', ctrl.getAllUsers);
router.get('/:id', ctrl.getUserById);
router.post('/', ctrl.createUser);
router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

module.exports = router;