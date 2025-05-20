const {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
  UnprocessableEntityError,
} = require("../errors/customError");

const errorHandler = (error, req, res, next) => {
  // Log the error for debugging (consider logging to a file in production)
  console.error(error.message);

  // Default response structure
  const errorResponse = {
    success: false,
    msg: "Something went wrong", // Default message
    errorDetails: error.message || "An unexpected error occurred",
    statusCode: error.statusCode || 500, // Default to 500 if not provided
  };

  // Handle specific error types
  if (error instanceof ValidationError) {
    errorResponse.statusCode = 400;
    errorResponse.msg = "Validation failed";
  }

  if (error instanceof NotFoundError) {
    errorResponse.statusCode = 404;
    errorResponse.msg = "Resource not found";
  }

  if (error instanceof AuthenticationError) {
    errorResponse.statusCode = 401;
    errorResponse.msg = "Authentication failed";
  }

  if (error instanceof ForbiddenError) {
    errorResponse.statusCode = 403;
    errorResponse.msg = "Forbidden: You do not have access to this resource";
  }

  if (error instanceof ConflictError) {
    errorResponse.statusCode = 409;
    errorResponse.msg = "Conflict: Resource already exists";
  }

  if (error instanceof UnprocessableEntityError) {
    errorResponse.statusCode = 422;
    errorResponse.msg = "Unprocessable entity";
  }

  // If it's not a known `AppError`, fallback to internal server error
  if (!error.statusCode) {
    errorResponse.statusCode = 500;
    errorResponse.msg = "Internal server error";
  }

  // Send the error response
  res.status(errorResponse.statusCode).json({
    success: false,
    msg: errorResponse.msg,
    errorDetails: errorResponse.errorDetails,
  });
};

module.exports = errorHandler;
