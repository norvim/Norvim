const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  accountType: { type: String, enum: ['applicant','employer','worker'], required: true, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', default: null },
  reason: { type: String, required: true, maxlength: 1200 },
  explanation: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },
  adminResponse: { type: String, maxlength: 1200, default: '' },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });
schema.index({ accountType: 1, accountId: 1, status: 1 });
module.exports = mongoose.model('SuspensionAppeal', schema);
