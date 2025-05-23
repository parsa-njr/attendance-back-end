const Joi = require("joi");

// Signup Validation Schema
const signupValidation = Joi.object({
  name: Joi.string().min(3).max(30).required().messages({
    "string.base": "Username must be a string.",
    "string.empty": "Username cannot be empty.",
    "string.min": "Username must be at least 3 characters long.",
    "string.max": "Username must not exceed 30 characters.",
    "any.required": "Username is required.",
  }),
  phone: Joi.string()
    .pattern(/^09[0-9]{9}$/) // Valid Iranian phone number format (e.g., 09123456789)
    .required()
    .messages({
      "string.base": "Phone number must be a string.",
      "string.empty": "Phone number cannot be empty.",
      "string.pattern.base":
        "Phone number must be 11 digits and start with 09.",
      "any.required": "Phone number is required.",
    }),
  password: Joi.string().min(6).max(50).required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least 6 characters long.",
    "string.max": "Password must not exceed 50 characters.",
    "any.required": "Password is required.",
  }),
 
});

// Login Validation Schema
const loginValidation = Joi.object({
 phone: Joi.string()
    .pattern(/^09[0-9]{9}$/) // Valid Iranian phone number format (e.g., 09123456789)
    .required()
    .messages({
      "string.base": "Phone number must be a string.",
      "string.empty": "Phone number cannot be empty.",
      "string.pattern.base":
        "Phone number must be 11 digits and start with 09.",
      "any.required": "Phone number is required.",
    }),
  password: Joi.string().min(6).max(50).required().messages({
    "string.base": "Password must be a string.",
    "string.empty": "Password cannot be empty.",
    "string.min": "Password must be at least 6 characters long.",
    "string.max": "Password must not exceed 50 characters.",
    "any.required": "Password is required.",
  }),
});

// OTP Verification Schema
const otpValidation = Joi.object({
  phone: Joi.string()
    .pattern(/^09[0-9]{9}$/)
    .required()
    .messages({
      "string.base": "Phone number must be a string.",
      "string.empty": "Phone number cannot be empty.",
      "string.pattern.base":
        "Phone number must be 11 digits and start with 09.",
      "any.required": "Phone number is required.",
    }),
  otp: Joi.string()
    .length(5)
    .pattern(/^[0-9]{6}$/) // OTP must be a 5-digit number
    .required()
    .messages({
      "string.base": "OTP must be a string.",
      "string.empty": "OTP cannot be empty.",
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.base": "OTP must be a 6-digit number.",
      "any.required": "OTP is required.",
    }),
});

module.exports = { signupValidation, loginValidation, otpValidation };
