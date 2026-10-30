const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  // Link application to the job
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  jobTitle: {
    type: String,
    required: true
  },

  cv: {
    type: String,
    required: true
  },

  status: {
    type: String,
    default: "pending"
  },

  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Applicant"
},

jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job"
},

  appliedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Application", applicationSchema);