const Payment = require('../models/Payment');
const License = require('../models/License');
const { renewLicense } = require('./licenseService');

const createPayment = async (data) => {
  const { licenseKey, amount, currency, status, method, transactionId, periodStart, periodEnd, notes } = data;

  const license = await License.findOne({ licenseKey });
  if (!license) throw new Error('Licencia no encontrada');

  const payment = await Payment.create({
    license: license._id,
    licenseKeySnapshot: license.licenseKey,
    amount,
    currency,
    status,
    method,
    transactionId,
    paidAt: status === 'paid' ? new Date() : undefined,
    periodStart,
    periodEnd,
    notes
  });

  // Auto-renew on paid status
  if (status === 'paid') {
    if (periodEnd) {
      // Renew until provided periodEnd
      const currentExp = new Date(license.expirationDate || Date.now());
      const target = new Date(periodEnd);
      if (target > currentExp) {
        license.expirationDate = target;
        license.status = 'active';
        await license.save();
      }
    } else {
      // Fallback: extend based on licenseType
      await renewLicense(license.licenseKey);
    }
  } else if (status === 'pending') {
    license.status = 'pending_payment';
    await license.save();
  }

  return payment;
};

const listPaymentsByLicense = async (licenseKey, { start, end } = {}) => {
  const license = await License.findOne({ licenseKey });
  if (!license) throw new Error('Licencia no encontrada');
  const query = { license: license._id };
  if (start || end) {
    query.createdAt = {};
    if (start) query.createdAt.$gte = new Date(start);
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }
  const payments = await Payment.find(query).sort({ createdAt: -1 });
  return payments;
};

const getPaymentSummary = async (licenseKey) => {
  const license = await License.findOne({ licenseKey });
  if (!license) throw new Error('Licencia no encontrada');

  const agg = await Payment.aggregate([
    { $match: { license: license._id, status: 'paid' } },
    { $group: { _id: null, totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const summary = agg[0] || { totalAmount: 0, count: 0 };
  return summary;
};

module.exports = {
  createPayment,
  listPaymentsByLicense,
  getPaymentSummary
};
