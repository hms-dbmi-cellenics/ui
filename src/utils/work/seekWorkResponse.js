import moment from 'moment';

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
const getTimeoutDate = (timeout) => moment().add(timeout, 's').toISOString();

const resetTimeout = (id, request, newTimeout, reject) => {
  clearTimeout(id);
  setTimeout(() => {
    reject(new WorkTimeoutError(getTimeoutDate(newTimeout), request));
  }, (newTimeout) * 1000);
};

const dispatchWorkRequest = async (
  experimentId,
  body,
  timeout,
  ETag,
  requestProps,
) => {
  console.error('dispatching work request', body);
  const { default: connectionPromise } = await import('utils/socketConnection');
  const io = await connectionPromise;

  const timeoutDate = getTimeoutDate(timeout);
  const authJWT = await getAuthJWT();

  const request = {
    ETag,
    socketId: io.id,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: timeoutDate,
    body,
    ...requestProps,
  };

  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new WorkTimeoutError(timeoutDate, request));
    }, timeout * 1000);

    io.on(`WorkerInfo-${experimentId}`, (res) => {
      const { response: { podInfo: { name, creationTimestamp, phase } } } = res;
      console.log('received worker info: ', res); // TODO: remove
      const extraTime = getRemainingWorkerStartTime(creationTimestamp);

      // this worker info indicates that the work request has been received but the worker
      // is still spinning up so we will add extra time to account for that.
      if (phase === 'Pending' && extraTime > 0) {
        console.log(`WorkerInfo-${experimentId}: ${name} [${creationTimestamp}]: adding ${extraTime} seconds to timeout.`);
        const newTimeout = timeout + extraTime;
        resetTimeout(id, request, newTimeout, reject);
      }
    });

    // this experiment update is received whenever a worker finishes any work request
    // related to the current experiment. We extend the timeout because we know
    // the worker is alive and was working on another request of our experiment //
    // (so this request was in queue)
    io.on(`ExperimentUpdates-${experimentId}`, (res) => {
      const { request: completedRequest } = res;
      console.log('received experiment update: ', completedRequest); // TODO: remove
      console.log(`ExperimentUpdates-${experimentId}: refreshing ${timeout} seconds timeout.`);
      resetTimeout(id, request, timeout, reject);
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
