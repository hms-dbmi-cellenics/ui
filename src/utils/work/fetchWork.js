import { Environment, isBrowser } from 'utils/deploymentInfo';

import { getBackendStatus } from 'redux/selectors';

import cache from 'utils/cache';
import generateETag from 'utils/work/generateETag';
import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';

// Temporarily using gene expression without local cache
const fetchGeneExpressionWorkWithoutLocalCache = async (
  experimentId,
  timeout,
  body,
  backendStatus,
  environment,
  broadcast,
  extras,
  onETagGenerated,
  dispatch,
  getState,
) => {
  // If new genes are needed, construct payload, try S3 for results,
  // and send out to worker if there's a miss.
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const ETag = await generateETag(
    experimentId,
    body,
    extras,
    qcPipelineStartDate,
    environment,
    dispatch,
    getState,
  );

  onETagGenerated(ETag);

  try {
    const { signedUrl, data } = await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        ETagPipelineRun: qcPipelineStartDate,
        broadcast,
        ...extras,
      },
      dispatch,
    );

    return data ?? await seekFromS3(body.name, signedUrl);
  } catch (error) {
    console.error('Error dispatching work request: ', error);
    throw error;
  }
};

const fetchWork = async (
  experimentId,
  body,
  getState,
  dispatch,
  optionals = {},
) => {
  const {
    extras = undefined,
    timeout = 180,
    broadcast = false,
    onETagGenerated = () => { },
  } = optionals;

  const backendStatus = getBackendStatus(experimentId)(getState()).status;

  const { environment } = getState().networkResources;

  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  if (environment === Environment.DEVELOPMENT && !localStorage.getItem('disableCache')) {
    localStorage.setItem('disableCache', 'true');
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  if (body.name === 'GeneExpression') {
    return fetchGeneExpressionWorkWithoutLocalCache(
      experimentId,
      timeout,
      body,
      backendStatus,
      environment,
      broadcast,
      extras,
      onETagGenerated,
      dispatch,
      getState,
    );
  }

  const ETag = await generateETag(
    experimentId,
    body,
    extras,
    qcPipelineStartDate,
    environment,
    dispatch,
    getState,
  );

  onETagGenerated(ETag);

  // First, let's try to fetch this information from the local cache.
  const cachedData = await cache.get(ETag);

  if (cachedData) {
    return cachedData;
  }

  // If there is no response in S3, dispatch workRequest via the worker
  try {
    const { signedUrl, data } = await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        PipelineRunETag: qcPipelineStartDate,
        broadcast,
        ...extras,
      },
      dispatch,
    );

    const response = data ?? await seekFromS3(body.name, signedUrl);

    await cache.set(ETag, response);

    return response;
  } catch (error) {
    console.error('Error dispatching work request', error);
    throw error;
  }
};

export default fetchWork;
