class WorkGenericError extends Error {
  constructor(error, request) {
    super(error);

    this.message = error;
    this.request = request;
  }
}

module.exports = WorkGenericError;
