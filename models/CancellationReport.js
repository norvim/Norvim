const mongoose = require("mongoose");

const cancellationReportSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "LabourBooking", required: true, unique: true, index: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "LabourRequest", required: true, index: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    reportedApplicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
    message: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: ["pending", "cleared", "guilty", "fine_applied"], default: "pending", index: true },
    fineAmount: { type: Number, default: 0 },
    adminNote: { type: String, trim: true, maxlength: 1500, default: "" },
    decidedAt: { type: Date, default: null },
    finedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CancellationReport", cancellationReportSchema);
