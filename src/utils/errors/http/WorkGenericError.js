function WorkGenericError(error, request) {
  const err = new Error(error);
  Object.setPrototypeOf(err, WorkGenericError.prototype);
  err.message = error;
  err.request = request;
  return err;
}

WorkGenericError.prototype = Object.create(Error.prototype);
WorkGenericError.prototype.constructor = WorkGenericError;

module.exports = WorkGenericError;
