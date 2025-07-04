const Customer = require("../../models/customer");
const Shift = require("../../models/shift");
const { tryCatch } = require("../../utils/tryCatch");
const {
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");
const paginate = require("../../utils/paginate");
const { shiftValidation } = require("../../validations/shiftValidation"); // You need to create this schema

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Create a new shift
//
const createShift = tryCatch(async (req, res) => {
  const customerId = req.user.id;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError("چنین مشتری‌ای یافت نشد");
  }

  const { error } = shiftValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const {
    shiftName,
    startDate,
    endDate,
    formalHolidays,
    shiftDays,
    exceptionDays,
  } = req.body;

  await Shift.create({
    customer: customerId,
    shiftName,
    startDate,
    endDate,
    formalHolidays,
    shiftDays,
    exceptionDays,
  });

  res.status(201).json({
    success: true,
    message: "شیفت با موفقیت ایجاد شد",
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Get all shifts for current logged-in customer
//
const getAllShifts = tryCatch(async (req, res) => {
  const customerId = req.user.id;

  const { data, pagination } = await paginate(req, Shift, {
    customer: customerId,
  });

  res.status(200).json({
    success: true,
    data: pagination
      ? {
          ...pagination,
          data,
        }
      : data,
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Get a single shift
//
const getShiftById = tryCatch(async (req, res) => {
  const shiftId = req.params?.shiftId;

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    throw new NotFoundError("شیفت یافت نشد");
  }

  res.status(200).json({
    success: true,
    data: shift,
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Update a shift
//
const updateShift = tryCatch(async (req, res) => {
  const shiftId = req.params?.shiftId;
  const  customerId  = req.user.id;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    throw new NotFoundError("چنین مشتری‌ای یافت نشد");
  }

  const { error } = shiftValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const updatedShift = await Shift.findOneAndUpdate(
    { _id: shiftId, customer: customerId },
    {
      $set: {
        shiftName: req.body.shiftName,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        formalHolidays: req.body.formalHolidays,
        shiftDays: req.body.shiftDays,
        exceptionDays: req.body.exceptionDays,
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedShift) {
    throw new NotFoundError("شیفت یافت نشد");
  }

  res.status(200).json({
    success: true,
    message: "شیفت با موفقیت به‌روزرسانی شد",
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────
// 📍 Delete a shift
//
const deleteShift = tryCatch(async (req, res) => {
  const shiftId = req.params?.shiftId;

  const deleted = await Shift.findByIdAndDelete(shiftId);
  if (!deleted) {
    throw new NotFoundError("شیفت یافت نشد");
  }

  res.status(200).json({
    success: true,
    message: "شیفت با موفقیت حذف شد",
  });
});

//
// ────────────────────────────────────────────────────────────────────────────────

module.exports = {
  createShift,
  getAllShifts,
  getShiftById,
  updateShift,
  deleteShift,
};
