const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', default: null },
  reporterEmail: { type: String, trim: true, lowercase: true, default: '' },
  reason: { type: String, enum: ['Fake job','Requests payment','Suspicious employer','Misleading salary','Fraudulent contact details','Other'], required: true },
  details: { type: String, trim: true, maxlength: 1200, default: '' },
  status: { type: String, enum: ['pending','reviewed','dismissed','confirmed'], default: 'pending', index: true },
  adminNote: { type: String, trim: true, maxlength: 1200, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('JobReport', schema);
