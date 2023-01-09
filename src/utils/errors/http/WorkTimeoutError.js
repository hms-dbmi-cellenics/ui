import dayjs from 'dayjs';

class WorkTimeoutError extends Error {
  constructor(timeout, request) {
    super(`Your request took past the timeout of ${timeout} seconds to complete at ${dayjs().format()}`);
    this.timeout = timeout;
    this.request = request;
  }
}

module.exports = WorkTimeoutError;
