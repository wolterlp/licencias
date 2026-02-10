const License = require('../models/License');
const { generateLicenseKey } = require('../utils/cryptoUtils');

/**
 * Create a new license
 */
const createLicense = async (data) => {
  const { 
    productId, 
    clientId, 
    restaurantName, 
    email, 
    phone,
    address,
    authorizedDomainOrIP, 
    licenseType, 
    durationDays, // Optional custom duration
    maxDevices 
  } = data;

  // Calculate expiration date
  let expirationDate = new Date();
  if (durationDays) {
    expirationDate.setDate(expirationDate.getDate() + durationDays);
  } else {
    // Default durations based on type
    switch (licenseType) {
      case 'trial':
        expirationDate.setDate(expirationDate.getDate() + 15); // Default 15 days trial
        break;
      case 'monthly':
        expirationDate.setMonth(expirationDate.getMonth() + 1);
        break;
      case 'quarterly':
        expirationDate.setMonth(expirationDate.getMonth() + 3);
        break;
      case 'biannual':
        expirationDate.setMonth(expirationDate.getMonth() + 6);
        break;
      case 'annual':
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        break;
      case 'perpetual':
        expirationDate.setFullYear(expirationDate.getFullYear() + 99); // Effectively forever
        break;
      default:
        expirationDate.setDate(expirationDate.getDate() + 30);
    }
  }

  const licenseKey = generateLicenseKey('LUNIA');

  const newLicense = await License.create({
    productId,
    clientId,
    restaurantName,
    email,
    phone,
    address,
    authorizedDomainOrIP,
    licenseType,
    startDate: new Date(),
    expirationDate,
    status: 'active',
    maxDevices,
    licenseKey
  });

  return newLicense;
};

/**
 * Validate a license key
 */
const validateLicense = async (licenseKey, requestIp, hardwareId) => {
  const license = await License.findOne({ licenseKey });

  if (!license) {
    return { valid: false, message: 'Licencia no encontrada' };
  }

  // Check status
  if (license.status !== 'active') {
    return { valid: false, message: `Licencia ${license.status}` }; // suspended or expired
  }

  // Check expiration
  if (license.isExpired()) {
    license.status = 'expired';
    await license.save();
    return { valid: false, message: 'Licencia expirada' };
  }

  // Check for upcoming expiration (Notification)
  const now = new Date();
  const timeDiff = license.expirationDate - now;
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  let message = null;
  
  if (daysRemaining <= 10 && daysRemaining > 0) {
      message = `Su licencia vencerá en ${daysRemaining} días. Por favor contacte a soporte.`;
  }

  // Check IP/Domain (if strict mode is enabled or IP provided)
  // Note: Localhost is often exempt or handled specifically
  if (license.authorizedDomainOrIP !== '*' && requestIp) {
    // Simple check - in production might need list matching
    if (license.authorizedDomainOrIP !== requestIp) {
       // Optional: Allow update on first use if not set?
       // For now, fail if mismatch
       // return { valid: false, message: 'IP/Dominio no autorizado' };
    }
  }
  
  // Hardware Locking (Optional Logic)
  if (hardwareId) {
      if (!license.hardwareId) {
          // First time binding
          license.hardwareId = hardwareId;
      } else if (license.hardwareId !== hardwareId) {
          return { valid: false, message: 'Licencia en uso en otro dispositivo (Hardware ID mismatch)' };
      }
  }

  // Update validation stats
  license.lastValidation = new Date();
  license.validationCount += 1;
  await license.save();

  return { 
    valid: true,
    message: message, // Include warning message if any
    license: {
      productId: license.productId,
      restaurantName: license.restaurantName,
      expirationDate: license.expirationDate,
      licenseType: license.licenseType,
      maxDevices: license.maxDevices
    }
  };
};

/**
 * Renew a license
 */
const renewLicense = async (licenseKey, { durationDays, newLicenseType } = {}) => {
  const license = await License.findOne({ licenseKey });
  if (!license) throw new Error('Licencia no encontrada');

  // Update license type if provided
  if (newLicenseType) {
      license.licenseType = newLicenseType;
  }

  const now = new Date();
  // If expired, start from now. If active, add to current expiration.
  const baseDate = license.isExpired() ? now : new Date(license.expirationDate);
  
  // Default renewal logic
  if (durationDays) {
      baseDate.setDate(baseDate.getDate() + durationDays);
  } else {
      // Extend based on original (or new) type
      if (license.licenseType === 'monthly') baseDate.setMonth(baseDate.getMonth() + 1);
      else if (license.licenseType === 'quarterly') baseDate.setMonth(baseDate.getMonth() + 3);
      else if (license.licenseType === 'biannual') baseDate.setMonth(baseDate.getMonth() + 6);
      else if (license.licenseType === 'annual') baseDate.setFullYear(baseDate.getFullYear() + 1);
      else baseDate.setDate(baseDate.getDate() + 30);
  }

  license.expirationDate = baseDate;
  license.status = 'active'; // Reactivate if it was expired
  await license.save();

  return license;
};

/**
 * Deactivate/Suspend a license
 */
const deactivateLicense = async (licenseKey, reason) => {
    const license = await License.findOne({ licenseKey });
    if (!license) throw new Error('Licencia no encontrada');

    license.status = 'suspended';
    await license.save();
    return license;
};

/**
 * Delete a license permanently
 */
const deleteLicense = async (licenseKey) => {
    const result = await License.deleteOne({ licenseKey });
    if (result.deletedCount === 0) {
        throw new Error('Licencia no encontrada');
    }
    return true;
};

/**
 * Update license details
 */
const updateLicense = async (licenseKey, updateData) => {
    const license = await License.findOne({ licenseKey });
    if (!license) throw new Error('Licencia no encontrada');

    // Fields allowed to be updated
    const allowedUpdates = ['restaurantName', 'clientId', 'email', 'phone', 'address', 'maxDevices', 'authorizedDomainOrIP', 'expirationDate', 'licenseType'];
    
    Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
            license[key] = updateData[key];
        }
    });

    await license.save();
    return license;
};

module.exports = {
  createLicense,
  validateLicense,
  renewLicense,
  deactivateLicense,
  deleteLicense,
  updateLicense
};
