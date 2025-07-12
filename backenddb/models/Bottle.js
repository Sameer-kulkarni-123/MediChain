const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user_agent: String,
  ip: String
});

const reportSchema = new mongoose.Schema({
  flagged: { type: Boolean, default: false },
  reason: String,
  reported_at: Date
});

const bottleSchema = new mongoose.Schema({
  qr_code: { type: String, unique: true, required: true }, // value encoded in QR
  blockchain_value: String, // e.g. hash or address from blockchain
  certificate: String,      // from entries table
  details: String,          // any extra info
  scanned: { type: Boolean, default: false },
  scan_history: [scanHistorySchema],
  report: reportSchema
});

module.exports = mongoose.model('Bottle', bottleSchema); 