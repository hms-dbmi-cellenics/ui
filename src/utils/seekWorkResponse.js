import moment from 'moment';
import Amplify, { Storage } from 'aws-amplify';

import connectionPromise from './socketConnection';
import WorkResponseError from './WorkResponseError';
import WorkTimeoutError from './WorkTimeoutError';
import getAuthJWT from './getAuthJWT';

const tasksForAllClients = ['ClusterCells'];

const seekFromS3 = async (key) => {
  const configuredBucket = Amplify.configure().Storage.AWSS3.bucket;
  const storageUrl = await Storage.get(
    key,
    {
      bucket: configuredBucket.replace('biomage-originals', 'worker-results'),
    },
  );

  const storageResp = await fetch(storageUrl);
  if (!storageResp.ok) {
    return null;
  }

  const response = await storageResp.json();

  return response;
};

const seekFromAPI = async (experimentId, timeout, key, body, requestProps = {}) => {
  const io = await connectionPromise;

  const timeoutDate = moment().add(timeout, 's').toISOString();
  const authJWT = await getAuthJWT();
  const isOnlyForThisClient = !tasksForAllClients.includes(body.name);
  const socketId = isOnlyForThisClient ? io.id : 'broadcast';

  const request = {
    uuid: key,
    socketId,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: timeoutDate,
    body,
    ...requestProps,
  };

  io.emit('WorkRequest', request);

  // If it is not a single client request then it will be received
  // in the ExperimentUpdates port instead of the WorkResponse one
  // so we don't need to listen for it
  if (!isOnlyForThisClient) { return; }

  const responsePromise = new Promise((resolve, reject) => {
    io.on(`WorkResponse-${key}`, (res) => {
      const { response: { error } } = res;

      if (error) {
        return reject(new WorkResponseError(error, request));
      }

      return resolve(res);
    });
  });

  const timeoutPromise = new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new WorkTimeoutError(timeoutDate, request));
    }, timeout * 1000);
  });

  return Promise.race([responsePromise, timeoutPromise]);
};

export { seekFromAPI, seekFromS3 };
