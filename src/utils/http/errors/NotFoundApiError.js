const httpStatusCodes = require('../httpStatusCodes');
const BaseError = require('./ApiError');

class NotFoundApiError extends BaseError {
  constructor(
    name,
    statusCode = httpStatusCodes.NOT_FOUND,
    description = 'Not found.',
    isOperational = true,
  ) {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = NotFoundApiError;
