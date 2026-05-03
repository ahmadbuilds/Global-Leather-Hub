const Order = require('../models/Order');
const logger = require('../utils/logger');
const { getStripe } = require('../utils/stripeClient');
const { stripeUnitToAmount } = require('../utils/stripeClient');
const currencyService = require('../services/CurrencyService');
const Cart = require('../models/Cart');
const { sendOTPEmail, sendContactEmail } = require('../utils/email');
const { sendOrderStatusEmail } = require('../utils/email');

const markOrderPaidIfNeeded = async (orderId, session) => {
  const order = await Order.findById(orderId).populate('user', 'email username');
  if (!order) return null;

  if (order.paymentStatus === 'paid' || order.order_status === 'SHIPPING' || order.order_status === 'DELIVERED') {
    return order;
  }

  if (order.status === 'cancelled') {
    logger.warn(`Stripe payment received for cancelled order ${order.orderNumber}`);
    return order;
  }

  const pi = session.payment_intent;
  const piId = typeof pi === 'string' ? pi : pi?.id;

  const paidAmount = stripeUnitToAmount(session.amount_total, session.currency);
  const currencyUsed = (session.currency || order.currency || 'USD').toUpperCase();
  const rate = currencyService.rates[currencyUsed] || 1;

  order.paymentStatus = 'paid';
  order.paidAt = new Date();
  if (piId) {
    order.payment_intent_id = piId;
    order.stripePaymentIntentId = piId;
  }
  order.paid_amount = paidAmount;
  order.currency_used = currencyUsed;
  order.exchange_rate_used = rate;

  const prevStatus = order.order_status || order.status || 'unknown';
  order.order_status = 'CONFIRMED';
  order.status = 'confirmed';

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ from: prevStatus, to: 'CONFIRMED', by: null, at: new Date() });

  await order.save();
  logger.info(`Order ${order.orderNumber} marked paid (Stripe session ${session.id})`);

  try {
    await Cart.findOneAndUpdate({ user: order.user._id || order.user }, { items: [] });
  } catch (e) {
    logger.warn(`Failed to clear cart for user ${order.user}: ${e.message}`);
  }

  // send confirmation email
  try {
    logger.info(`Attempting to send order confirmation email to ${order.user?.email || order.user}`);
    void sendOrderStatusEmail(order.user, 'confirmed', order).catch((e) => {
      logger.error(`Failed to send order confirmation email: ${e.message}`);
    });
    logger.info(`Order confirmation email queued`);
  } catch (e) {
    logger.error(`Failed to send order confirmation email: ${e.message}`);
  }

  return order;
};

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

    const orderForClient = fresh.toObject ? fresh.toObject() : { ...fresh };
    
    if (fresh.paid_amount !== undefined && fresh.paid_amount !== null) {
      orderForClient.totalAmount = Number(fresh.paid_amount) || 0;
      orderForClient.currency = fresh.currency_used || fresh.currency || session.currency || 'USD';
    } else if (fresh.base_amount_usd !== undefined) {
      const base = Number(fresh.base_amount_usd) || 0;
      const shipUsd = Number(fresh.shipping?.amount_usd) || 0;
      orderForClient.totalAmount = base + shipUsd;
      orderForClient.currency = fresh.currency_used || fresh.currency || session.currency || 'USD';
    } else {
      orderForClient.totalAmount = Number(fresh.totalAmount || 0);
      orderForClient.currency = fresh.currency_used || fresh.currency || session.currency || 'USD';
    }

    // Convert item prices for client display
    if (Array.isArray(orderForClient.items)) {
      orderForClient.items = orderForClient.items.map((it) => {
        const priceUsd = Number(it.price_usd) || 0;
        return {
          ...it,
          price: priceUsd,
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: orderForClient,
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
};
