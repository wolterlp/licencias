const { roleMatches } = require('./pos_role_mapping_example');

const getEffectiveRoles = (status, allowedRoles, allowedRolesUnpaid) => {
  if (String(status).toLowerCase() === 'active') {
    return Array.isArray(allowedRoles) && allowedRoles.length ? allowedRoles : ['Admin','Cashier'];
  }
  return Array.isArray(allowedRolesUnpaid) && allowedRolesUnpaid.length ? allowedRolesUnpaid : ['Admin','Cashier'];
};

const canAccess = (userRole, routeRequiredRole, status, allowedRoles, allowedRolesUnpaid) => {
  const roles = getEffectiveRoles(status, allowedRoles, allowedRolesUnpaid);
  if (!routeRequiredRole) return true;
  if (!userRole) return false;
  for (const r of roles) {
    if (roleMatches(userRole, r) && roleMatches(r, routeRequiredRole)) return true;
  }
  return false;
};

module.exports = { getEffectiveRoles, canAccess };
