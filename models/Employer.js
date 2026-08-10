const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema({

    companyName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String,
        default: ""
    },

    password: {
        type: String,
        required: true
    },

    isVerified: {
    type: Boolean,
    default: false
},

verificationCode: {
    type: String
},

verificationCodeExpires: {
    type: Date
},

logo: {
    type: String,
    default: ""
},

status: {
    type: String,
    enum: ["Active", "Suspended"],
    default: "Active"
},
resetToken: {
    type: String
},

resetTokenExpires: {
    type: Date
},
companyDescription: {
    type: String,
    default: ""
},

industry: {
    type: String,
    default: ""
},

website: {
    type: String,
    default: ""
},
location: {
    type: String,
    default: ""
},
companySize: {
    type: String,
    default: ""
},

foundedYear: {
    type: Number
},
    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Employer", employerSchema);