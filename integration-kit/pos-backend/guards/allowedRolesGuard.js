const createHttpError = require('http-errors');
const Restaurant = require('../models/restaurantModel');

const allowedRolesGuard = async (req, res, next) => {
  try {
    const config = await Restaurant.findOne();
    if (!config || !config.license || !config.license.key) {
      return next(createHttpError(403, 'Licencia no encontrada'));
    }
    const status = config.license.status;
    if (status === 'suspended' || status === 'expired') {
      return next(createHttpError(403, 'Licencia inactiva'));
    }
    const paidUp = status === 'active' && config.license.expirationDate && new Date(config.license.expirationDate) > new Date();
    const baseRoles = ['Admin','Cashier'];
    const roles = paidUp
      ? (Array.isArray(config.license.allowedRoles) && config.license.allowedRoles.length ? config.license.allowedRoles : baseRoles)
      : (Array.isArray(config.license.allowedRolesUnpaid) && config.license.allowedRolesUnpaid.length ? config.license.allowedRolesUnpaid : baseRoles);
    const userRole = req.user && req.user.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(createHttpError(403, 'Perfil no habilitado por la licencia'));
    }
    next();
  } catch (err) {
    next(createHttpError(500, 'Error verificando perfiles de licencia'));
  }
};

module.exports = allowedRolesGuard
