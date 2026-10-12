/**
 * validate(schema) — Zod validation middleware.
 * Runs schema.safeParse(req.body); on failure returns 422
 * with { errors: [{ field, message }] }.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.') || 'body',
        message: err.message,
      }));
      return res.status(422).json({ message: 'Validation failed.', errors });
    }

    // Replace req.body with the parsed/coerced data from Zod
    req.body = result.data;
    next();
  };
};

module.exports = { validate };
