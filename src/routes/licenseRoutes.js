const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes
router.get('/all', protect, admin, licenseController.listAll); // Must be before /:licenseKey
router.post('/create', protect, admin, licenseController.create);
router.post('/create-public', licenseController.create);
router.post('/validate', licenseController.validate);
router.post('/renew', protect, admin, licenseController.renew);
router.post('/update', protect, admin, licenseController.update);
router.post('/deactivate', protect, admin, licenseController.deactivate);
router.delete('/delete', protect, admin, licenseController.delete);
router.get('/:licenseKey', protect, admin, licenseController.getDetails);

module.exports = router;
