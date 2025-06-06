const { Request } = require("../../models/request");
const { User } = require("../../models/user");
const { Customer } = require("../../models/customer");
const { tryCatch } = require("../../utils/tryCatch");
const { requestValidation } = require("../../validations/requestValidation");
const {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");

const createRequest = tryCatch(async (req, res) => {
  const userId = req.user.id;

  const { error } = requestValidation.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  const { requestType, startDate, endDate, note } = req.body;

  const user = await User.findById(userId);

  // Check for past dates
  if (new Date(startDate) < new Date()) {
    throw new UnprocessableEntityError("تاریخ شروع معتبر نمی باشد");
  }

  // Check for overlapping requests
  const overlap = await Request.findOne({
    creator: userId,
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  });

  if (overlap) {
    throw new ConflictError("درخواست دیگری برای این تاریخ ثبت کرده اید");
  }

  // Create new request
  const newRequest = await Request.create({
    creator: user._id,
    requestType,
    startDate,
    endDate,
    reviewedBy: user.employer,
    note: note || "",
    status: "pending",
  });

  res.status(201).json({
    success: true,
    newRequest,
  });
});

module.exports = {
  createRequest,
};
