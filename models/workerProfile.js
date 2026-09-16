const mongoose = require("mongoose");

const workerProfileSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicant",
      required: true,
      unique: true,
      index: true
    },

    displayName: {
      type: String,
      trim: true,
      maxlength: 100
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    profilePhoto: {
      type: String,
      trim: true
    },

    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceCategory"
      }
    ],

    customServices: [
      { type: String, trim: true, maxlength: 100 }
    ],

    skills: [
      {
        type: String,
        trim: true,
        maxlength: 100
      }
    ],

    experience: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    location: {
      country: {
        type: String,
        trim: true,
        default: "Kenya"
      },

      county: {
        type: String,
        trim: true
      },

      area: {
        type: String,
        trim: true
      },

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

    availability: {
      status: {
        type: String,
        enum: ["Available", "Busy", "Offline"],
        default: "Offline",
        index: true
      },

      serviceRadiusKm: {
        type: Number,
        min: 0,
        max: 500,
        default: 10
      }
    },

    // Location sharing is controlled by the worker. When disabled the
    // marketplace will not use this worker for location-based discovery
    // or opportunity notifications.
    locationSharingEnabled: {
      type: Boolean,
      default: true,
      index: true
    },

    locationUpdatedAt: {
      type: Date,
      default: null
    },

    pricing: {
      type: {
        type: String,
        enum: ["hourly", "fixed", "negotiable"],
        default: "negotiable"
      },

      amount: {
        type: Number,
        min: 0
      }
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

workerProfileSchema.index({
  "location.coordinates": "2dsphere"
});

workerProfileSchema.index({
  services: 1,
  "availability.status": 1,
  isActive: 1
});

module.exports = mongoose.model("WorkerProfile", workerProfileSchema);
