function mergeServerLicenseData(config, serverData) {
  if (!config.license) config.license = {};
  config.license.key = config.license.key || '';
  config.license.status = serverData.status || config.license.status || 'active';
  config.license.expirationDate = serverData.expirationDate || config.license.expirationDate;
  config.license.lastValidation = new Date();
  config.license.maxOfflineHours = serverData.maxOfflineHours || config.license.maxOfflineHours || 72;
  config.license.allowedRoles = Array.isArray(serverData.allowedRoles) && serverData.allowedRoles.length ? serverData.allowedRoles : (config.license.allowedRoles || ['Admin','Cashier']);
  return config;
}

module.exports = { mergeServerLicenseData }
