const express = require('express');
const router = express.Router();

const { getProducts, getProductById } = require('../controllers/productController');

// Public product routes (no auth required)
router.get('/', getProducts);
router.get('/:id', getProductById);

module.exports = router;
