const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema({

    applicantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applicant",
        required: true
    },

    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
        required: true
    },

    savedAt: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model("SavedJob", savedJobSchema);