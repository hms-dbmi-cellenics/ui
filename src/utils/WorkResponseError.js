class WorkResponseError extends Error {
  constructor(error, request) {
    super(error);

    this.request = request;
  }
}

module.exports = WorkResponseError;
