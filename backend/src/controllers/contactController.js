const { sendContactEmail } = require('../utils/email');
const logger = require('../utils/logger');

// POST /api/contact
const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, company, country, inquiryType, message } = req.body;

    if (!name || !email || !inquiryType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, inquiry type, and message are required fields.',
      });
    }

    // Call the email utility to send it directly to crisitiano678@gmail.com
    await sendContactEmail({
      name,
      email,
      company,
      country,
      inquiryType,
      message,
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully. Our team will contact you shortly.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitContactForm,
};
