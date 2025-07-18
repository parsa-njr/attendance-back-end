const Joi = require("joi");

const updateRequestStatusValidation = Joi.object({
  status: Joi.string().valid("accepted", "rejected").required().messages({
    "any.only": "وضعیت فقط می‌تواند 'accepted' یا 'rejected' باشد.",
    "string.base": "وضعیت باید یک رشته باشد.",
    "any.required": "وضعیت الزامی است.",
  }),

  customerNote: Joi.string().allow("").max(500).messages({
    "string.base": "یادداشت  باید یک رشته باشد.",
    "string.max": "یادداشت  نمی‌تواند بیش از ۵۰۰ کاراکتر باشد.",
  }),
});

module.exports = { updateRequestStatusValidation };
