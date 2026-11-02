const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const missingSettings = ['SMTP_HOST', 'SMTP_EMAIL', 'SMTP_PASSWORD']
        .filter((setting) => !process.env[setting]?.trim());
    if (missingSettings.length) {
        const error = new Error(
            `Email service is not configured. Set ${missingSettings.join(', ')} in backend/config/.env.`
        );
        error.statusCode = 503;
        throw error;
    }

    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST.trim(),
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_EMAIL.trim(),
            pass: process.env.SMTP_PASSWORD.trim()
        }
    });

    const message = {
        from: `${process.env.SMTP_FROM_NAME?.trim() || 'Pastry Shop'} <${process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_EMAIL.trim()}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || `<p>${options.message}</p>`,
        attachments: options.attachments || []
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;