const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema({

    name: {
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
        required: true
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

    profilePhoto: {
    type: String,
    default: ""
},

about: {
    type: String,
    default: ""
},

skills: {
    type: String,
    default: ""
},

education: {
    type: String,
    default: ""
},

experience: {
    type: String,
    default: ""
},

linkedin: {
    type: String,
    default: ""
},

portfolio: {
    type: String,
    default: ""
},

    resetToken: {
    type: String
},

resetTokenExpires: {
    type: Date
},

    createdAt: {
        type: Date,
        default: Date.now
    }

});


module.exports = mongoose.model("Applicant", applicantSchema);