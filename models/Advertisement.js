const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", default: null, index: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", default: null, index: true },
  advertiserName: { type: String, required: true, trim: true, maxlength: 120 },
  advertiserEmail: { type: String, trim: true, lowercase: true, maxlength: 160 },
  advertiserPhone: { type: String, trim: true, maxlength: 30 },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 1000 },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], required: true },
  destinationUrl: { type: String, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["draft", "active", "paused", "completed"], default: "draft", index: true },
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date },
  budget: { type: Number, min: 0, default: 0 },
  remainingBudget: { type: Number, min: 0, default: 0 },
  costPerView: { type: Number, min: 0.01, default: 0.50 },
  costPerClick: { type: Number, min: 0, default: 0 },
  impressions: { type: Number, default: 0 },
  qualifiedViews: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  amountSpent: { type: Number, min: 0, default: 0 }
}, { timestamps: true });

advertisementSchema.index({ status: 1, startAt: 1, endAt: 1 });
module.exports = mongoose.model("Advertisement", advertisementSchema);
