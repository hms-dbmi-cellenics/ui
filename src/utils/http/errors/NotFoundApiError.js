const httpStatusCodes = require('../httpStatusCodes');
const APIError = require('./APIError');

class NotFoundAPIError extends APIError {
  constructor(
    name,
    statusCode = httpStatusCodes.NOT_FOUND,
    description = 'Not found.',
    isOperational = true,
  ) {
    super(name, statusCode, isOperational, description);
  }
}

module.exports = NotFoundAPIError;
