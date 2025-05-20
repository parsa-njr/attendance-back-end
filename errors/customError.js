// customErrors.js

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name; // Set the name of the error
    Error.captureStackTrace(this, this.constructor); // Remove unnecessary stack trace for cleaner error logs
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed") {
    super(message, 400); // 400 Bad Request
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404); // 404 Not Found
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication failed") {
    super(message, 401); // 401 Unauthorized
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403); // 403 Forbidden
  }
}

class ConflictError extends AppError {
  constructor(message = "Conflict error") {
    super(message, 409); // 409 Conflict
  }
}

class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity") {
    super(message, 422); // 422 Unprocessable Entity
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ForbiddenError,
  ConflictError,
  UnprocessableEntityError,
};
