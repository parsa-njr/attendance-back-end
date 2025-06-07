const Request  = require("../../models/request");
const User  = require("../../models/user");
const Customer  = require("../../models/customer");
const { tryCatch } = require("../../utils/tryCatch");
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
  const { data, pagination } = await paginate(req, Request, {
    reviewedBy: customerId,
  });

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

  const { status } = req.body;

  const { error } = updateRequestStatusValidation.validate(req.body);

  if (error) {
    const errorMessage = error.details.map((e) => e.message).join(" ,");
    throw new UnprocessableEntityError(errorMessage);
  }

  // Check existing request
  const existingRequest = await Request.findOne({
    _id: requestId,
    reviewedBy: customerId,
  });

  // Prevent changing status if it's already accepted or rejected
if (existingRequest.status !== "pending") {
  throw new ConflictError(
    "وضعیت این درخواست قبلاً نهایی شده و قابل تغییر نیست."
  );
}

  // Proceed to update
  const updatedRequest = await Request.findByIdAndUpdate(
    requestId,
    { status, reviewedAt: new Date() },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    updatedRequest,
    success: true,
    message:"تغییر وضعیت با موفقیت انجام شد"
  });
});

module.exports = {
  getRequests,
  updateRequestStatus,
};
