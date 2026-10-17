// middleware/schemas.js
// Joi schemas for all input validation

const Joi = require('joi');

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
const register = Joi.object({
  full_name: Joi.string().min(2).max(100).required()
    .messages({ 'string.empty': 'Full name is required' }),

  email: Joi.string().email().max(150).required()
    .messages({ 'string.email': 'Please provide a valid email address' }),

  password: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one letter and one number'
    }),

  role: Joi.string().valid('DRIVER', 'DISPATCHER', 'CUSTOMER').default('DRIVER'),

  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,20}$/).optional()
    .messages({ 'string.pattern.base': 'Phone number format is invalid' }),

  license_number: Joi.string().max(50).optional().allow(null, '')
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateSettings = Joi.object({
  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,20}$/).optional(),
  full_name: Joi.string().min(2).max(100).optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided' });

const changePassword = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(100).required()
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least one letter and one number'
    })
});

// ─────────────────────────────────────────────
// LOADS
// ─────────────────────────────────────────────
const createLoad = Joi.object({
  reference: Joi.string().max(50).required(),
  driver_id: Joi.number().integer().positive().optional().allow(null),
  vehicle_id: Joi.number().integer().positive().optional().allow(null),
  origin: Joi.string().max(150).required(),
  destination: Joi.string().max(150).required(),
  cargo_description: Joi.string().max(1000).optional().allow('', null),
  weight_kg: Joi.number().positive().max(100000).optional().allow(null),
  eta: Joi.date().iso().optional().allow(null)
});

const updateLoadStatus = Joi.object({
  status: Joi.string().valid('PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED').required()
});

// ─────────────────────────────────────────────
// ELD
// ─────────────────────────────────────────────
const clockIn = Joi.object({
  load_id: Joi.number().integer().positive().optional().allow(null),
  duty_status: Joi.string().valid('DRIVING', 'ON_DUTY', 'SLEEPER', 'OFF').required(),
  location: Joi.string().max(150).optional().allow('', null)
});

const clockOut = Joi.object({
  notes: Joi.string().max(500).optional().allow('', null)
});

// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────
const createAlert = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  title: Joi.string().max(150).required(),
  message: Joi.string().max(1000).optional().allow('', null),
  severity: Joi.string().valid('INFO', 'WARNING', 'CRITICAL').default('INFO')
});

module.exports = {
  register,
  login,
  updateSettings,
  changePassword,
  createLoad,
  updateLoadStatus,
  clockIn,
  clockOut,
  createAlert
};