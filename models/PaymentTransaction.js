const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
  type: { type: String, enum: ["premium", "wallet_topup", "marketplace_payment", "refund", "payout", "credit", "debit"], required: true, index: true },
  product: { type: String, enum: ["jobs", "marketplace", "booking", null], default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "LabourBooking", default: null, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "KES" },
  provider: { type: String, default: "paystack" },
  reference: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["pending", "success", "failed", "refunded", "payout_pending", "payout_success", "payout_failed"], default: "pending", index: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
