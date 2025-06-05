const Joi = require("joi");

const locationValidation = Joi.object({
  customerId: Joi.string().required().messages({
    "string.empty": "شناسه مشتری الزامی است",
    "any.required": "شناسه مشتری الزامی است",
  }),
  name: Joi.string().min(2).max(50).required().messages({
    "string.empty": "نام الزامی است",
    "string.min": "نام باید حداقل ۲ حرف باشد",
    "string.max": "نام نباید بیشتر از ۵۰ حرف باشد",
    "any.required": "نام الزامی است",
  }),

  latitude: Joi.number().required().messages({
    "number.base": "مقدار عرض جغرافیایی باید عدد باشد",
    "any.required": "مقدار عرض جغرافیایی الزامی است",
  }),

  longitude: Joi.number().required().messages({
    "number.base": "مقدار طول جغرافیایی باید عدد باشد",
    "any.required": "مقدار طول جغرافیایی الزامی است",
  }),

  range: Joi.number().required().messages({
    "number.base": "مقدار محدوده باید عدد باشد",
    "any.required": "مقدار محدوده الزامی است",
  }),
});

module.exports = {
  locationValidation,
};
