const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    balance: {
        type: Number,
        default: 0
    }

});


module.exports = mongoose.model("Admin", adminSchema);