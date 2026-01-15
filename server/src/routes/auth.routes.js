const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/joi.middleware');
const authValidator = require('../validators/auth.validator');

router.post(
  '/signup',
  validate(authValidator.signupValidator),
  authController.signup
);

router.post(
  '/login',
  validate(authValidator.loginValidator),
  authController.login
);

router.get(
  '/verify-email/:token',
  validate(authValidator.verifyEmailValidator),
  authController.verifyEmail
);

router.post(
  '/forgot-password',
  validate(authValidator.forgotPasswordValidator),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate(authValidator.resetPasswordValidator),
  authController.resetPassword
);

module.exports = router;

// src/routes/auth.routes.js
// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/auth.controller');

// // User registration
// router.post('/signup', authController.signup);

// // User login
// router.post('/login', authController.login);

// // Email verification
// router.get('/verify/:token', authController.verifyEmail);

// // Request password reset
// router.post('/forgot-password', authController.forgotPassword);

// // Reset password
// router.post('/reset-password', authController.resetPassword);

// module.exports = router;