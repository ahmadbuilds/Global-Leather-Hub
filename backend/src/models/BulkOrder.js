const mongoose = require('mongoose');

const bulkOrderProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    customizations: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const bulkOrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [bulkOrderProductSchema],
    totalEstimatedValue: {
      type: Number,
      required: true,
      min: [0, 'Estimated value must be non-negative'],
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CNY'],
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'quoted', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    },
    quotationDetails: {
      quotedPrice: Number,
      validUntil: Date,
      terms: String,
      notes: String,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bulkOrderSchema.index({ user: 1, createdAt: -1 });
bulkOrderSchema.index({ status: 1, createdAt: -1 });

const BulkOrder = mongoose.model('BulkOrder', bulkOrderSchema);
module.exports = BulkOrder;