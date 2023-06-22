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

  // Then, we may be able to find this in S3.
  const response = await seekFromS3(ETag, experimentId, body.name);

  if (response) return response;

  // If there is no response in S3, dispatch workRequest via the worker
  try {
    await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        ETagPipelineRun: qcPipelineStartDate,
        broadcast,
        ...extras,
      },
    );
  } catch (error) {
    console.error('Error dispatching work request: ', error);
    throw error;
  }

  return await seekFromS3(ETag, experimentId, body.name);
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
  const data = await cache.get(ETag);

  if (data) {
    return data;
  }

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag, experimentId, body.name);

  if (response) return response;

  // If there is no response in S3, dispatch workRequest via the worker
  try {
    await dispatchWorkRequest(
      experimentId,
      body,
      timeout,
      ETag,
      {
        PipelineRunETag: qcPipelineStartDate,
        broadcast,
        ...extras,
      },
    );

    response = await seekFromS3(ETag, experimentId, body.name);
  } catch (error) {
    console.error('Error dispatching work request', error);
    throw error;
  }

  await cache.set(ETag, response);

  return response;
};

export default fetchWork;
