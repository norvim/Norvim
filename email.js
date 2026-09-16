const { Resend } = require("resend");

const apiKey = String(process.env.RESEND_API_KEY || "").trim();
const FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || "").trim();
const FROM_NAME = String(process.env.RESEND_FROM_NAME || "Norvim").trim();

if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY is not configured. Verification emails cannot be sent.");
}
if (!FROM_EMAIL) {
    console.warn("[EMAIL] RESEND_FROM_EMAIL is not configured. Set it to an email address on a verified Resend domain.");
}

const resend = apiKey ? new Resend(apiKey) : null;

async function sendEmail({ to, subject, html }) {
    if (!resend) throw new Error("Email service is not configured. Add RESEND_API_KEY in the server environment.");
    if (!FROM_EMAIL) throw new Error("Email sender is not configured. Add RESEND_FROM_EMAIL using a verified Resend domain.");
    const recipient = String(to || "").trim().toLowerCase();
    if (!recipient) throw new Error("Recipient email is missing.");
    try {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to: [recipient],
            subject: String(subject || "Norvim"),
            html: String(html || "")
        });
        if (error) throw new Error(error.message || "Resend rejected the email.");
        console.log(`[EMAIL] Verification/notification email accepted by Resend: ${data?.id || "accepted"}`);
        return data;
    } catch (error) {
        console.error("[EMAIL] Resend send failed:", error?.message || error);
        throw error;
    }
}

module.exports = sendEmail;
