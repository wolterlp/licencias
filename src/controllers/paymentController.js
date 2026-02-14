const paymentService = require('../services/paymentService');
const Joi = require('joi');

const createSchema = Joi.object({
  licenseKey: Joi.string().required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().uppercase().default('USD'),
  status: Joi.string().valid('pending', 'paid', 'failed', 'refunded').default('pending'),
  method: Joi.string().valid('card', 'cash', 'transfer', 'paypal', 'stripe', 'other').default('other'),
  transactionId: Joi.string().optional(),
  periodStart: Joi.date().optional(),
  periodEnd: Joi.date().optional(),
  notes: Joi.string().max(500).optional()
});

exports.create = async (req, res) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const payment = await paymentService.createPayment(value);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listByLicense = async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const { start, end } = req.query;
    const payments = await paymentService.listPaymentsByLicense(licenseKey, { start, end });
    res.status(200).json({ success: true, data: payments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.summary = async (req, res) => {
  try {
    const { licenseKey } = req.params;
    const summary = await paymentService.getPaymentSummary(licenseKey);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
