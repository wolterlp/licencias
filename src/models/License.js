const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
    trim: true,
    default: 'LunIA_POS' // Default product
  },
  clientId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  restaurantName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Por favor ingrese un email válido']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  authorizedDomainOrIP: {
    type: String,
    required: true,
    trim: true,
    default: '*' // '*' means allow all (for initial setup), but ideally should be restrictive
  },
  licenseType: {
    type: String,
    required: true,
    enum: ['trial', 'monthly', 'quarterly', 'biannual', 'annual', 'perpetual'],
    default: 'trial'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  expirationDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'suspended', 'expired'],
    default: 'active'
  },
  maxDevices: {
    type: Number,
    required: true,
    default: 1
  },
  licenseKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  lastValidation: {
    type: Date
  },
  validationCount: {
    type: Number,
    default: 0
  },
  // Hardware ID for stricter locking (optional but good practice)
  hardwareId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Creates createdAt and updatedAt
});

// Index for checking active licenses for a client
licenseSchema.index({ clientId: 1, status: 1 });

// Method to check if license is expired
licenseSchema.methods.isExpired = function() {
  return Date.now() > this.expirationDate;
};

// Method to check if valid (status + expiration)
licenseSchema.methods.isValid = function() {
  return this.status === 'active' && !this.isExpired();
};

const License = mongoose.model('License', licenseSchema);

module.exports = License;
