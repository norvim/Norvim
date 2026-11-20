const mongoose = require("mongoose");
const publicCommentSchema = new mongoose.Schema({
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "Applicant", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ["pending", "approved", "hidden", "rejected"], default: "approved", index: true },
  flagged: { type: Boolean, default: false },
  moderationReason: { type: String, trim: true, maxlength: 300, default: "" }
}, { timestamps: true });
publicCommentSchema.index({ status: 1, createdAt: -1 });
module.exports = mongoose.model("PublicComment", publicCommentSchema);
