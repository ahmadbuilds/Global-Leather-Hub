const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  getProfile,
  updateUsername,
  requestPasswordChange,
  changePassword,
  updateProfile,
  uploadProfileAvatar,
} = require('../controllers/userController');

const {
  updateUsernameValidator,
  changePasswordValidator,
} = require('../validators/authValidators');

const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password change attempts.' },
});

router.use(protect);

router.get('/me', getProfile);
router.patch('/me/username', updateUsernameValidator, validate, updateUsername);
router.patch('/me/profile', updateProfile);
router.patch('/me/avatar', uploadImage.single('avatar'), uploadProfileAvatar);
router.post('/me/request-password-change', passwordChangeLimiter, requestPasswordChange);
router.patch('/me/change-password', passwordChangeLimiter, changePasswordValidator, validate, changePassword);

module.exports = router;
