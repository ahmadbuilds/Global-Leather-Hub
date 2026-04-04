const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['buyer', 'admin'],
      default: 'buyer',
    },
    // OTP for email verification and password change
    otp: {
      code: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      purpose: {
        type: String,
        enum: ['email_verification', 'password_change'],
        select: false,
      },
    },
    refreshToken: {
      type: String,
      select: false,
    },
    // Profile fields
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String },
    avatarPublicId: { type: String, select: false },
    lastLogin: { type: Date },
    preferredCurrency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CNY'],
      default: 'USD',
    },
    shippingProfiles: [
      {
        name: { type: String, trim: true },
        fullName: { type: String, trim: true },
        company: { type: String, trim: true },
        address: { type: String, trim: true },
        city: { type: String, trim: true },
        country: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        phone: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.refreshToken;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
