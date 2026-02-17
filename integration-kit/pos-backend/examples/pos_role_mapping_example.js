const equivalences = {
  admin: ['admin','administrador'],
  cashier: ['cashier','cajero','caja'],
  waiter: ['waiter','mesero'],
  kitchen: ['kitchen','cocina','cocinero'],
  delivery: ['delivery','repartidor'],
  barman: ['barman','bartender'],
  barista: ['barista']
};

const normalize = (r) => String(r || '').toLowerCase();

const roleMatches = (userRole, requiredRole) => {
  const u = normalize(userRole);
  const r = normalize(requiredRole);
  if (u === 'admin' || u === 'administrador') return true;
  for (const arr of Object.values(equivalences)) {
    if (arr.includes(u) && arr.includes(r)) return true;
  }
  return u === r;
};

module.exports = { roleMatches, normalize, equivalences };
