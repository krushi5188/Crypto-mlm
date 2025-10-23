const Joi = require('joi');

// Validation schemas
const schemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    referralCode: Joi.string().pattern(/^ATN-[A-Z0-9]{6}$/).optional()
  }),

  // Instructor adding member (simpler validation for temporary passwords)
  instructorAddMember: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    referralCode: Joi.string().pattern(/^(|ATN-[A-Z0-9]{6})$/).optional()
  }),

  // User login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Profile update
  profileUpdate: Joi.object({
    email: Joi.string().email().optional(),
    username: Joi.string().alphanum().min(3).max(20).optional(),
    currentPassword: Joi.string().when('newPassword', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    newPassword: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
      .optional()
  }),

  // Inject coins
  injectCoins: Joi.object({
    userId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().precision(2).required(),
    note: Joi.string().max(500).optional()
  }),

  // Reset simulation
  reset: Joi.object({
    type: Joi.string().valid('full', 'soft').required(),
    confirm: Joi.boolean().valid(true).required()
  }),

  // Export data
  export: Joi.object({
    exportType: Joi.string().valid('participants', 'transactions', 'network', 'analytics').required(),
    format: Joi.string().valid('csv', 'json').required()
  }),

  // Update config
  updateConfig: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean()
    )
  )
};

// Validate request body against schema
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schemas[schema].validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = { validate };
