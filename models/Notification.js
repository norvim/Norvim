const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({

    applicantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applicant",
        required: true
    },

    message: {
        type: String,
        required: true
    },

    read: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model(
    "Notification",
    notificationSchema
);