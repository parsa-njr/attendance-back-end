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
    message: "Something went wrong", // Default message
    errorDetails: error.message || "An unexpected error occurred",
    statusCode: error.statusCode || 500, // Default to 500 if not provided
  };

  // Handle specific error types
  if (error instanceof ValidationError) {
    errorResponse.statusCode = 400;
    errorResponse.message = "Validation failed";
  }

  if (error instanceof NotFoundError) {
    errorResponse.statusCode = 404;
    errorResponse.message = "Resource not found";
  }

  if (error instanceof AuthenticationError) {
    errorResponse.statusCode = 401;
    errorResponse.message = "Authentication failed";
  }

  if (error instanceof ForbiddenError) {
    errorResponse.statusCode = 403;
    errorResponse.message = "Forbidden: You do not have access to this resource";
  }

  if (error instanceof ConflictError) {
    errorResponse.statusCode = 409;
    errorResponse.message = "Conflict: Resource already exists";
  }

  if (error instanceof UnprocessableEntityError) {
    errorResponse.statusCode = 422;
    errorResponse.message = "Unprocessable entity";
  }

  // If it's not a known `AppError`, fallback to internal server error
  if (!error.statusCode) {
    errorResponse.statusCode = 500;
    errorResponse.message = "Internal server error";
  }

  // Send the error response
  res.status(errorResponse.statusCode).json({
    success: false,
    message: errorResponse.message,
    errorDetails: errorResponse.errorDetails,
  });
};

module.exports = errorHandler;
