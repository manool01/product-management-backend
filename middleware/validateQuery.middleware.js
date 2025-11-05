module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { convert: true });
  if (error) {
    return res.status(400).json({ error: error.details[0].message.replace(/"/g, "") });
  }
  req.query = value; // use sanitized values
  next();
};