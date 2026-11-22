const mongoose = require("mongoose");

const homepageMediaSchema = new mongoose.Schema({
  type: { type: String, enum: ["image", "video"], required: true, index: true },
  title: { type: String, trim: true, maxlength: 160, default: "" },
  caption: { type: String, trim: true, maxlength: 1000, default: "" },
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  status: { type: String, enum: ["published", "hidden"], default: "published", index: true },
  featured: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0, index: true }
}, { timestamps: true });

module.exports = mongoose.model("HomepageMedia", homepageMediaSchema);
