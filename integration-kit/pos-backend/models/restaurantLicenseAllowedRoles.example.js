const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  license: {
    allowedRoles: [{ type: String }]
  }
});

module.exports = restaurantSchema
