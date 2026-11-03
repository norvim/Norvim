const mongoose = require("mongoose");

const marketplaceCallSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "WorkerProfile", required: true, index: true },
  callerId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
  workerApplicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
  phone: { type: String, default: "" },
  source: { type: String, enum: ["worker_card", "worker_profile"], default: "worker_card" },
  createdAt: { type: Date, default: Date.now, index: true }
});

marketplaceCallSchema.index({ createdAt: -1 });
module.exports = mongoose.model("MarketplaceCall", marketplaceCallSchema);
