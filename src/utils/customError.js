class CustomError extends Error {
  constructor(message, payload, ...args) {
    super(message, ...args);
    Error.captureStackTrace(this, CustomError);
    this.payload = payload;
  }
}

export default CustomError;
