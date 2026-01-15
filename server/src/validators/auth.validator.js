const Joi = require('joi');

/**
 * Signup validation
 */
exports.signupValidator = {
  body: Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required(),

    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required(),

    email: Joi.string()
      .email()
      .lowercase()
      .required(),

    password: Joi.string()
      .min(8)
      .max(30)
      .pattern(
        new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')
      )
      .required()
      .messages({
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
  })
};

/**
 * Login validation
 */
exports.loginValidator = {
  body: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required(),

    password: Joi.string()
      .required()
  })
};

/**
 * Verify email validation
 */
exports.verifyEmailValidator = {
  params: Joi.object({
    token: Joi.string()
      .required()
  })
};

/**
 * Forgot password validation
 */
exports.forgotPasswordValidator = {
  body: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required()
  })
};

/**
 * Reset password validation
 */
exports.resetPasswordValidator = {
  body: Joi.object({
    token: Joi.string()
      .required(),

    newPassword: Joi.string()
      .min(8)
      .max(30)
      .pattern(
        new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)')
      )
      .required()
      .messages({
        'string.pattern.base':
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
  })
};
