const Product = require('../models/Product');

// GET /api/products public listing of active products
const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const filter = { status: 'active' };

    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter['pricingTiers.pricePerUnit'] = {};
      if (req.query.minPrice) {
        filter['pricingTiers.pricePerUnit'].$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        filter['pricingTiers.pricePerUnit'].$lte = parseFloat(req.query.maxPrice);
      }
    }

    const sortOptions = {};
    switch (req.query.sort) {
      case 'price-asc':
        sortOptions['pricingTiers.0.pricePerUnit'] = 1;
        break;
      case 'price-desc':
        sortOptions['pricingTiers.0.pricePerUnit'] = -1;
        break;
      case 'name-asc':
        sortOptions.name = 1;
        break;
      case 'name-desc':
        sortOptions.name = -1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(limit).lean(),
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

// GET /api/products/:id — single active product
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      status: 'active',
    }).lean();

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

module.exports = { getProducts, getProductById };
