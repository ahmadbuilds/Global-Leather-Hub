const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { getStripe, amountToStripeUnit } = require('../utils/stripeClient');
const { getPriceForQuantity } = require('../utils/pricingTiers');
const { validateShippingAddress } = require('../utils/shippingValidation');

const CART_PRODUCT_FIELDS = 'name pricingTiers moq status images';

const populateCartProducts = async (cart) => {
  if (!cart) return cart;
  await cart.populate('items.product', CART_PRODUCT_FIELDS);
  return cart;
};

// Helper to format cart response
const formatCartResponse = async (cart, currency) => {
  const currencyService = require('../services/CurrencyService');
  let totalAmount = 0;
  const itemsRaw = cart
    ? cart.items.map((item) => (item.toObject ? item.toObject() : item))
    : [];

  const productMap = new Map();
  const missingIds = new Set();

  itemsRaw.forEach((obj) => {
    const product = obj.product;
    if (product && typeof product === 'object' && product._id) {
      productMap.set(String(product._id), product);
    } else if (product) {
      missingIds.add(String(product));
    }
  });

  if (missingIds.size > 0) {
    const products = await Product.find({
      _id: { $in: Array.from(missingIds) },
    })
      .select(CART_PRODUCT_FIELDS)
      .lean();
    products.forEach((product) => {
      productMap.set(String(product._id), product);
    });
  }

  const items = itemsRaw.map((obj) => {
    const productRef =
      obj.product && typeof obj.product === 'object' && obj.product._id
        ? obj.product._id
        : obj.product;
    const productKey = productRef ? String(productRef) : null;
    const product = productKey ? productMap.get(productKey) : null;
    const convertedPrice = currencyService.convert(obj.price_usd, currency);
    totalAmount += obj.quantity * convertedPrice;
    return {
      ...obj,
      product: product || obj.product,
      productId: product?._id || productRef,
      productName: product?.name || obj.productName,
      productImage: product?.images?.[0]?.url || obj.productImage,
      price: convertedPrice,
      currency,
    };
  });

  return { items, totalAmount, currency };
};

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    await populateCartProducts(cart);
    
    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';

    const cartResponse = await formatCartResponse(cart, currency);
    res.status(200).json({
      success: true,
      data: cartResponse,
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
      cart.items[existingIndex].price_usd = getPriceForQuantity(
        product,
        cart.items[existingIndex].quantity
      );
    } else {
      const unitPrice = getPriceForQuantity(product, qty);
      cart.items.push({
        product: product._id,
        productName: product.name,
        quantity: qty,
        price_usd: unitPrice,
      });
    }

    await cart.save();
    await populateCartProducts(cart);

    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';

    const cartResponse = await formatCartResponse(cart, currency);
    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cartResponse,
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
      cart.items[itemIndex].price_usd = getPriceForQuantity(product, quantity);
    }

    await cart.save();
    await populateCartProducts(cart);

    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';

    const cartResponse = await formatCartResponse(cart, currency);
    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cartResponse,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/checkout-session
const createStripeCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Payments are not configured. Set STRIPE_SECRET_KEY on the server.',
      });
    }

    const notes = String(req.body.notes || '').trim();
    const { shippingAddress: rawShippingAddress } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      'items.product',
      'name pricingTiers moq status'
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    if (!rawShippingAddress || !rawShippingAddress.country) {
      return res.status(400).json({ success: false, message: 'Shipping address is required' });
    }

    if (notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Delivery instructions cannot exceed 500 characters.',
      });
    }

    const { errors: shippingErrors, shippingAddress } = validateShippingAddress(rawShippingAddress);
    if (shippingErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is invalid',
        errors: shippingErrors,
      });
    }

    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';
    const currencyService = require('../services/CurrencyService');

    const orderItems = [];
    let totalAmountUsd = 0;
    let totalAmountConverted = 0;

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
      const baseUnitPriceUsd = getPriceForQuantity(p, item.quantity);
      if (baseUnitPriceUsd <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid pricing for "${item.productName}".`,
        });
      }
      const unitPriceConverted = currencyService.convert(baseUnitPriceUsd, currency);
      
      const productRef = item.product._id || item.product;
      orderItems.push({
        product: productRef,
        productName: p.name,
        quantity: item.quantity,
        price_usd: baseUnitPriceUsd,
      });
      totalAmountUsd += item.quantity * baseUnitPriceUsd;
      totalAmountConverted += item.quantity * unitPriceConverted;
    }

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: totalAmountUsd,
      base_amount_usd: totalAmountUsd,
      notes,
      shippingAddress,
      currency,
      currency_used: currency,
      exchange_rate_used: currencyService.rates[currency] || 1,
      paymentStatus: 'unpaid',
      paid_amount: 0,
      paymentMethod: 'stripe',
      order_status: 'CREATED',
      paymentMethod: 'stripe',
    });

    await order.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const shippingUsd = Math.max(5, Math.round(totalAmountUsd * 0.05 * 100) / 100);
    const shippingConverted = currencyService.convert(shippingUsd, currency);

    const lineItems = orderItems.map((item, index) => {
      const convertedPrice = currencyService.convert(item.price_usd, currency);
      return {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.productName,
          },
          unit_amount: amountToStripeUnit(convertedPrice, currency),
        },
        quantity: item.quantity,
      };
    });

    const shippingOption = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: amountToStripeUnit(shippingConverted, currency),
          currency: currency.toLowerCase(),
        },
        display_name: 'Shipping',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 3 },
          maximum: { unit: 'business_day', value: 7 },
        },
      },
    };

    // Ensure Stripe Customer exists for this user to lock email in Checkout
    let customerId = null;
    try {
      const existing = await stripe.customers.list({ email: req.user.email, limit: 1 });
      if (existing && existing.data && existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: req.user.email,
          metadata: { userId: req.user._id.toString() },
        });
        customerId = created.id;
      }
    } catch (err) {
      customerId = null;
    }

    try {
      const sessionPayload = {
        mode: 'payment',
        line_items: lineItems,
        shipping_options: [shippingOption],
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
      };

      if (customerId) {
        sessionPayload.customer = customerId; 
      } else {
        sessionPayload.customer_email = req.user.email; 
      }

      const session = await stripe.checkout.sessions.create(sessionPayload);

      order.stripeCheckoutSessionId = session.id;
      // store shipping details in order for accounting
      order.shipping = order.shipping || {};
      order.shipping.amount_usd = shippingUsd;
      order.shipping.currency = currency;
      order.shipping.amount_converted = shippingConverted;
      // update total to include shipping
      order.totalAmount = (order.base_amount_usd || 0) + shippingUsd;
      await order.save();

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
    await populateCartProducts(cart);

    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';

    const cartResponse = await formatCartResponse(cart, currency);
    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cartResponse,
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
    await populateCartProducts(cart);

    const userRow = await User.findById(req.user._id).select('preferredCurrency').lean();
    const currency = userRow?.preferredCurrency || 'USD';

    const cartResponse = await formatCartResponse(cart, currency);
    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cartResponse,
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
