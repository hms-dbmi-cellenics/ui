function WorkResponseError(errorCode, userMessage, request) {
  const err = new Error(`${errorCode}: ${userMessage}`);
  Object.setPrototypeOf(err, WorkResponseError.prototype);
  err.errorCode = errorCode;
  err.userMessage = userMessage;
  err.request = request;
  return err;
}

WorkResponseError.prototype = Object.create(Error.prototype);
WorkResponseError.prototype.constructor = WorkResponseError;

module.exports = WorkResponseError;
