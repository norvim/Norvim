const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "norvim41@gmail.com",
        pass: "szcu mnxn swir rfsh"
    }
});

module.exports = transporter;