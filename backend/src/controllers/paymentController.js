const Order = require('../models/Order');
const logger = require('../utils/logger');
const { getStripe } = require('../utils/stripeClient');

const markOrderPaidIfNeeded = async (orderId, session) => {
  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus === 'paid') {
    return order;
  }
  if (order.status === 'cancelled') {
    logger.warn(`Stripe payment received for cancelled order ${order.orderNumber}`);
    return order;
  }

  const pi = session.payment_intent;
  const piId = typeof pi === 'string' ? pi : pi?.id;

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.paidAt = new Date();
  if (piId) order.stripePaymentIntentId = piId;
  await order.save();
  logger.info(`Order ${order.orderNumber} marked paid (Stripe session ${session.id})`);
  return order;
};

/**
 * Stripe webhook — must use raw body (configured in app.js).
 */
const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !whSecret) {
    return res.status(503).send('Stripe not configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
  } catch (err) {
    logger.warn(`Stripe webhook signature: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (orderId && session.payment_status === 'paid') {
        await markOrderPaidIfNeeded(orderId, session);
      }
    }
  } catch (e) {
    logger.error(`Stripe webhook handler: ${e.message}`);
    return res.status(500).json({ received: false });
  }

  res.json({ received: true });
};

/**
 * After redirect from Stripe — confirms payment if webhook is delayed.
 */
const verifyCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Payments are not configured.' });
    }

    const sessionId = req.query.session_id;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'session_id is required.' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const orderId = session.metadata?.orderId || session.client_reference_id;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Invalid checkout session.' });
    }

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (session.payment_status === 'paid') {
      await markOrderPaidIfNeeded(orderId, session);
    }

    const fresh = await Order.findById(orderId).populate('items.product', 'name images description');
    res.status(200).json({
      success: true,
      data: {
        order: fresh,
        paymentStatus: session.payment_status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  stripeWebhook,
  verifyCheckoutSession,
  markOrderPaidIfNeeded,
};
