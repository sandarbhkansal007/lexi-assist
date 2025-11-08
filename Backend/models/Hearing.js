const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema({
  case: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
  date: { type: Date, required: true },
  time: String,
  court: String,
  judge: String,
  type: { type: String, enum: ['hearing', 'filing', 'argument', 'judgment'], default: 'hearing' },
  notes: String,
  status: { type: String, enum: ['scheduled', 'completed', 'postponed'], default: 'scheduled' },
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hearing', hearingSchema);
