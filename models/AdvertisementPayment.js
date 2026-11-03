const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  advertisementId: { type: mongoose.Schema.Types.ObjectId, ref: "Advertisement", required: true, index: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", default: null, index: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer", default: null, index: true },
  amount: { type: Number, required: true, min: 1 },
  reference: { type: String, required: true, unique: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  status: { type: String, enum: ["pending", "success", "failed"], default: "pending", index: true },
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
module.exports = mongoose.model("AdvertisementPayment", schema);
