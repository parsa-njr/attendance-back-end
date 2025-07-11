const Request = require("../../models/request");
const User = require("../../models/user");
const Customer = require("../../models/customer");
const { tryCatch } = require("../../utils/tryCatch");
const { requestValidation } = require("../../validations/requestValidation");
const paginate = require("../../utils/paginate");
const { searchFilter } = require("../../utils/search filter");
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

  const { requestType, startDate, endDate, userNote } = req.body;

  const user = await User.findById(userId);

  // Check for past dates
  // if (new Date(startDate) < new Date()) {
  //   throw new UnprocessableEntityError("تاریخ شروع معتبر نمی باشد");
  // }

  // Check for overlapping requests
  const overlap = await Request.findOne({
    user: userId,
    startDate: { $lte: new Date(endDate) },
    endDate: { $gte: new Date(startDate) },
  });

  if (overlap) {
    throw new ConflictError("درخواست دیگری برای این تاریخ ثبت کرده اید");
  }

  // Create new request
  const newRequest = await Request.create({
    user: user._id,
    requestType,
    startDate,
    endDate,
    customer: user.customer,
    userNote: userNote || "",
    status: "pending",
  });

  res.status(201).json({
    success: true,
    newRequest,
  });
});

const getRequest = tryCatch(async (req, res) => {
  const userId = req.user.id;
  const { search } = req.query;
  const searchQuery = searchFilter(search, ["status"]);

  const { data, pagination } = await paginate(
    req,
    Request, // ✅ Correct model
    searchQuery, // 3rd: search filter
    { createdAt: -1 }, // 4th: sort
    [], // 5th: no populate fields
    { user: userId } // 6th: static filter
  );

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

module.exports = {
  createRequest,
  getRequest,
};
