import moment from 'moment';
import getAuthJWT from 'utils/getAuthJWT';
import WorkTimeoutError from 'utils/http/errors/WorkTimeoutError';
import fetchAPI from 'utils/http/fetchAPI';
import unpackResult from 'utils/work/unpackResult';
import WorkResponseError from 'utils/http/errors/WorkResponseError';
import httpStatusCodes from 'utils/http/httpStatusCodes';
// import handleError from 'utils/http/handleError';

const throwResponseError = (response) => {
  throw new Error(`Error ${response.status}: ${response.text}`, { cause: response });
};

const seekFromS3 = async (ETag, experimentId) => {
  let response;
  try {
    response = await fetchAPI(`/v1/workResults/${experimentId}/${ETag}`);
  } catch (e) {
    console.log('raised error lcs', e);
    if (e.statusCode === httpStatusCodes.NOT_FOUND) {
      return null;
    }
    // REVIEW: do we want to show a notification to the user
    // when we can't fetch from s3? (and it's not a 404)
    // handleError(e);
    // throwResponseError(response);

    throw e;
    // throw new Error(`Error ${e.statusCode}: ${response.text}`, { cause: response });
  }

  const { signedUrl } = response;
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
      clearTimeout(id);
      reject(new WorkTimeoutError(timeoutDate, request));
    }, timeout * 1000);
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

  io.emit('WorkRequest', request);
  return result;
};

export { dispatchWorkRequest, seekFromS3 };
