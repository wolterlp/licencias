const License = require('../models/License');
const { generateLicenseKey, signLicenseValidationData } = require('../utils/cryptoUtils');

const sanitizeRoles = (roles) => {
  if (!Array.isArray(roles)) return ['Admin','Cashier'];
  const cleaned = roles
    .map(r => String(r))
    .map(r => r.trim())
    .filter(r => r.length > 0);
  // Remove duplicates preserving order
  const deduped = [];
  for (const r of cleaned) if (!deduped.includes(r)) deduped.push(r);
  return deduped.length ? deduped : ['Admin','Cashier'];
};

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
    maxDevices,
    hardwareId,
    allowedRoles,
    allowedRolesUnpaid
  } = data;

  // Enforce one active license per server if hardwareId provided
  if (hardwareId) {
    const existing = await License.findOne({ hardwareId, status: 'active' });
    if (existing) {
      throw new Error('Ya existe una licencia activa para este servidor (hardwareId)');
    }
  }

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
    licenseKey,
    hardwareId,
    allowedRoles: sanitizeRoles(allowedRoles),
    allowedRolesUnpaid: sanitizeRoles(allowedRolesUnpaid || ['Admin','Cashier'])
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
  if (license.status === 'suspended') {
    return { valid: false, message: 'Licencia suspendida' };
  }

  // Require server hardwareId for validation
  if (!hardwareId) {
    return { valid: false, message: 'Se requiere hardwareId del servidor para validar la licencia' };
  }

  // Check expiration
  const expired = license.isExpired();
  if (expired && license.status !== 'expired') {
    license.status = 'expired';
    await license.save();
  }

  // Check for upcoming expiration (Notification)
  const now = new Date();
  const timeDiff = license.expirationDate - now;
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  let message = null;
  const warningDays = parseInt(process.env.LICENSE_EXPIRY_WARNING_DAYS || '15', 10);
  if (daysRemaining <= warningDays && daysRemaining > 0) {
      message = `Su licencia vencerá en ${daysRemaining} días. Por favor contacte a soporte.`;
  }

  // Optional IP/Domain enforcement
  const enforceDomainIp = (process.env.LICENSE_ENFORCE_DOMAIN_IP || '0') === '1';
  if (enforceDomainIp && license.authorizedDomainOrIP !== '*' && requestIp) {
    if (license.authorizedDomainOrIP !== requestIp) {
      return { valid: false, message: 'IP/Dominio no autorizado' };
    }
  }
  
  // Hardware Locking (Optional Logic)
  if (!license.hardwareId) {
      // First time binding
      license.hardwareId = hardwareId;
  } else if (license.hardwareId !== hardwareId) {
      return { valid: false, message: 'Licencia en uso en otro servidor (Hardware ID mismatch)' };
  }

  // Update validation stats
  license.lastValidation = new Date();
  license.validationCount += 1;
  await license.save();

  const maxOfflineHours = parseInt(process.env.LICENSE_MAX_OFFLINE_HOURS || '72', 10);
  const signature = signLicenseValidationData(license.licenseKey, new Date(license.expirationDate).toISOString(), maxOfflineHours);

  const isPaidUp = license.status === 'active' && !expired;
  const effectiveRoles = isPaidUp 
    ? (license.allowedRoles || ['Admin','Cashier']) 
    : (license.allowedRolesUnpaid && license.allowedRolesUnpaid.length ? license.allowedRolesUnpaid : ['Admin','Cashier']);
  return {
    valid: true,
    message: message,
    license: {
      productId: license.productId,
      restaurantName: license.restaurantName,
      expirationDate: license.expirationDate,
      licenseType: license.licenseType,
      status: license.status,
      maxDevices: license.maxDevices,
      allowedRoles: effectiveRoles,
      maxOfflineHours,
      signature,
      signatureAlgorithm: 'HMAC-SHA256'
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
  const allowedUpdates = ['restaurantName', 'clientId', 'email', 'phone', 'address', 'maxDevices', 'authorizedDomainOrIP', 'expirationDate', 'licenseType', 'allowedRoles', 'allowedRolesUnpaid'];
    
    for (const key of Object.keys(updateData)) {
      if (!allowedUpdates.includes(key)) continue;
      if (key === 'allowedRoles') {
        license.allowedRoles = sanitizeRoles(updateData.allowedRoles);
      } else if (key === 'allowedRolesUnpaid') {
        license.allowedRolesUnpaid = sanitizeRoles(updateData.allowedRolesUnpaid);
      } else {
        license[key] = updateData[key];
      }
    }

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
