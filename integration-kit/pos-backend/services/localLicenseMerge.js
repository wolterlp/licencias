function mergeServerLicenseData(config, serverData) {
  if (!config.license) config.license = {};
  config.license.key = config.license.key || '';
  config.license.status = serverData.status || config.license.status || 'active';
  config.license.expirationDate = serverData.expirationDate || config.license.expirationDate;
  config.license.lastValidation = new Date();
  config.license.maxOfflineHours = serverData.maxOfflineHours || config.license.maxOfflineHours || 72;
  config.license.allowedRoles = Array.isArray(serverData.allowedRoles) && serverData.allowedRoles.length ? serverData.allowedRoles : (config.license.allowedRoles || ['Admin','Cashier']);
  config.license.electronicInvoicing = typeof serverData.electronicInvoicing === 'boolean'
    ? serverData.electronicInvoicing
    : (typeof config.license.electronicInvoicing === 'boolean' ? config.license.electronicInvoicing : false);
  if (serverData.kitchensCount != null) {
    const n = parseInt(serverData.kitchensCount, 10);
    config.license.kitchensCount = Number.isNaN(n) || n < 1 ? 1 : n;
  } else if (config.license.kitchensCount == null) {
    config.license.kitchensCount = 1;
  }
  return config;
}

module.exports = { mergeServerLicenseData }
