const nodemailer = require('nodemailer');
const logger = require('./logger');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendOTPEmail = async (to, otp, purpose = 'verification') => {
  const transporter = createTransporter();

  const subject =
    purpose === 'verification'
      ? 'Verify Your Email - Global Leather Hub'
      : 'Password Change Verification - Global Leather Hub';

  const actionText =
    purpose === 'verification'
      ? 'complete your registration'
      : 'change your password';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a1a 0%,#8B4513 100%);padding:40px 40px 30px;text-align:center;">
                  <h1 style="color:#D4AF37;margin:0;font-size:28px;letter-spacing:2px;">GLOBAL LEATHER HUB</h1>
                  <p style="color:#c8a96e;margin:8px 0 0;font-size:13px;letter-spacing:1px;">PREMIUM WHOLESALE LEATHER</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <h2 style="color:#1a1a1a;margin:0 0 16px;font-size:22px;">Verification Code</h2>
                  <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                    Use the code below to ${actionText}. This code expires in <strong>10 minutes</strong>.
                  </p>
                  <!-- OTP Box -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:20px 0;">
                        <div style="background:#f8f0e3;border:2px dashed #D4AF37;border-radius:8px;padding:24px 40px;display:inline-block;">
                          <span style="font-size:42px;font-weight:bold;letter-spacing:12px;color:#8B4513;font-family:monospace;">${otp}</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#888;font-size:13px;margin:24px 0 0;line-height:1.6;">
                    If you did not request this code, please ignore this email. Your account remains secure.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #eee;text-align:center;">
                  <p style="color:#aaa;font-size:12px;margin:0;">
                    &copy; ${new Date().getFullYear()} Global Leather Hub. All rights reserved.<br/>
                    Premium Wholesale Leather Products Worldwide
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    logger.info(`OTP email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send OTP email to ${to}: ${error.message}`);
    throw new Error('Failed to send verification email');
  }
};

const sendContactEmail = async (formData) => {
  const transporter = createTransporter();
  const { name, email, company, country, inquiryType, message } = formData;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>New Contact Form Submission</title>
    </head>
    <body style="margin:0;padding:20px;font-family:Arial,sans-serif;background-color:#f4f4f4;">
      <div style="max-w:600px;margin:0 auto;background:#fff;padding:30px;border-radius:8px;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
        <h2 style="color:#1a1a1a;border-bottom:2px solid #D4AF37;padding-bottom:10px;">New Contact Inquiry</h2>
        <table width="100%" cellpadding="10" cellspacing="0" style="margin-top:20px;">
          <tr><td width="30%"><strong>Name:</strong></td><td>${name}</td></tr>
          <tr style="background:#f9f9f9;"><td width="30%"><strong>Email:</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td width="30%"><strong>Company:</strong></td><td>${company || 'N/A'}</td></tr>
          <tr style="background:#f9f9f9;"><td width="30%"><strong>Country:</strong></td><td>${country || 'N/A'}</td></tr>
          <tr><td width="30%"><strong>Inquiry Type:</strong></td><td>${inquiryType}</td></tr>
        </table>
        <h3 style="margin-top:30px;color:#1a1a1a;">Message:</h3>
        <div style="background:#f9f9f9;padding:15px;border-left:4px solid #D4AF37;line-height:1.6;color:#555;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Global Leather Hub" <${process.env.FROM_EMAIL}>`,
      to: 'crisitiano678@gmail.com',
      replyTo: email,
      subject: `Direct Inquiry: ${inquiryType} - ${name}`,
      html,
    });
    logger.info(`Contact email sent directly to crisitiano678@gmail.com: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send contact email: ${error.message}`);
    throw new Error('Failed to deliver the contact email directly.');
  }
};

module.exports = { sendOTPEmail, sendContactEmail };
