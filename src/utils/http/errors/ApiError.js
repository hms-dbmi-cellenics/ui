const http = require('http');

class ApiError extends Error {
  constructor(statusCode, message, errors) {
    const name = http.STATUS_CODES[statusCode];
    super(`${statusCode} ${name}`);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.statusCode = statusCode;
    this.userMessage = message;
    this.errors = errors;
    // Error.captureStackTrace(this);
  }
}
module.exports = ApiError;
