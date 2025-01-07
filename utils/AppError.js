class AppError extends Error {
  constructor(statusCode, message) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; //so that we can control amt of info to be displayed on client depending on app environment

    Error.captureStackTrace(this, this.constructor); //captures stack trace of actual error class provided by js
  }
}

module.exports = AppError;
