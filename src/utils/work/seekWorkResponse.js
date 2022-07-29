import moment from 'moment';

import getAuthJWT from 'utils/getAuthJWT';
import WorkTimeoutError from 'utils/http/errors/WorkTimeoutError';
import fetchAPI from 'utils/http/fetchAPI';
import unpackResult from 'utils/work/unpackResult';
import WorkResponseError from 'utils/http/errors/WorkResponseError';
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

const seekFromS3 = async (ETag, experimentId) => {
  console.log('[DEBUG] - SUPSUPSIP');
  let response;
  try {
    console.log('[DEBUG] - BEGUN response = await fetchAPI');
    response = await fetchAPI(`/v2/workResults/${experimentId}/${ETag}`);
    console.log('[DEBUG] - FINISHED response = await fetchAPI');
  } catch (e) {
    console.log('[DEBUG] - IMHEREEEE');
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
      return null;
    }

    throw e;
  }

  const { signedUrl } = response;
  console.log('[DEBUG] - BEGUN const storageResp = await fetch');
  const storageResp = await fetch(signedUrl);
  console.log('[DEBUG] - FINISHED const storageResp = await fetch');

  if (!storageResp.ok) {
    throwResponseError(storageResp);
  }

  console.log('[DEBUG] - BEGUN unpackResult');
  const unpackedRes = unpackResult(storageResp);
  console.log('[DEBUG] - FINISHED unpackResult');

  return unpackedRes;
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

  const timeoutDate = moment().add(timeout, 's').toISOString();
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

  console.log('[DEBUG] - HOLAOHOLA');
  const timeoutPromise = new Promise((resolve, reject) => {
    console.log('[DEBUG] - HOLAOHOL5');
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

  console.log('[DEBUG] - HOLAOHOLA1');

  const responsePromise = new Promise((resolve, reject) => {
    console.log('[DEBUG] - HOLAOHO6');
    io.on(`WorkResponse-${ETag}`, (res) => {
      const { response } = res;

      console.log('[DEBUG] - HOLAOHOL7');
      if (response.error) {
        const { errorCode, userMessage } = response;
        console.error(errorCode, userMessage);

        return reject(
          new WorkResponseError(errorCode, userMessage, request),
        );
      }

      console.log('[DEBUG] - HOLAOHOL8');

      // If no error, the response should be ready on S3.
      // In this case, return true
      return resolve();
    });
  });

  console.log('[DEBUG] - HOLAOHOLA2');

  const result = Promise.race([timeoutPromise, responsePromise]);

  console.log('[DEBUG] - HOLAOHOLA3');

  // TODO switch to using normal WorkRequest for v2 requests
  io.emit('WorkRequest-v2', request);

  console.log('[DEBUG] - HOLAOHOL101');

  return result;
};

export { dispatchWorkRequest, seekFromS3 };
