const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price_usd: {
      type: Number,
      required: [true, 'Price per unit in USD is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
  },
  { _id: false }
);

const shippingDetailsSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: 'Order must have at least one item',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        message: 'Invalid order status',
      },
      default: 'pending',
    },
    shippingDetails: {
      type: shippingDetailsSchema,
      required: [true, 'Shipping details are required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CNY', 'PKR', 'AED'],
      default: 'USD',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
    },
    paymentMethod: {
      type: String,
      default: 'stripe',
    },
    stripeCheckoutSessionId: {
      type: String,
      sparse: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    tracking: {
      carrier: { type: String, trim: true },
      number: { type: String, trim: true },
      url: { type: String, trim: true },
      updatedAt: { type: Date },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const timestamp = Date.now().toString(36).toUpperCase();
    this.orderNumber = `GLH-${String(count + 1).padStart(5, '0')}-${timestamp}`;
  }
  next();
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
