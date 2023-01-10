import dayjs from 'dayjs';

class WorkTimeoutError extends Error {
  constructor(timeout, timeoutDate, request, ETag) {
    super(`The request for ${ETag} took more than ${timeout}s, past ${timeoutDate} to complete at ${dayjs().toISOString()}`);
    this.timeout = timeoutDate;
    this.request = request;
  }
}

module.exports = WorkTimeoutError;
