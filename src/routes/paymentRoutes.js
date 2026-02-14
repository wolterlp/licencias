const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/create', protect, admin, paymentController.create);
router.get('/license/:licenseKey', protect, admin, paymentController.listByLicense);
router.get('/summary/:licenseKey', protect, admin, paymentController.summary);

module.exports = router;
