import moment from 'moment';
import getAuthJWT from 'utils/getAuthJWT';
import WorkTimeoutError from 'utils/WorkTimeoutError';
import fetchAPI from 'utils/fetchAPI';
import unpackResult from 'utils/work/unpackResult';
import WorkResponseError from 'utils/WorkResponseError';

const throwResponseError = (response) => {
  throw new Error(`Error ${response.status}: ${response.text}`, { cause: response });
};

const seekFromS3 = async (ETag, experimentId) => {
  const response = await fetchAPI(`/v1/workResults/${experimentId}/${ETag}`);

  if (!response.ok) {
    if (response.status === 404) return null;

    throwResponseError(response);
  }

  const { signedUrl } = await response.json();
  const storageResp = await fetch(signedUrl);

  if (!storageResp.ok) {
    throwResponseError(storageResp);
  }

  return unpackResult(storageResp);
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
  const socketId = requestProps.broadcast ? 'broadcast' : io.id;

  const request = {
    ETag,
    socketId,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: timeoutDate,
    body,
    ...requestProps,
  };

  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new WorkTimeoutError(timeoutDate, request));
    }, timeout * 1000);
  });

  const responsePromise = new Promise((resolve, reject) => {
    io.on(`WorkResponse-${ETag}`, (res) => {
      const { response: { error } } = res;

      if (error) {
        return reject(
          new WorkResponseError(error, request),
        );
      }

      // If no error, the response should be ready on S3.
      // In this case, return true
      return resolve();
    });
  });

  const result = Promise.race([timeoutPromise, responsePromise]);

  io.emit('WorkRequest', request);
  return result;
};

export { dispatchWorkRequest, seekFromS3 };
