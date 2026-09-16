const mongoose = require("mongoose");

const labourBookingSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabourRequest",
      required: true,
      unique: true,
      index: true
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["accepted", "in_progress", "completed", "cancelled"],
      default: "accepted",
      index: true
    },
    startedAt: Date,
    completedAt: Date,
    cancellationReason: { type: String, trim: true, maxlength: 500, default: "" },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", default: null },
    cancelledAt: { type: Date, default: null },
    agreedAmount: { type: Number, min: 0, default: 0 },
    commissionPercent: { type: Number, min: 0, max: 100, default: 10 },
    commissionAmount: { type: Number, min: 0, default: 0 },
    workerEarnings: { type: Number, min: 0, default: 0 },
    paymentStatus: { type: String, enum: ["unpaid", "pending", "paid", "outside_norvim", "failed", "refunded"], default: "unpaid" },
    paymentReference: { type: String, default: "" },
    payoutStatus: { type: String, enum: ["not_ready", "pending", "paid", "failed"], default: "not_ready" },
    payoutReference: { type: String, default: "" },
    outsideNorvimFineAmount: { type: Number, min: 0, default: 0 },
    outsideNorvimFineReference: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabourBooking", labourBookingSchema);
