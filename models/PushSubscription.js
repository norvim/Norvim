const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  // applicantId is retained for compatibility with existing saved subscriptions.
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', default: null, index: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', default: null, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  recipientType: { type: String, enum: ['applicant', 'employer'], default: 'applicant', index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  userAgent: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
