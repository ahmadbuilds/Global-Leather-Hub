const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const BulkOrder = require('../models/BulkOrder');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');
const {
  removeProductFromAllCarts,
  reconcileCartsForProduct,
  cancelUnpaidOrdersContainingProduct,
} = require('../utils/productCartSync');


const paidOrderMatch = {
  $or: [{ paymentStatus: 'paid' }, { paymentStatus: { $exists: false } }],
};

// GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalProducts, totalOrders, totalCustomers, recentOrders, ordersByStatus, revenueAgg] =
      await Promise.all([
        Product.countDocuments(),
        Order.countDocuments(),
        User.countDocuments({ role: 'buyer' }),
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'username email')
          .lean(),
        Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Order.aggregate([
          { $match: paidOrderMatch },
          { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
        ]),
      ]);

    const statusCounts = {};
    ordersByStatus.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue,
        recentOrders,
        ordersByStatus: statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard/analytics?period=7d|30d|12w
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const period = req.query.period || '30d';
    const start = new Date();
    if (period === '7d') start.setUTCDate(start.getUTCDate() - 7);
    else if (period === '12w') start.setUTCDate(start.getUTCDate() - 84);
    else start.setUTCDate(start.getUTCDate() - 30);

    const match = {
      createdAt: { $gte: start },
      ...paidOrderMatch,
    };

    const series = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        series: series.map((row) => ({
          date: row._id,
          revenue: row.revenue,
          orders: row.orders,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/admin/products
const getAllProductsAdmin = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username email')
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// Helper to parse JSON fields that may arrive as strings 
const parseJsonField = (value) => {
  if (!value) return undefined;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return undefined; }
  }
  return value;
};

// POST /api/admin/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, moq, status, material, fit } = req.body;

    let pricingTiers = parseJsonField(req.body.pricingTiers);
    const specifications = parseJsonField(req.body.specifications) || [];
    const availableSizes = parseJsonField(req.body.availableSizes) || [];
    const availableColors = parseJsonField(req.body.availableColors) || [];
    const highlights = parseJsonField(req.body.highlights) || [];

    // Upload images to Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 5 images allowed per product.',
        });
      }

      for (const file of req.files) {
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder: process.env.CLOUDINARY_PRODUCT_FOLDER || 'global-leather-hub/products',
          public_id: `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          resource_type: 'image',
        });
        images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      moq: parseInt(moq),
      status: status || 'active',
      pricingTiers,
      images,
      specifications,
      availableSizes,
      availableColors,
      material: material || undefined,
      fit: fit || undefined,
      highlights,
      createdBy: req.user._id,
    });

    logger.info(`Product created: ${product.name} by admin ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const { name, description, category, moq, status, removeImages, material, fit } = req.body;

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (moq !== undefined) product.moq = parseInt(moq);
    if (status !== undefined) product.status = status;
    if (material !== undefined) product.material = material;
    if (fit !== undefined) product.fit = fit;

    if (req.body.pricingTiers) {
      product.pricingTiers = parseJsonField(req.body.pricingTiers) || product.pricingTiers;
    }
    const specs = parseJsonField(req.body.specifications);
    if (specs !== undefined) product.specifications = specs;
    const sizes = parseJsonField(req.body.availableSizes);
    if (sizes !== undefined) product.availableSizes = sizes;
    const colors = parseJsonField(req.body.availableColors);
    if (colors !== undefined) product.availableColors = colors;
    const hl = parseJsonField(req.body.highlights);
    if (hl !== undefined) product.highlights = hl;

    // Remove specified images
    if (removeImages) {
      let imagesToRemove = removeImages;
      if (typeof imagesToRemove === 'string') {
        imagesToRemove = JSON.parse(imagesToRemove);
      }
      for (const publicId of imagesToRemove) {
        try {
          await deleteFromCloudinary(publicId);
        } catch (err) {
          logger.warn(`Failed to delete image ${publicId}: ${err.message}`);
        }
      }
      product.images = product.images.filter(
        (img) => !imagesToRemove.includes(img.publicId)
      );
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const totalImagesAfter = product.images.length + req.files.length;
      if (totalImagesAfter > 5) {
        return res.status(400).json({
          success: false,
          message: `Cannot exceed 5 images. Currently ${product.images.length}, trying to add ${req.files.length}.`,
        });
      }

      for (const file of req.files) {
        const result = await uploadBufferToCloudinary(file.buffer, {
          folder: process.env.CLOUDINARY_PRODUCT_FOLDER || 'global-leather-hub/products',
          public_id: `product_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          resource_type: 'image',
        });
        product.images.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    await product.save();

    await reconcileCartsForProduct(product._id);
    await cancelUnpaidOrdersContainingProduct(product._id);

    logger.info(`Product updated: ${product.name} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      });
    }

    const id = req.params.id;
    await removeProductFromAllCarts(id);
    await cancelUnpaidOrdersContainingProduct(id);
    await BulkOrder.updateMany(
      { 'products.productId': id },
      { $pull: { products: { productId: new mongoose.Types.ObjectId(id) } } }
    );

    // Clean up Cloudinary images
    for (const image of product.images) {
      try {
        await deleteFromCloudinary(image.publicId);
      } catch (err) {
        logger.warn(`Failed to delete image ${image.publicId}: ${err.message}`);
      }
    }

    await Product.findByIdAndDelete(id);

    logger.info(`Product deleted: ${product.name} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.search) {
      filter.$or = [
        { orderNumber: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email company country')
        .populate('items.product', 'name category images')
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'username email company country phone')
      .populate('items.product', 'name category images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    // Prevent invalid status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from '${order.status}' to '${status}'.`,
      });
    }

    if (order.paymentStatus === 'unpaid' && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message:
          'Order is awaiting payment. Cancel it or wait until Stripe marks the order as paid.',
      });
    }

    order.status = status;
    await order.save();

    logger.info(`Order ${order.orderNumber} status updated to ${status} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}'.`,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};


