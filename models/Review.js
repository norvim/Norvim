const mongoose = require('mongoose');
const reviewSchema = new mongoose.Schema({
 bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabourBooking', required: true, index: true },
 reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
 revieweeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true, index: true },
 reviewerRole: { type: String, enum: ['worker','requester'], required: true },
 rating: { type: Number, required: true, min: 1, max: 5 },
 comment: { type: String, trim: true, maxlength: 1000, default: '' },
 createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
reviewSchema.index({ bookingId: 1, reviewerId: 1 }, { unique: true });
module.exports = mongoose.model('Review', reviewSchema);
