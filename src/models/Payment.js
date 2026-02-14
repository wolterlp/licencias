const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  license: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'License',
    required: true,
    index: true
  },
  licenseKeySnapshot: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  method: {
    type: String,
    enum: ['card', 'cash', 'transfer', 'paypal', 'stripe', 'other'],
    default: 'other'
  },
  transactionId: {
    type: String,
    trim: true
  },
  paidAt: {
    type: Date
  },
  periodStart: {
    type: Date
  },
  periodEnd: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

paymentSchema.index({ paidAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
