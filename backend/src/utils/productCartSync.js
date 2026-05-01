const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const logger = require('./logger');
const { getStripe } = require('./stripeClient');
const { getPriceForQuantity } = require('./pricingTiers');

//Remove a product line from every user's cart. 
const removeProductFromAllCarts = async (productId) => {
  await Cart.updateMany({ 'items.product': productId }, { $pull: { items: { product: productId } } });
};

const reconcileCartsForProduct = async (productId) => {
  const product = await Product.findById(productId).lean();
  if (!product) return;

  const carts = await Cart.find({ 'items.product': productId });
  for (const cart of carts) {
    let changed = false;
    const nextItems = [];
    for (const item of cart.items) {
      if (item.product.toString() !== productId.toString()) {
        nextItems.push(item);
        continue;
      }
      if (product.status !== 'active') {
        changed = true;
        continue;
      }
      const minQty = Math.max(1, Number(product.moq) || 1);
      if (item.quantity < minQty) {
        changed = true;
        continue;
      }
      const newPrice = getPriceForQuantity(product, item.quantity);
      if (newPrice <= 0) {
        changed = true;
        continue;
      }
      if (item.price_usd !== newPrice) {
        item.price_usd = newPrice;
        changed = true;
      }
      if (item.productName !== product.name) {
        item.productName = product.name;
        changed = true;
      }
      nextItems.push(item);
    }
    if (changed || nextItems.length !== cart.items.length) {
      cart.items = nextItems;
      await cart.save();
    }
  }
};

//Cancel unpaid Stripe checkouts that reference a product (admin deleted/edited product).
const cancelUnpaidOrdersContainingProduct = async (productId) => {
  const stripe = getStripe();
  const orders = await Order.find({
    'items.product': productId,
    paymentStatus: 'unpaid',
  });

  for (const order of orders) {
    if (stripe && order.stripeCheckoutSessionId) {
      try {
        await stripe.checkout.sessions.expire(order.stripeCheckoutSessionId);
      } catch (e) {
        logger.warn(`Could not expire Stripe session ${order.stripeCheckoutSessionId}: ${e.message}`);
      }
    }
    order.status = 'cancelled';
    order.paymentStatus = 'failed';
    await order.save();
  }

  if (orders.length) {
    logger.info(`Cancelled ${orders.length} unpaid order(s) affected by product ${productId}`);
  }
};

module.exports = {
  removeProductFromAllCarts,
  reconcileCartsForProduct,
  cancelUnpaidOrdersContainingProduct,
};
