const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', default: null, index: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: false, index: true },
  recipientType: { type: String, enum: ['applicant','employer'], default: 'applicant', index: true },
  message: { type: String, required: true, maxlength: 1000 },
  title: { type: String, default: 'Norvim' },
  url: { type: String, default: '/applicant-dashboard.html' },
  read: { type: Boolean, default: false, index: true },
  dedupeKey: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true }
});
notificationSchema.pre('validate', function(next) { if (!this.recipientId && this.applicantId) this.recipientId = this.applicantId; if (this.applicantId && !this.recipientType) this.recipientType = 'applicant'; next(); });
notificationSchema.index({ recipientType: 1, recipientId: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
module.exports = mongoose.model('Notification', notificationSchema);
