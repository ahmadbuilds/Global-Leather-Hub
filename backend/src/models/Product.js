const mongoose = require('mongoose');

const pricingTierSchema = new mongoose.Schema(
  {
    minQuantity: {
      type: Number,
      required: [true, 'Minimum quantity is required'],
      min: [1, 'Minimum quantity must be at least 1'],
    },
    maxQuantity: {
      type: Number,
      default: null,
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0.01, 'Price must be greater than 0'],
    },
  },
  { _id: false }
);

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['leather-jackets', 'leather-belts', 'leather-wallets'],
        message: 'Category must be leather-jackets, leather-belts, or leather-wallets',
      },
    },
    images: {
      type: [productImageSchema],
      validate: {
        validator: function (v) {
          return v.length <= 5;
        },
        message: 'A product can have at most 5 images',
      },
    },
    pricingTiers: {
      type: [pricingTierSchema],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: 'At least one pricing tier is required',
      },
    },
    moq: {
      type: Number,
      required: [true, 'Minimum order quantity is required'],
      min: [1, 'MOQ must be at least 1'],
    },
    
    specifications: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        _id: false,
      },
    ],
    availableSizes: {
      type: [String],
      default: [],
    },
    availableColors: {
      type: [String],
      default: [],
    },
    material: {
      type: String,
      trim: true,
      maxlength: [300, 'Material field cannot exceed 300 characters'],
    },
    fit: {
      type: String,
      trim: true,
      maxlength: [200, 'Fit field cannot exceed 200 characters'],
    },
    highlights: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length <= 10;
        },
        message: 'A product can have at most 10 highlights',
      },
    },
    
    status: {
      type: String,
      enum: {
        values: ['active', 'draft', 'archived'],
        message: 'Status must be active, draft, or archived',
      },
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for filtering and search
productSchema.index({ category: 1, status: 1 });
productSchema.index({ name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
