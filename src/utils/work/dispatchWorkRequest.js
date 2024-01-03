import dayjs from 'dayjs';
import { Environment } from 'utils/deploymentInfo';

import fetchAPI from 'utils/http/fetchAPI';
// Disable unique keys to reallow reuse of work results in development
const DISABLE_UNIQUE_KEYS = [
  'GetEmbedding',
];

const getCacheUniquenessKey = (taskName, environment) => {
  // Disable cache in development or if localStorage says so
  // Do not disable for embeddings requests because download seurat & trajectory depend on that ETag
  if (
    environment !== Environment.PRODUCTION
    && (localStorage.getItem('disableCache') === 'true' || environment === Environment.DEVELOPMENT)
    && !DISABLE_UNIQUE_KEYS.includes(taskName)
  ) {
    return Math.random();
  }

  return null;
};

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
  getState,
) => {
  const { name: taskName } = body;

  // for listGenes, markerHeatmap, & getEmbedding we set a long timeout for the worker
  // after that timeout the worker will skip those requests
  // meanwhile in the UI we set a shorter timeout. The UI will be prolonging this timeout
  // as long as it receives "heartbeats" from the worker because that means the worker is alive
  // and progresing.
  // this should be removed if we make each request run in a different worker
  const workerTimeoutDate = getWorkerTimeout(taskName, timeout);

  const { environment } = getState().networkResources;
  const cacheUniquenessKey = getCacheUniquenessKey(taskName, environment);

  // eslint-disable-next-line no-param-reassign
  requestProps.cacheUniquenessKey = cacheUniquenessKey;

  const request = {
    experimentId,
    timeout: workerTimeoutDate,
    body,
    requestProps,

  };

  const { data: { ETag, signedUrl } } = await fetchAPI(
    `/v2/workRequest/${experimentId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    },
  );

  return { ETag, signedUrl, request };
};

export default dispatchWorkRequest;
