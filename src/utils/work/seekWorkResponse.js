import moment from 'moment';
import Amplify from '@aws-amplify/core';
import Storage from '@aws-amplify/storage';

import getAuthJWT from 'utils/getAuthJWT';
import WorkTimeoutError from 'utils/WorkTimeoutError';

import unpackResult from 'utils/work/unpackResult';
import WorkResponseError from 'utils/WorkResponseError';

const seekFromS3 = async (ETag) => {
  const configuredBucket = Amplify.configure().Storage.AWSS3.bucket;
  const storageUrl = await Storage.get(
    ETag,
    {
      bucket: configuredBucket.replace('biomage-originals', 'worker-results'),
    },
  );

  const storageResp = await fetch(storageUrl);
  if (!storageResp.ok) {
    return null;
  }

  return unpackResult(storageResp);
};

const seekFromAPI = async (
  experimentId,
  body,
  timeout,
  ETag,
  eventCallback,
  requestProps = {},
) => {
  console.error('seek from api', body);
  const { default: connectionPromise } = await import('utils/socketConnection');
  const io = await connectionPromise;

  const timeoutDate = moment().add(timeout, 's').toISOString();
  const authJWT = await getAuthJWT();
  const socketId = !eventCallback ? io.id : 'broadcast';

  const request = {
    ETag,
    socketId,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: timeoutDate,
    body,
    ...requestProps,
  };

  let result = null;

  if (eventCallback) {
    io.off(`${experimentId}-${body.name}`);

    io.on(`${experimentId}-${body.name}`, (res) => {
      const { response: { error } } = res;

      if (error) {
        return eventCallback(error, null);
      }

      seekFromS3(ETag)
        .then((content) => eventCallback(null, content))
        .catch((e) => eventCallback(e, null));
    });
  } else {
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

        // If no error, the reasponse should be ready on S3.
        seekFromS3(
          ETag,
        ).then((content) => {
          resolve(content);
        }).catch((e) => {
          reject(e);
        });
      });
    });

    result = Promise.race([timeoutPromise, responsePromise]);
  }

  io.emit('WorkRequest', request);
  return result;
};

export { seekFromAPI, seekFromS3 };
