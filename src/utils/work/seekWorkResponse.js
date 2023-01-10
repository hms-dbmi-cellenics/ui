import dayjs from 'dayjs';

import getAuthJWT from 'utils/getAuthJWT';
import fetchAPI from 'utils/http/fetchAPI';
import unpackResult from 'utils/work/unpackResult';
import parseResult from 'utils/work/parseResult';
import WorkTimeoutError from 'utils/errors/http/WorkTimeoutError';
import WorkResponseError from 'utils/errors/http/WorkResponseError';
import httpStatusCodes from 'utils/http/httpStatusCodes';

const throwResponseError = (response) => {
  throw new Error(`Error ${response.status}: ${response.text}`, { cause: response });
};

const timeoutIds = {};

// getRemainingWorkerStartTime returns how many more seconds the worker is expected to
// need to be running with an extra 1 minute for a bit of leeway
const getRemainingWorkerStartTime = (creationTimestamp) => {
  const now = new Date();
  const creationTime = new Date(creationTimestamp);
  const elapsed = parseInt((now - creationTime) / (1000), 10); // gives second difference

  // we assume a worker takes up to 5 minutes to start
  const totalStartup = 5 * 60;
  const remainingTime = totalStartup - elapsed;
  // add an extra minute just in case
  return remainingTime + 60;
};

const seekFromS3 = async (ETag, experimentId, taskName) => {
  let response;
  try {
    const url = `/v2/workResults/${experimentId}/${ETag}`;

    response = await fetchAPI(url);
  } catch (e) {
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
      return null;
    }

    throw e;
  }

  const storageResp = await fetch(response.signedUrl);

  if (!storageResp.ok) {
    throwResponseError(storageResp);
  }

  const unpackedResult = await unpackResult(storageResp);
  const parsedResult = parseResult(unpackedResult, taskName);

  return parsedResult;
};

// getTimeoutDate returns the date resulting of adding 'timeout' seconds to
// current time.
const getTimeoutDate = (timeout) => dayjs().add(timeout, 's').toISOString();

const resetTimeout = (request, newTimeout, reject, ETag) => {
  if (timeoutIds[ETag]) {
    console.log(`clearing timeout ${ETag} ${timeoutIds[ETag]}`);
    clearTimeout(timeoutIds[ETag]);
  }
  const timeoutDate = getTimeoutDate(newTimeout);
  const id = setTimeout(() => {
    reject(new WorkTimeoutError(newTimeout, timeoutDate, request, ETag));
  }, (newTimeout) * 1000);
  return id;
};

const dispatchWorkRequest = async (
  experimentId,
  body,
  timeout,
  ETag,
  requestProps,
) => {
  const { default: connectionPromise } = await import('utils/socketConnection');
  const io = await connectionPromise;

  // this timeout is how much we expect to be waiting for a given task,
  // it can be refreshed (as opposed to the worker timeout)
  const timeoutDate = dayjs().add(timeout, 's').toISOString();
  // if the worker encounters this timeout it will ignore the message
  const workerTimeoutDate = dayjs().add(1800, 's').toISOString();
  const authJWT = await getAuthJWT();

  const request = {
    ETag,
    socketId: io.id,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: workerTimeoutDate,
    body,
    ...requestProps,
  };
  console.error(`dispatch: ${ETag} [UI, worker]:  [${dayjs().toISOString()}+${timeout} (${timeoutDate}),  ${workerTimeoutDate}]`, body);

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutIds[ETag] = resetTimeout(request, timeout, reject, ETag);
    console.log('0. timeoutIds: ', timeoutIds);

    io.on(`WorkerInfo-${experimentId}`, (res) => {
      const { response: { podInfo: { name, creationTimestamp, phase } } } = res;
      console.log('received worker info: ', res); // TODO: remove
      const extraTime = getRemainingWorkerStartTime(creationTimestamp);

      // this worker info indicates that the work request has been received but the worker
      // is still spinning up so we will add extra time to account for that.
      if (phase === 'Pending' && extraTime > 0) {
        console.log(`WorkerInfo-${experimentId}: ${ETag} ${name} [${creationTimestamp}]: adding ${extraTime} seconds to timeout at ${dayjs().toISOString()}.`);
        const newTimeout = timeout + extraTime;
        timeoutIds[ETag] = resetTimeout(request, newTimeout, reject, ETag);
        console.log('1. timeoutIds: ', timeoutIds);
      }
    });

    // this experiment update is received whenever a worker finishes any work request
    // related to the current experiment. We extend the timeout because we know
    // the worker is alive and was working on another request of our experiment //
    // (so this request was in queue)
    io.on(`Heartbeat-${experimentId}`, (res) => {
      // const { request: completedRequest } = res;
      console.log('received experiment update: ', res); // TODO: remove
      const newTimeoutDate = getTimeoutDate(timeout);
      if (newTimeoutDate < workerTimeoutDate) {
        console.log(`Heartbeat-${experimentId}: ${ETag} refreshing ${timeout} seconds (${newTimeoutDate}) timeout at ${dayjs().toISOString()}.`);
        timeoutIds[ETag] = resetTimeout(request, timeout, reject, ETag);
        console.log('2. timeoutIds: ', timeoutIds);
      } else {
        console.log(`Heartbeat-${experimentId}: ${ETag} not refreshing ${newTimeoutDate} < ${workerTimeoutDate} at ${dayjs().toISOString()}.`);
      }
    });
  });

  const responsePromise = new Promise((resolve, reject) => {
    io.on(`WorkResponse-${ETag}`, (res) => {
      const { response } = res;

      if (response.error) {
        const { errorCode, userMessage } = response;
        console.error(errorCode, userMessage);

        return reject(
          new WorkResponseError(errorCode, userMessage, request),
        );
      }

      // If no error, the response should be ready on S3.
      // In this case, return true
      return resolve();
    });
  });

  const result = Promise.race([timeoutPromise, responsePromise]);

  // TODO switch to using normal WorkRequest for v2 requests
  io.emit('WorkRequest-v2', request);

  return result;
};

export { dispatchWorkRequest, seekFromS3 };
