const Joi = require("joi");

// Define the validation schema for categories
const categoryValidation = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": "Category name must be a string",
    "string.min": "Category name must be at least 3 characters long",
    "string.max": "Category name must be at most 50 characters long",
    "any.required": "Category name is required",
  }),
});

module.exports = { categoryValidation };
