/* eslint-disable no-underscore-dangle */
import { Environment, isBrowser } from 'utils/deploymentInfo';
import { getBackendStatus } from 'redux/selectors';

import cache from 'utils/cache';
import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';
import generateETag from 'utils/work/generateETag';

const downloadWorkToFile = async (
  experimentId,
  body,
  getState,
  optionals = {},
) => {
  const {
    extras = undefined,
    timeout = 180,
    broadcast = false,
    customResultHandler = undefined,
    customFileName = undefined,
    cacheable = true,
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

  const ETag = generateETag(
    experimentId,
    body,
    extras,
    qcPipelineStartDate,
    environment,
  );

  if (cacheable) {
    // First, let's try to fetch this information from the local cache.
    const data = await cache.get(ETag);

    if (data) {
      return data;
    }
  }

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag, experimentId, { customResultHandler, customFileName });

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

    response = await seekFromS3(ETag, experimentId, { customResultHandler, customFileName });
  } catch (error) {
    console.error('Error dispatching work request', error);
    throw error;
  }

  if (cacheable) {
    await cache.set(ETag, response);
  }

  return response;
};

export default downloadWorkToFile;
