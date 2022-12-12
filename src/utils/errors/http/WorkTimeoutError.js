class WorkTimeoutError extends Error {
  constructor(timeout, request) {
    super(`Your request took past the timeout of ${timeout} seconds to complete.`);
    this.timeout = timeout;
    this.request = request;
  }
}

module.exports = WorkTimeoutError;
