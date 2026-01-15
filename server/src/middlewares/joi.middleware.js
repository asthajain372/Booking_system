exports.validate = (schema) => (req, res, next) => {
  const validations = [];

  if (schema.body) {
    validations.push(schema.body.validateAsync(req.body));
  }

  if (schema.params) {
    validations.push(schema.params.validateAsync(req.params));
  }

  if (schema.query) {
    validations.push(schema.query.validateAsync(req.query));
  }

  Promise.all(validations)
    .then(() => next())
    .catch((error) => {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    });
};
