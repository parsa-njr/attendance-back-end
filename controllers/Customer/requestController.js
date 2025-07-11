const Request = require("../../models/request");
const User = require("../../models/user");
const Customer = require("../../models/customer");
const { tryCatch } = require("../../utils/tryCatch");
const { searchFilter } = require("../../utils/search filter");
const {
  updateRequestStatusValidation,
} = require("../../validations/updateRequestStatusValidation");
const paginate = require("../../utils/paginate");
const {
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} = require("../../errors/customError");

const getRequests = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const { search } = req.query;
  const searchQuery = searchFilter(search, ["status"]);

  const { data, pagination } = await paginate(
    req,
    Request, // ✅ Correct model
    searchQuery, // 3rd: search filter
    { createdAt: -1 }, // 4th: sort
    [{ path: "user" }], // 5th: no populate fields
    { customer: customerId } // 6th: static filter);
  );

  res.status(200).json({
    success: true,
    data: pagination
      ? {
          data,
          ...pagination,
        }
      : data,
  });
});

const updateRequestStatus = tryCatch(async (req, res) => {
  const customerId = req.user.id;
  const requestId = req.params.requestId;

  const { status, customerNote } = req.body;

  console.log("req ::::: ", req);

  const { error } = updateRequestStatusValidation.validate(req.body);

  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  // Check existing request
  const existingRequest = await Request.findOne({
    _id: requestId,
    customer: customerId,
  });
  console.log("existingRequest ::::: ", existingRequest);

  // Prevent changing status if it's already accepted or rejected
  if (existingRequest.status !== "pending") {
    throw new ConflictError(
      "وضعیت این درخواست قبلاً نهایی شده و قابل تغییر نیست."
    );
  }

  // Proceed to update
  const updatedRequest = await Request.findByIdAndUpdate(
    requestId,
    { status, customerNote, reviewedAt: new Date() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    updatedRequest,
    success: true,
    message: "تغییر وضعیت با موفقیت انجام شد",
  });
});

module.exports = {
  getRequests,
  updateRequestStatus,
};
