const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['manufacturer', 'distributor', 'retailer']
  },
  wallet_address: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  certificate: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Entry', entrySchema); 