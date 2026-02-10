const licenseService = require('../services/licenseService');

// Create License
exports.create = async (req, res) => {
  try {
    const license = await licenseService.createLicense(req.body);
    res.status(201).json({
      success: true,
      data: license
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Validate License
exports.validate = async (req, res) => {
  try {
    const { licenseKey, hardwareId } = req.body;
    const requestIp = req.ip || req.connection.remoteAddress;

    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'License Key is required' });
    }

    const result = await licenseService.validateLicense(licenseKey, requestIp, hardwareId);

    if (result.valid) {
      res.status(200).json({
        success: true,
        data: result.license
      });
    } else {
      res.status(403).json({ // 403 Forbidden for invalid license
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error during validation'
    });
  }
};

// Renew License
exports.renew = async (req, res) => {
  try {
    const { licenseKey, durationDays, newLicenseType } = req.body;
    const license = await licenseService.renewLicense(licenseKey, { durationDays, newLicenseType });
    res.status(200).json({
      success: true,
      message: 'License renewed successfully',
      data: license
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Deactivate License
exports.deactivate = async (req, res) => {
  try {
    const { licenseKey } = req.body;
    const license = await licenseService.deactivateLicense(licenseKey);
    res.status(200).json({
      success: true,
      message: 'License deactivated successfully',
      data: { status: license.status }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete License
exports.delete = async (req, res) => {
  try {
    const { licenseKey } = req.body; // or req.params if you prefer DELETE /:licenseKey
    if (!licenseKey) return res.status(400).json({ success: false, message: 'License Key required' });
    
    await licenseService.deleteLicense(licenseKey);
    res.status(200).json({
      success: true,
      message: 'License deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update License Details
exports.update = async (req, res) => {
    try {
        const { licenseKey, ...updateData } = req.body;
        if (!licenseKey) return res.status(400).json({ success: false, message: 'License Key required' });

        const license = await licenseService.updateLicense(licenseKey, updateData);
        res.status(200).json({
            success: true,
            message: 'License updated successfully',
            data: license
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get License Details
exports.getDetails = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        // Ideally, check for admin auth here
        const License = require('../models/License'); // Direct access for simple read or move to service
        const license = await License.findOne({ licenseKey });
        
        if (!license) return res.status(404).json({ success: false, message: 'Not found' });

        res.status(200).json({
            success: true,
            data: license
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// List All Licenses (For Admin Dashboard)
exports.listAll = async (req, res) => {
    try {
        const License = require('../models/License');
        const licenses = await License.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: licenses
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
