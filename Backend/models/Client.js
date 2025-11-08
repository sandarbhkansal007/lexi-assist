const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  address: String,
  idProof: String,
  cases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Case' }],
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', clientSchema);