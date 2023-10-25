import dayjs from 'dayjs';

import getAuthJWT from 'utils/getAuthJWT';
import fetchAPI from 'utils/http/fetchAPI';

const getWorkerTimeout = (taskName, defaultTimeout) => {
  switch (taskName) {
    case 'GetEmbedding':
    case 'ListGenes':
    case 'MarkerHeatmap': {
      return dayjs().add(1800, 's').toISOString();
    }

    default: {
      return dayjs().add(defaultTimeout, 's').toISOString();
    }
  }
};

const dispatchWorkRequest = async (
  experimentId,
  body,
  timeout,
  requestProps,
) => {
  const { default: connectionPromise } = await import('utils/socketConnection');

  const io = await connectionPromise;
  const { name: taskName } = body;

  // for listGenes, markerHeatmap, & getEmbedding we set a long timeout for the worker
  // after that timeout the worker will skip those requests
  // meanwhile in the UI we set a shorter timeout. The UI will be prolonging this timeout
  // as long as it receives "heartbeats" from the worker because that means the worker is alive
  // and progresing.
  // this should be removed if we make each request run in a different worker
  const workerTimeoutDate = getWorkerTimeout(taskName, timeout);

  const authJWT = await getAuthJWT();

  const request = {
    socketId: io.id,
    experimentId,
    ...(authJWT && { Authorization: `Bearer ${authJWT}` }),
    timeout: workerTimeoutDate,
    body,
    ...requestProps,
  };

  console.log('dispatching work request', request);
  // TODO test what happens when api throws an error here
  const response = await fetchAPI(
    `/v2/workRequest/${experimentId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  );

  console.log('work request response', response);
  const { data: { ETag, signedUrl } } = response;
  return { ETag, signedUrl, request };
};

export default dispatchWorkRequest;
