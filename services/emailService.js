const nodemailer = require('nodemailer');

// Initialize Ethereal testing account if no SMTP provided
const createTransporter = async () => {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        console.debug('[Email] Connecting to primary SMTP');
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        console.warn('[Email] Fallback: Using Ethereal mock account');
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

        const info = await transporter.sendMail(mailOptions);

        console.debug(`[Email] Dispatched to ${to} (${info.messageId})`);

        if (!process.env.SMTP_HOST) {
            console.debug(`[Email] Mock preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return true;
    } catch (error) {
        console.error(`[Email] Delivery failed: ${error.message}`);
        return false;
    }
};

module.exports = {
    sendEmail
};
