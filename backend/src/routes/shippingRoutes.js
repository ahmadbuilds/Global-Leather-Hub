const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getCountries, validateShipping, saveShippingAddress } = require('../controllers/shippingController');

router.get('/countries', getCountries);
router.post('/validate', protect, validateShipping);
router.post('/save', protect, saveShippingAddress);

module.exports = router;
