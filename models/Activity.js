const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({

    message: {
        type: String,
        required: true
    },

    read: {
        type: Boolean,
        default: false
    },

    kind: {
        type: String,
        enum: ["general", "payment"],
        default: "general",
        index: true
    },

    reference: {
        type: String,
        default: "",
        index: true
    },

    paymentType: {
        type: String,
        default: "",
        index: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Activity", activitySchema);