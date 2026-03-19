const logger = require('../utils/logger');

const verifyCloudflareTurnstile = async (req, res, next) => {
  if (process.env.TURNSTILE_SKIP_VERIFY === 'true') return next();

  const token = req.body.cfTurnstileToken;
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;


  if (!secret) {
    logger.warn('Cloudflare Turnstile: Secret key not configured. Skipping verification.');
    return next();
  }

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Cloudflare verification token is required.',
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secret);
    formData.append('response', token);
    formData.append('remoteip', req.ip);

    const result = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await result.json();

    if (!data.success) {
      logger.warn(`Cloudflare Turnstile verification failed: ${JSON.stringify(data['error-codes'])}`);
      return res.status(400).json({
        success: false,
        message: 'Cloudflare verification failed. Please try again.',
      });
    }

    next();
  } catch (error) {
    logger.error(`Cloudflare Turnstile error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Verification service unavailable. Please try again later.',
    });
  }
};

module.exports = { verifyCloudflareTurnstile };
