function SampleValidationError(error) {
  const err = new Error(error);
  Object.setPrototypeOf(err, SampleValidationError.prototype);
  err.name = 'SampleValidationError';
  err.error = error;
  return err;
}

SampleValidationError.prototype = Object.create(Error.prototype);
SampleValidationError.prototype.constructor = SampleValidationError;

module.exports = SampleValidationError;
