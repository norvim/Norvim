const mongoose = require('mongoose');
const pushSubscriptionSchema = new mongoose.Schema({
  // applicantId remains for compatibility with existing subscriptions.
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', default: null, index: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  accountType: { type: String, enum: ['applicant','employer'], default: 'applicant', index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  userAgent: { type: String, default: '' }, createdAt: { type: Date, default: Date.now }, updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
