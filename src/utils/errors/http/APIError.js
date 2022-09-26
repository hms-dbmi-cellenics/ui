import http from 'http';

class APIError extends Error {
  constructor(statusCode, message, errors) {
    const name = http.STATUS_CODES[statusCode];
    super(`${statusCode} ${name}`);

    this.name = name;
    this.statusCode = statusCode;
    this.userMessage = message;
    this.errors = errors;
  }
}
module.exports = APIError;
