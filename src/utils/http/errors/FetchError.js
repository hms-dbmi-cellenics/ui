class FetchError extends Error {
  constructor(error) {
    super(error);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'Fetch Error';
    this.isOperational = true;
    this.error = error;
    Error.captureStackTrace(this);
  }
}
module.exports = FetchError;
