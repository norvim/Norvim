const mongoose = require("mongoose");

const accountTransactionSchema = new mongoose.Schema(
  {
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: false, index: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", required: false, index: true },
    type: { type: String, enum: ["cancellation_fine", "credit", "debit", "refund", "commission", "payout"], required: true, index: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "LabourBooking", default: null },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "CancellationReport", default: null },
    paymentReference: { type: String, default: "", index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccountTransaction", accountTransactionSchema);
