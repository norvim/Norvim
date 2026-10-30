const mongoose = require("mongoose");
const premiumSubscriptionSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", default: null, index: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", default: null, index: true },
  product: { type: String, enum: ["jobs", "marketplace"], required: true, index: true },
  plan: { type: String, default: "premium" },
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active", index: true },
  amount: { type: Number, min: 0, default: 0 },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  paymentReference: { type: String, trim: true, default: "" }
}, { timestamps: true });
premiumSubscriptionSchema.index({ applicantId: 1, product: 1, status: 1 });
premiumSubscriptionSchema.index({ employerId: 1, product: 1, status: 1 });
module.exports = mongoose.model("PremiumSubscription", premiumSubscriptionSchema);
