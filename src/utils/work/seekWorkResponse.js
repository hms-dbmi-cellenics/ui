import moment from 'moment';
import Amplify, { Storage } from 'aws-amplify';

import { chain } from 'stream-chain';
import { parser } from 'stream-json/Parser';
import { streamObject } from 'stream-json/streamers/StreamObject';
import zlib from 'zlib';

import connectionPromise from '../socketConnection';
import WorkResponseError from '../WorkResponseError';
import getAuthJWT from '../getAuthJWT';
import WorkTimeoutError from '../WorkTimeoutError';

const unpackResult = async (storageResp) => {
  const promise = new Promise();

  const bodyParserPipeline = chain([
    storageResp,
    zlib.createGunzip(),
    parser(),
    streamObject(),
  ]);

  bodyParserPipeline.on('end', () => console.log('end'));
  bodyParserPipeline.on('data', (data) => {
    console.log('data:', data.value);
    promise.resolve();
  });
  bodyParserPipeline.on('error', (error) => console.log(`Error: \n${error}`));

  return promise;
};

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

  const response = await unpackResult(storageResp);

  // const response = await storageResp.json();

  return response;
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

  io.emit('WorkRequest', request);

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

    return Promise.race([timeoutPromise, responsePromise]);
  }
};

export { seekFromAPI, seekFromS3 };
