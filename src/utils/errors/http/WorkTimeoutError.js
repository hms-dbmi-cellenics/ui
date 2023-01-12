import dayjs from 'dayjs';

class WorkTimeoutError extends Error {
  // we pass along both duration & date for debugging purposes
  constructor(timeoutDuration, timeoutDate, request, ETag) {
    super(`The request for ${ETag} took more than ${timeoutDuration}s, past ${timeoutDate} to complete at ${dayjs().toISOString()}`);
    this.timeoutDuration = timeoutDuration;
    this.timeout = timeoutDate;
    this.request = request;
    this.ETag = ETag;
  }
}

module.exports = WorkTimeoutError;
