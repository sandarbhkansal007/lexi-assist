const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, required: true },
  title: { type: String, required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  caseType: { type: String, required: true },
  court: String,
  filingDate: Date,
  status: { 
    type: String, 
    enum: ['filed', 'ongoing', 'hearing', 'closed', 'won', 'lost'], 
    default: 'filed' 
  },
  description: String,
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  similarCases: [{
    caseTitle: String,
    citation: String,
    verdict: String,
    relevance: Number
  }],
  summary: String,
  lawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Case', caseSchema);