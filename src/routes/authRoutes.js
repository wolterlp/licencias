const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', protect, admin, authController.register); // Solo admins pueden crear usuarios

module.exports = router;