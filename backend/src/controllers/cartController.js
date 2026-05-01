const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { getStripe, amountToStripeUnit } = require('../utils/stripeClient');
const { calculateShippingCost, getShippingRestrictions } = require('../utils/shipping');
const { convertCurrency } = require('../utils/currency');
const { getPriceForQuantity } = require('../utils/pricingTiers');

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

    const restrictions = getShippingRestrictions(selectedShippingDetails.country);
    if (restrictions.restricted) {
      return res.status(400).json({ success: false, message: `Shipping to ${selectedShippingDetails.country} is restricted. ${restrictions.notes}`});
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

    const totalWeightKg = orderItems.reduce((sum, item) => sum + item.quantity, 0); 
    const shippingComputationUsd = calculateShippingCost(selectedShippingDetails.country, totalWeightKg, 'USD');
    const shippingCostUsd = shippingComputationUsd.cost;
    const shippingCostConverted = currencyService.convert(shippingCostUsd, currency);

    let taxRate = 0;
    if (selectedShippingDetails.country === 'United States') taxRate = 0.08; // Example 8% US
    else if (['United Kingdom', 'Germany', 'France', 'Italy'].includes(selectedShippingDetails.country)) taxRate = 0.20; // Example 20% VAT
    
    const taxAmountUsd = Math.round((totalAmountUsd + shippingCostUsd) * taxRate * 100) / 100;
    const taxAmountConverted = currencyService.convert(taxAmountUsd, currency);
    
    totalAmountUsd += shippingCostUsd + taxAmountUsd;
    totalAmountConverted += shippingCostConverted + taxAmountConverted;

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingDetails: selectedShippingDetails,
      totalAmount: totalAmountUsd, // stored in USD
      notes,
      currency, // The currency the user selected to view the order
      paymentStatus: 'unpaid',
      paymentMethod: 'stripe',
    });

    await order.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
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

    if (shippingCostConverted > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Shipping Cost',
          },
          unit_amount: amountToStripeUnit(shippingCostConverted, currency),
        },
        quantity: 1,
      });
    }

    if (taxAmountConverted > 0) {
      lineItems.push({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: 'Estimated Tax / VAT',
          },
          unit_amount: amountToStripeUnit(taxAmountConverted, currency),
        },
        quantity: 1,
      });
    }

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
