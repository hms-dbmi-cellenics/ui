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

  const timeoutDate = dayjs().add(timeout, 's').toISOString();
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

      const extraTime = getRemainingWorkerStartTime(creationTimestamp);
      if (phase === 'Pending' && extraTime > 0) {
        console.log(`worker ${name} started at ${creationTimestamp}. Adding ${extraTime} seconds to timeout.`);
        clearTimeout(id);
        setTimeout(() => {
          reject(new WorkTimeoutError(timeoutDate, request));
        }, (timeout + extraTime) * 1000);
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
