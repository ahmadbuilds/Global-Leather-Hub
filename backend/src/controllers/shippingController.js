const User = require('../models/User');
const logger = require('../utils/logger');
const { validateShippingAddress } = require('../utils/shippingValidation');

let countriesCache = null;
let countriesCacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;


//GET /api/shipping/countries
const getCountries = async (req, res, next) => {
  try {
    const now = Date.now();
    if (countriesCache && now - countriesCacheTime < CACHE_TTL) {
      return res.status(200).json({ success: true, data: countriesCache });
    }

    let countries;
    try {
      const response = await fetch(
        'https://restcountries.com/v3.1/all?fields=name,cca2,flags,idd'
      );
      if (!response.ok) throw new Error(`API ${response.status}`);
      const raw = await response.json();

      countries = raw
        .map((c) => {
          const code = c.cca2;
          const dialCode = DIAL_CODES[code] || (c.idd?.root ? `${c.idd.root}${(c.idd.suffixes || [])[0] || ''}`.replace(/\+/g, '') : '');
          return {
            name: c.name?.common || '',
            code,
            flag: c.flags?.svg || c.flags?.png || '',
            flagEmoji: c.flag || '',
            dialCode: dialCode ? `+${dialCode.replace(/^\+/, '')}` : '',
          };
        })
        .filter((c) => c.name && c.code)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (apiErr) {
      logger.warn(`REST Countries API failed: ${apiErr.message}. Using fallback.`);
      countries = Object.entries(DIAL_CODES)
        .map(([code, dial]) => ({
          name: code,
          code,
          flag: '',
          flagEmoji: '',
          dialCode: `+${dial.replace(/^\+/, '')}`,
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    }

    countriesCache = countries;
    countriesCacheTime = now;

    res.status(200).json({ success: true, data: countries });
  } catch (error) {
    next(error);
  }
};


//POST /api/shipping/validate
const validateShipping = async (req, res, next) => {
  try {
    const { errors } = validateShippingAddress(req.body);

    if (errors.length > 0) {
      return res.status(400).json({ success: false, valid: false, errors });
    }

    res.status(200).json({ success: true, valid: true });
  } catch (error) {
    next(error);
  }
};


//POST /api/shipping/save
const saveShippingAddress = async (req, res, next) => {
  try {
    const { errors, shippingAddress } = validateShippingAddress(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    if (
      (shippingAddress.latitude === undefined || shippingAddress.longitude === undefined) &&
      (shippingAddress.address || shippingAddress.city || shippingAddress.state || shippingAddress.postalCode || shippingAddress.country)
    ) {
      try {
        const parts = [
          shippingAddress.address,
          shippingAddress.city,
          shippingAddress.state,
          shippingAddress.postalCode,
          shippingAddress.country,
        ]
          .filter(Boolean)
          .join(', ');

        if (parts) {
          const resGeo = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parts)}&format=json&limit=1&addressdetails=0`,
          );
          const geo = await resGeo.json();
          if (geo && geo.length > 0) {
            shippingAddress.latitude = Number.parseFloat(geo[0].lat);
            shippingAddress.longitude = Number.parseFloat(geo[0].lon);
          }
        }
      } catch (e) {
        logger.warn(`Geocoding failed when saving shipping address for user ${req.user._id}: ${e.message}`);
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { shippingAddress },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Shipping address saved successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCountries, validateShipping, saveShippingAddress };
