const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');

// Routes
router.get('/all', licenseController.listAll); // Must be before /:licenseKey to avoid collision if :licenseKey matches "all"
router.post('/create', licenseController.create);
router.post('/validate', licenseController.validate);
router.post('/renew', licenseController.renew);
router.post('/update', licenseController.update);
router.post('/deactivate', licenseController.deactivate);
router.delete('/delete', licenseController.delete);
router.get('/:licenseKey', licenseController.getDetails);

module.exports = router;
