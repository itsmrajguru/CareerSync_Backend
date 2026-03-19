const { Resend } = require('resend');

// Fallback to test log if no API key is provided
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn(`[Email] No RESEND_API_KEY. Simulated email to ${to}: ${subject}`);
            return true;
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL,
            to: [to],
            subject: subject,
            text: text,
            html: html
        });

        if (error) {
            console.error(`[Email] Resend API Error:`, error);
            return false;
        }

        console.debug(`[Email] Dispatched via Resend to ${to} (${data.id})`);
        return true;
    } catch (error) {
        console.error(`[Email] Delivery completely failed:`, error);
        return false;
    }
};

module.exports = {
    sendEmail
};
<<<<<<< HEAD
=======
// Force update
>>>>>>> b4fcf50cb8c4ba19695b1bccbb6764094cb7b3bb
