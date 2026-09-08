const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

// Use a verified Norvim sender when available.
// Until the domain is verified, this safely falls back to Resend's test sender.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = process.env.RESEND_FROM_NAME || "Norvim";

async function sendEmail({ to, subject, html }) {
    const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

module.exports = sendEmail;
