import http from 'http';

function APIError(statusCode, message, errors) {
  const name = http.STATUS_CODES[statusCode];
  const err = new Error(`${statusCode} ${name}`);
  Object.setPrototypeOf(err, APIError.prototype);

  err.name = name;
  err.statusCode = statusCode;
  err.userMessage = message;
  err.errors = errors;

  return err;
}

APIError.prototype = Object.create(Error.prototype);
APIError.prototype.constructor = APIError;

module.exports = APIError;
