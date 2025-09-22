const Joi = require('joi');

// Flight validation schemas
const flightSchema = Joi.object({
  flight_code: Joi.string().min(2).max(10).required(),
  airline: Joi.string().min(2).max(100).required(),
  departure_airport: Joi.string().min(3).max(10).required(),
  arrival_airport: Joi.string().min(3).max(10).required(),
  departure_city: Joi.string().min(2).max(100).required(),
  arrival_city: Joi.string().min(2).max(100).required(),
  flight_date: Joi.date().min('now').required(),
  departure_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  arrival_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  price: Joi.number().positive().required(),
  total_seats: Joi.number().integer().min(1).max(500).required(),
  status: Joi.string().valid('available', 'booked', 'cancelled').default('available')
});

const bookingSchema = Joi.object({
  flight_id: Joi.number().integer().positive().required(),
  passenger_name: Joi.string().min(2).max(100).required(),
  passenger_email: Joi.string().email().required(),
  passenger_phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(20).required(),
  seat_number: Joi.string().min(1).max(10).required(),
  total_amount: Joi.number().positive().required()
});

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('admin', 'staff').default('staff')
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Query validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Common query schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(100).allow(''),
  sort: Joi.string().valid('id', 'flight_code', 'flight_date', 'price', 'created_at').default('id'),
  order: Joi.string().valid('ASC', 'DESC').default('ASC')
});

const flightQuerySchema = paginationSchema.keys({
  status: Joi.string().valid('available', 'booked', 'cancelled').allow(''),
  date_from: Joi.date().allow(''),
  date_to: Joi.date().allow(''),
  departure_airport: Joi.string().max(10).allow(''),
  arrival_airport: Joi.string().max(10).allow('')
});

module.exports = {
  flightSchema,
  bookingSchema,
  userSchema,
  flightQuerySchema,
  paginationSchema,
  validate,
  validateQuery
};
