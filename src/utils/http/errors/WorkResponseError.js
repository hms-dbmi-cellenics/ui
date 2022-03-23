class WorkResponseError extends Error {
  constructor(errorCode, userMessage, request) {
    super(`${errorCode}: ${userMessage}`);

    this.errorCode = errorCode;
    this.userMessage = userMessage;
    this.request = request;
  }
}

module.exports = WorkResponseError;
