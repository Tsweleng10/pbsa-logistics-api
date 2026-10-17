// middleware/validate.js
// Joi-based input validation for request bodies

/**
 * Wraps a Joi schema as Express middleware.
 * Usage: router.post('/register', validate(schemas.register), handler);
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // collect ALL errors, not just the first
      stripUnknown: true   // remove fields not in schema (prevents injection of extra fields)
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Replace body with the sanitised, validated version
    req.body = value;
    next();
  };
}

module.exports = { validate };