// PATCH /api/admin/orders/:id/tracking — shipment tracking (carrier, number, public URL)
const updateOrderTracking = async (req, res, next) => {
  try {
    const { carrier, number, url } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!number || !String(number).trim()) {
      return res.status(400).json({ success: false, message: 'Tracking number is required.' });
    }

    if (url && url.trim() && !/^https?:\/\//i.test(url.trim())) {
      return res.status(400).json({ success: false, message: 'Tracking URL must start with http:// or https://' });
    }

    order.tracking = {
      carrier: carrier || undefined,
      number: String(number).trim(),
      url: url && String(url).trim() ? String(url).trim() : undefined,
      updatedAt: new Date(),
    };

    await order.save();

    logger.info(`Tracking set for order ${order.orderNumber} by admin ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Tracking information updated.',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/bulk-orders
const getAllBulkOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      BulkOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email company country')
        .lean(),
      BulkOrder.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bulkOrders: orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/bulk-orders/:id
const updateBulkOrder = async (req, res, next) => {
  try {
    const { status, adminNotes, quotationDetails } = req.body;
    const bulkOrder = await BulkOrder.findById(req.params.id);
    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found.' });
    }

    if (status) bulkOrder.status = status;
    if (adminNotes !== undefined) bulkOrder.adminNotes = adminNotes;
    if (quotationDetails && typeof quotationDetails === 'object') {
      bulkOrder.quotationDetails = bulkOrder.quotationDetails || {};
      Object.assign(bulkOrder.quotationDetails, quotationDetails);
    }

    await bulkOrder.save();

    res.status(200).json({
      success: true,
      message: 'Bulk quotation updated.',
      data: { bulkOrder },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/customers
const getAllCustomers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { role: 'buyer' };
    if (req.query.search) {
      filter.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select('username email company country phone avatar isEmailVerified createdAt lastLogin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDashboardAnalytics,
  getAllProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrderTracking,
  getAllBulkOrders,
  updateBulkOrder,
  getAllCustomers,
};
