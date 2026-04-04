const User = require('../models/User');
const Order = require('../models/Order');
const { generateOTP, getOTPExpiry } = require('../utils/otp');
const { sendOTPEmail } = require('../utils/email');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');


// GET /api/users/me
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};


//PATCH /api/users/me/username
const updateUsername = async (req, res, next) => {
  try {
    const { username } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { username },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Username updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};


//POST /api/users/me/request-password-change
const requestPasswordChange = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.otp = {
      code: otp,
      expiresAt: otpExpiry,
      purpose: 'password_change',
    };
    await user.save();

    await sendOTPEmail(user.email, otp, 'password_change');

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${user.email}.`,
    });
  } catch (error) {
    next(error);
  }
};


// PATCH /api/users/me/change-password
const changePassword = async (req, res, next) => {
  try {
    const { otp, password } = req.body;

    const user = await User.findById(req.user._id).select('+otp.code +otp.expiresAt +otp.purpose');

    if (!user.otp || !user.otp.code || user.otp.purpose !== 'password_change') {
      return res.status(400).json({
        success: false,
        message: 'No pending password change request. Please request a verification code first.',
      });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    if (user.otp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.',
      });
    }

    user.password = password;
    user.otp = undefined;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};


// PATCH /api/users/me/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['company', 'country', 'phone'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};


// PATCH /api/users/me/avatar
const uploadProfileAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profile image is required.',
      });
    }

    const existingUser = await User.findById(req.user._id).select('+avatarPublicId');

    const uploadResult = await uploadBufferToCloudinary(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || 'global-leather-hub/avatars',
      public_id: `avatar_${req.user._id}_${Date.now()}`,
      resource_type: 'image',
      overwrite: true,
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: uploadResult.secure_url,
        avatarPublicId: uploadResult.public_id,
      },
      { new: true, runValidators: true }
    );

    if (existingUser?.avatarPublicId && existingUser.avatarPublicId !== uploadResult.public_id) {
      try {
        await deleteFromCloudinary(existingUser.avatarPublicId);
      } catch (deleteError) {
        logger.warn(`Old avatar cleanup failed for user ${req.user._id}: ${deleteError.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile image updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/preferred-currency
const updatePreferredCurrency = async (req, res, next) => {
  try {
    const { preferredCurrency } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredCurrency },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Preferred currency updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/me/shipping-profiles
const addShippingProfile = async (req, res, next) => {
  try {
    const { name, fullName, company, address, city, country, postalCode, phone, isDefault } = req.body;

    const user = await User.findById(req.user._id);
    const newProfile = { name, fullName, company, address, city, country, postalCode, phone, isDefault };

    if (isDefault) {
      user.shippingProfiles.forEach((p) => {
        p.isDefault = false;
      });
    }

    user.shippingProfiles.push(newProfile);

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Shipping profile added successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me/shipping-profiles/:profileId
const updateShippingProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const updates = req.body;

    const user = await User.findById(req.user._id);
    const profile = user.shippingProfiles.id(profileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Shipping profile not found.' });
    }

    Object.assign(profile, updates);

    if (updates.isDefault) {
      user.shippingProfiles.forEach((p) => {
        if (p._id.toString() !== profileId.toString()) {
          p.isDefault = false;
        }
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Shipping profile updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me/shipping-profiles/:profileId
const deleteShippingProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    const user = await User.findById(req.user._id);
    const profile = user.shippingProfiles.id(profileId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Shipping profile not found.' });
    }

    profile.remove();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Shipping profile removed.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me/orders
const getUserOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('items.product', 'name images')
        .lean(),
      Order.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          pages: totalPages,
          total,
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me/orders/:id
const getUserOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    }).populate('items.product', 'name images description');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateUsername,
  requestPasswordChange,
  changePassword,
  updateProfile,
  uploadProfileAvatar,
  updatePreferredCurrency,
  addShippingProfile,
  updateShippingProfile,
  deleteShippingProfile,
  getUserOrders,
  getUserOrderById,
};
