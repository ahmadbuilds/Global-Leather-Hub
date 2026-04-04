const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { getStripe, amountToStripeUnit } = require('../utils/stripeClient');

const priceForQuantity = (product, quantity) => {
  if (!product?.pricingTiers?.length) return 0;
  const tier = product.pricingTiers.find(
    (t) => quantity >= t.minQuantity && (t.maxQuantity == null || quantity <= t.maxQuantity)
  );
  return (tier || product.pricingTiers[0]).pricePerUnit;
};

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name pricingTiers moq status');
    const totalAmount = cart ? cart.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0) : 0;

    res.status(200).json({
      success: true,
      data: {
        items: cart?.items || [],
        totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }

    const product = await Product.findOne({ _id: productId, status: 'active' }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not active' });
    }

    const minQty = Math.max(1, Number(product.moq) || 1);
    if (qty < minQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for this product is ${minQty}`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += qty;
      if (cart.items[existingIndex].quantity < minQty) {
        cart.items[existingIndex].quantity = minQty;
      }
    } else {
      cart.items.push({
        product: product._id,
        productName: product.name,
        quantity: qty,
        pricePerUnit: product.pricingTiers?.[0]?.pricePerUnit ?? 0,
      });
    }

    await cart.save();

    const totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: {
        items: cart.items,
        totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/cart/item/:productId
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    let { quantity } = req.body;

    quantity = Number(quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a non-negative number' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex < 0) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    const product = await Product.findById(productId).lean();
    const minQty = Math.max(1, Number(product?.moq) || 1);

    if (quantity > 0 && quantity < minQty) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity for this product is ${minQty}`,
      });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    const totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: {
        items: cart.items,
        totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/checkout-session — Stripe Checkout (wholesale + international currency)
const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payments are not configured. Set STRIPE_SECRET_KEY on the server.',
      });
    }

    const { shippingDetails, shippingProfileId, notes } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name pricingTiers moq status'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let selectedShippingDetails = shippingDetails;
    if (shippingProfileId) {
      const userDoc = await User.findById(req.user._id).lean();
      const profile = userDoc.shippingProfiles.find((p) => p._id.toString() === shippingProfileId);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Shipping profile not found' });
      }
      selectedShippingDetails = {
        fullName: profile.fullName,
        company: profile.company,
        address: profile.address,
        city: profile.city,
        country: profile.country,
        postalCode: profile.postalCode,
        phone: profile.phone,
      };
    }

    if (
      !selectedShippingDetails ||
      !selectedShippingDetails.fullName ||
      !selectedShippingDetails.address ||
      !selectedShippingDetails.city ||
      !selectedShippingDetails.country ||
      !selectedShippingDetails.phone
    ) {
      return res.status(400).json({ success: false, message: 'Shipping details are required' });
    }

    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';

    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const p = item.product;
      if (!p || p.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: `Product "${item.productName}" is no longer available. Remove it from your cart.`,
        });
      }
      const minQty = Math.max(1, Number(p.moq) || 1);
      if (item.quantity < minQty) {
        return res.status(400).json({
          success: false,
          message: `Quantity for "${item.productName}" is below the minimum (${minQty}).`,
        });
      }
      const unitPrice = priceForQuantity(p, item.quantity);
      if (unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid pricing for "${item.productName}".`,
        });
      }
      const productRef = item.product._id || item.product;
      orderItems.push({
        product: productRef,
        productName: p.name,
        quantity: item.quantity,
        pricePerUnit: unitPrice,
      });
      totalAmount += item.quantity * unitPrice;
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingDetails: selectedShippingDetails,
      totalAmount,
      notes,
      currency,
      paymentStatus: 'unpaid',
      paymentMethod: 'stripe',
    });

    await order.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const lineItems = orderItems.map((item) => ({
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `${item.productName} (×${item.quantity})`,
        },
        unit_amount: amountToStripeUnit(item.pricePerUnit * item.quantity, currency),
      },
      quantity: 1,
    }));

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems,
        success_url: `${clientUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/cart?checkout=cancelled`,
        client_reference_id: order._id.toString(),
        metadata: {
          orderId: order._id.toString(),
          userId: req.user._id.toString(),
        },
        payment_intent_data: {
          metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
        },
      });

      order.stripeCheckoutSessionId = session.id;
      await order.save();

      cart.items = [];
      await cart.save();

      res.status(200).json({
        success: true,
        message: 'Redirect to Stripe to complete payment.',
        data: {
          url: session.url,
          sessionId: session.id,
          orderId: order._id,
        },
      });
    } catch (stripeErr) {
      await Order.findByIdAndDelete(order._id);
      throw stripeErr;
    }
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/item/:productId
const removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();

    const totalAmount = cart.items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: { items: cart.items, totalAmount },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: { items: cart.items, totalAmount: 0 },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createStripeCheckoutSession,
};
