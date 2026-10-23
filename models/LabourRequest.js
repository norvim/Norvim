const mongoose = require("mongoose");

const labourRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      index: true
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile",
      default: null,
      index: true
    },
    requestedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile",
      default: null,
      index: true
    },
    interestedWorkerIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkerProfile"
    }],
    serviceCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: false,
      default: null,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: {
      country: { type: String, trim: true, default: "Kenya" },
      county: { type: String, trim: true },
      area: { type: String, trim: true },
      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        default: undefined,
        validate: {
          validator: v =>
            v === undefined ||
            (v && v.type === "Point" &&
              Array.isArray(v.coordinates) &&
              v.coordinates.length === 2 &&
              Number.isFinite(Number(v.coordinates[0])) &&
              Number.isFinite(Number(v.coordinates[1])) &&
              Number(v.coordinates[0]) >= -180 &&
              Number(v.coordinates[0]) <= 180 &&
              Number(v.coordinates[1]) >= -90 &&
              Number(v.coordinates[1]) <= 90),
          message: "Coordinates must be a valid GeoJSON Point: [longitude, latitude]."
        }
      }
    },
    budget: {
      type: { type: String, enum: ["fixed", "hourly", "negotiable"], default: "negotiable" },
      amount: { type: Number, min: 0 }
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "in_progress", "completed", "cancelled", "expired"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

labourRequestSchema.index({ "location.coordinates": "2dsphere" });
labourRequestSchema.index({ serviceCategoryId: 1, status: 1, createdAt: -1 });
labourRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("LabourRequest", labourRequestSchema);
