const nodemailer = require('nodemailer');

// Use Ethereal for testing if no real credentials are provided
// It automatically logs a test email URL
const createTransporter = async () => {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.log('[EmailService] Using real SMTP credentials form .env');
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback to test account for local development
        console.log('[EmailService] No SMTP config found, using Ethereal test account.');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }
    return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: process.env.FROM_EMAIL || '"CareerSync Team" <careersync.mr@gmail.com>',
            to,
            subject,
            text,
            html
        };

        // Added error logging inside sendMail
        const info = await transporter.sendMail(mailOptions);

        console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
        // Log URL so the user can see the email locally if using Ethereal
        if (info.messageId && nodemailer.getTestMessageUrl(info)) {
            console.log(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return true;
    } catch (error) {
        console.error('[EmailService] Error sending email:', error);
        // Important: return false instead of throwing so it doesn't crash the server
        return false;
    }
};

module.exports = {
    sendEmail
};
