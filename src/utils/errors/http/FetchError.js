function FetchError(error) {
  const err = new Error(error);
  Object.setPrototypeOf(err, FetchError.prototype);
  err.name = 'Fetch Error';
  err.error = error;
  return err;
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;

module.exports = FetchError;
