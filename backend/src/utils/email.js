const nodemailer = require('nodemailer');
const logger = require('./logger');
const User = require('../models/User');

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


const sendOrderStatusEmail = async (userOrUserId, subjectShort, order) => {
  const transporter = createTransporter();

  // resolve user email
  let toEmail = null;
  if (typeof userOrUserId === 'string') {
    const possibleEmail = String(userOrUserId).trim();
    if (possibleEmail.includes('@')) {
      toEmail = possibleEmail;
    } else {
      const user = await User.findById(possibleEmail).select('email').lean();
      toEmail = user?.email || null;
    }
  } else if (userOrUserId && userOrUserId.email) {
    toEmail = userOrUserId.email;
  } else if (order && order.user && order.user.email) {
    toEmail = order.user.email;
  }

  if (!toEmail) {
    logger.error(`No recipient email for order notification. userOrUserId: ${JSON.stringify(userOrUserId)}`);
    throw new Error('No recipient email for order notification');
  }

  logger.info(`Preparing to send order status email to ${toEmail} for status: ${subjectShort}`);

  const statusLower = String(subjectShort).toLowerCase();
  
  const subject =
    statusLower === 'confirmed' || statusLower === 'payment success'
      ? 'Order Confirmed - Global Leather Hub'
      : statusLower === 'processing'
      ? 'Order Processing - Global Leather Hub'
      : statusLower === 'shipped'
      ? 'Order Shipped - Global Leather Hub'
      : statusLower === 'delivered'
      ? 'Order Delivered - Global Leather Hub'
      : statusLower === 'cancelled'
      ? 'Order Cancelled - Global Leather Hub'
      : `Order Update - Global Leather Hub`;

  const statusTitle =
    statusLower === 'confirmed' || statusLower === 'payment success'
      ? 'Order Confirmed'
      : statusLower === 'processing'
      ? 'Order Being Processed'
      : statusLower === 'shipped'
      ? 'Order Shipped'
      : statusLower === 'delivered'
      ? 'Order Delivered'
      : statusLower === 'cancelled'
      ? 'Order Cancelled'
      : 'Order Status Updated';

  const statusMessage =
    statusLower === 'confirmed' || statusLower === 'payment success'
      ? 'Thank you for your payment! Your order has been confirmed and will be processed soon.'
      : statusLower === 'processing'
      ? 'Your order is currently being processed and prepared for shipment.'
      : statusLower === 'shipped'
      ? 'Your order has been shipped and is on its way to you.'
      : statusLower === 'delivered'
      ? 'Your order has been successfully delivered. Thank you for your purchase!'
      : statusLower === 'cancelled'
      ? 'Your order has been cancelled. If you have any questions, please contact our support team at <a href="mailto:crisitiano678@gmail.com" style="color:#8B4513;text-decoration:none;font-weight:600;">crisitiano678@gmail.com</a>'
      : 'Your order status has been updated.';

  const statusIcon =
    statusLower === 'confirmed' || statusLower === 'payment success'
      ? '✓'
      : statusLower === 'processing'
      ? '⚙'
      : statusLower === 'shipped'
      ? '🚚'
      : statusLower === 'delivered'
      ? '✓'
      : statusLower === 'cancelled'
      ? '✕'
      : '📦';

  const statusColor =
    statusLower === 'confirmed' || statusLower === 'payment success'
      ? '#10b981'
      : statusLower === 'processing'
      ? '#a855f7'
      : statusLower === 'shipped'
      ? '#06b6d4'
      : statusLower === 'delivered'
      ? '#10b981'
      : statusLower === 'cancelled'
      ? '#ef4444'
      : '#D4AF37';

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
                  <!-- Status Badge -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding:0 0 24px;">
                        <div style="background:${statusColor};color:#ffffff;border-radius:24px;padding:8px 24px;display:inline-block;font-size:14px;font-weight:600;letter-spacing:0.5px;">
                          ${statusIcon} ${statusTitle.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="color:#555;font-size:16px;line-height:1.6;margin:0 0 32px;">
                    ${statusMessage}
                  </p>
                  
                  <!-- Order Details Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f0e3;border-radius:8px;overflow:hidden;margin:0 0 24px;">
                    <tr>
                      <td style="padding:24px;">
                        <h3 style="color:#8B4513;margin:0 0 16px;font-size:16px;letter-spacing:0.5px;">ORDER DETAILS</h3>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:8px 0;color:#555;font-size:14px;">Order Number:</td>
                            <td align="right" style="padding:8px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${order.orderNumber || order._id}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0;color:#555;font-size:14px;">Status:</td>
                            <td align="right" style="padding:8px 0;color:#1a1a1a;font-size:14px;font-weight:600;">${statusLower.charAt(0).toUpperCase() + statusLower.slice(1)}</td>
                          </tr>
                          <tr>
                            <td style="padding:8px 0;color:#555;font-size:14px;">Total Amount:</td>
                            <td align="right" style="padding:8px 0;color:#8B4513;font-size:16px;font-weight:700;">${order.paid_amount || order.totalAmount} ${order.currency_used || order.currency || 'USD'}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  ${order.shippingAddress ? `
                  <!-- Shipping Address -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;padding-top:24px;">
                    <tr>
                      <td>
                        <h3 style="color:#8B4513;margin:0 0 12px;font-size:14px;letter-spacing:0.5px;">SHIPPING ADDRESS</h3>
                        <p style="color:#555;font-size:14px;line-height:1.6;margin:0;">
                          ${order.shippingAddress.fullName || ''}<br/>
                          ${order.shippingAddress.address || ''}<br/>
                          ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.postalCode || ''}<br/>
                          ${order.shippingAddress.country || ''}
                        </p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  ${statusLower === 'shipped' && order.tracking?.number ? `
                  <!-- Tracking Info -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                    <tr>
                      <td align="center" style="padding:20px;background:#f0f9ff;border-radius:8px;">
                        <p style="color:#555;font-size:13px;margin:0 0 8px;">Tracking Number</p>
                        <p style="color:#1a1a1a;font-size:18px;font-weight:700;margin:0;font-family:monospace;">${order.tracking.number}</p>
                        ${order.tracking.carrier ? `<p style="color:#888;font-size:12px;margin:8px 0 0;">${order.tracking.carrier}</p>` : ''}
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  <p style="color:#888;font-size:13px;margin:32px 0 0;line-height:1.6;">
                    If you have any questions about your order, please don't hesitate to contact our support team.
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
      to: toEmail,
      subject,
      html,
    });
    logger.info(`Order email (${subjectShort}) sent to ${toEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send order email to ${toEmail}: ${error.message}`);
    throw new Error('Failed to send order notification');
  }
};

module.exports = { sendOTPEmail, sendContactEmail, sendOrderStatusEmail };
