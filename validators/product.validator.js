const Joi = require("joi");

exports.productCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  price: Joi.number().positive().required(),
  categoryId: Joi.number().integer().required(),
  image: Joi.string().allow("", null),
});


exports.productListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(10),
  sort: Joi.string().valid("asc", "desc").default("asc"),
  search: Joi.string().allow("", null).default(""),
  category: Joi.string().allow("", null).default(""),
});


exports.productRowSchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  price: Joi.number().positive().required(),
  categoryName: Joi.string().trim().min(1).required(),
  image: Joi.string().allow(null, "")
});
