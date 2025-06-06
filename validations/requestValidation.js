const Joi = require("joi");

const requestValidation = Joi.object({
  requestType: Joi.string().valid("leave", "overtime").required().messages({
    "any.required": "نوع درخواست الزامی است.",
    "any.only": "نوع درخواست باید یکی از 'leave' یا 'overtime' باشد.",
    "string.base": "نوع درخواست باید یک رشته باشد.",
  }),

  startDate: Joi.date().iso().required().messages({
    "any.required": "تاریخ شروع الزامی است.",
    "date.base": "تاریخ شروع باید یک تاریخ معتبر باشد.",
    "date.format": "تاریخ شروع باید به فرمت ISO باشد.",
  }),

  endDate: Joi.date().iso().greater(Joi.ref("startDate")).required().messages({
    "any.required": "تاریخ پایان الزامی است.",
    "date.base": "تاریخ پایان باید یک تاریخ معتبر باشد.",
    "date.format": "تاریخ پایان باید به فرمت ISO باشد.",
    "date.greater": "تاریخ پایان باید بعد از تاریخ شروع باشد.",
  }),

  note: Joi.string().allow("").messages({
    "string.base": "یادداشت باید از نوع رشته باشد.",
  }),
});

module.exports = { requestValidation };
