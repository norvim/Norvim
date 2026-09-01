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
    completedAt: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("LabourBooking", labourBookingSchema);
