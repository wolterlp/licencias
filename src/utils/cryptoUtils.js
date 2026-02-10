const crypto = require('crypto');

// Secret key for signing (should be in env variables)
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'super_secret_license_key_change_me';

/**
 * Generates a unique license key.
 * Format: PREFIX-RANDOM-CHECKSUM
 */
const generateLicenseKey = (prefix = 'LUNIA') => {
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase(); // 16 chars
  const data = `${prefix}-${randomPart}`;
  const checksum = crypto.createHmac('sha256', LICENSE_SECRET)
    .update(data)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();
  
  return `${data}-${checksum}`;
};

/**
 * Validates the format and checksum of a license key.
 */
const validateLicenseKeyFormat = (licenseKey) => {
  const parts = licenseKey.split('-');
  if (parts.length < 3) return false;
  
  const checksum = parts.pop();
  const data = parts.join('-');
  
  const expectedChecksum = crypto.createHmac('sha256', LICENSE_SECRET)
    .update(data)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();
    
  return checksum === expectedChecksum;
};

module.exports = {
  generateLicenseKey,
  validateLicenseKeyFormat
};
