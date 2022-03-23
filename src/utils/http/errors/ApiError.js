const http = require('http');

class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(`${statusCode} ${message}`);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = http.STATUS_CODES[statusCode];
    this.statusCode = statusCode;
    this.userMessage = message;
    this.errors = errors;
    // Error.captureStackTrace(this);
  }
}
module.exports = ApiError;
