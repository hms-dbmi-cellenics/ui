import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import connectionPromise from './socketConnection';
import WorkResponseError from './WorkResponseError';
import WorkTimeoutError from './WorkTimeoutError';
import getApiEndpoint from './apiEndpoint';

const sendWork = async (experimentId, timeout, body, requestProps = {}) => {
  const requestUuid = uuidv4();
  const io = await connectionPromise();

  // Check if we need to have a bigger timeout because the worker being down.
  const statusResponse = await fetch(`${getApiEndpoint()}/v1/experiments/${experimentId}/pipelines`);
  const jsonResponse = await statusResponse.json();

  const adjustedTimeout = (started && ready) ? timeout : timeout + 60;

  const { worker: { started, ready } } = jsonResponse;
  const timeoutDate = moment().add(adjustedTimeout, 's').toISOString();

  const request = {
    uuid: requestUuid,
    socketId: io.id,
    experimentId,
    timeout: timeoutDate,
    body,
    ...requestProps,
  };

  io.emit('WorkRequest', request);

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
