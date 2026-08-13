const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
    const { data, error } = await resend.emails.send({
        from: "Norvim <onboarding@resend.dev>",
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