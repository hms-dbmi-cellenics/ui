import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import fetchAPI from './fetchAPI';
import connectionPromise from './socketConnection';
import WorkResponseError from './WorkResponseError';
import WorkTimeoutError from './WorkTimeoutError';
import getAuthJWT from './getAuthJWT';

const sendWork = async (experimentId, timeout, body, requestProps = {}) => {
  const requestUuid = uuidv4();
  const io = await connectionPromise();

  // Check if we need to have a bigger timeout because the worker being down.
  const statusResponse = await fetchAPI(`/v1/experiments/${experimentId}/backendStatus`);
  const jsonResponse = await statusResponse.json();

  const { worker: { started, ready } } = jsonResponse;
  const adjustedTimeout = (started && ready) ? timeout : timeout + 120;

  const timeoutDate = moment().add(adjustedTimeout, 's').toISOString();

  const authJWT = await getAuthJWT();

  const isOnlyForThisClient = body.name !== 'ClusterCells';
  const socketId = isOnlyForThisClient ? io.id : 'broadcast';

  const request = {
    uuid: requestUuid,
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
    io.on(`WorkResponse-${requestUuid}`, (res) => {
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
    }, adjustedTimeout * 1000);
  });

  return Promise.race([responsePromise, timeoutPromise]);
};

export default sendWork;
