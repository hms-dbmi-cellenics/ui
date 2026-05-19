import dayjs from 'dayjs';

function WorkTimeoutError(timeoutDuration, timeoutDate, request, ETag) {
  const err = new Error(`The request for ${ETag} took more than ${timeoutDuration}s, past ${timeoutDate} to complete at ${dayjs().toISOString()}`);
  Object.setPrototypeOf(err, WorkTimeoutError.prototype);
  err.timeoutDuration = timeoutDuration;
  err.timeout = timeoutDate;
  err.request = request;
  err.ETag = ETag;
  return err;
}

WorkTimeoutError.prototype = Object.create(Error.prototype);
WorkTimeoutError.prototype.constructor = WorkTimeoutError;

module.exports = WorkTimeoutError;
