const Restaurant = require('../models/restaurantModel');

const checkLoginAllowedByLicense = async (userRole) => {
  const config = await Restaurant.findOne();
  if (!config || !config.license || !config.license.key) return false;
  const status = config.license.status;
  if (status === 'suspended' || status === 'expired') return false;
  const paidUp = status === 'active' && config.license.expirationDate && new Date(config.license.expirationDate) > new Date();
  const baseRoles = ['Admin','Cashier'];
  const roles = paidUp
    ? (Array.isArray(config.license.allowedRoles) && config.license.allowedRoles.length ? config.license.allowedRoles : baseRoles)
    : baseRoles;
  return roles.includes(userRole);
};

module.exports = { checkLoginAllowedByLicense }
