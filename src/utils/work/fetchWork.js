/* eslint-disable no-underscore-dangle */
import { MD5 } from 'object-hash';

import Environment, { isBrowser } from 'utils/environment';
import { calculateZScore } from 'utils/postRequestProcessing';
import { getBackendStatus } from 'redux/selectors';

import cache from 'utils/cache';
import { dispatchWorkRequest, seekFromS3 } from 'utils/work/seekWorkResponse';

const createObjectHash = (object) => MD5(object);

const decomposeBody = async (body, experimentId) => {
  const { genes: requestedGenes } = body;
  const missingDataKeys = {};
  const cachedData = {};

  await Promise.all(requestedGenes.map(async (g) => {
    const newBody = {
      ...body,
      genes: g,
    };
    const key = createObjectHash({ experimentId, newBody });
    const data = await cache.get(key);
    if (data) {
      cachedData[g] = data;
    } else {
      missingDataKeys[g] = key;
    }
  }));

  return { missingDataKeys, cachedData };
};

const fetchGeneExpressionWork = async (
  experimentId,
  timeout,
  body,
  backendStatus,
  environment,
  broadcast,
  extras,
) => {
  // Get only genes that are not already found in local storage.
  const { missingDataKeys, cachedData } = await decomposeBody(body, experimentId);

  const missingGenes = Object.keys(missingDataKeys);

  if (missingGenes.length === 0) {
    return cachedData;
  }

  // If new genes are needed, construct payload, try S3 for results,
  // and send out to worker if there's a miss.
  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const missingGenesBody = { ...body, genes: missingGenes };

  // If caching is disabled, we add an additional randomized key to the hash so we never reuse
  // past results.
  let cacheUniquenessKey = null;
  if (environment !== Environment.PRODUCTION && localStorage.getItem('disableCache') === 'true') {
    cacheUniquenessKey = Math.random();
  }

  const ETag = createObjectHash({
    experimentId, missingGenesBody, qcPipelineStartDate, extras, cacheUniquenessKey,
  });

  console.log('lcs fetchGeneExpressionWork 1');
  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag, experimentId);
  console.log('lcs fetchGeneExpressionWork 2');

  // If there is no response in S3, dispatch workRequest via the worker
  if (!response) {
    try {
      await dispatchWorkRequest(
        experimentId,
        missingGenesBody,
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
  }

  console.log('lcs fetchGeneExpressionWork 3');

  response = await seekFromS3(ETag, experimentId);
  console.log('lcs fetchGeneExpressionWork 4 ', response);
  response = calculateZScore(response);
  console.log('lcs fetchGeneExpressionWork 5');

  Object.keys(missingDataKeys).forEach(async (gene) => {
    await cache.set(missingDataKeys[gene], response[gene]);
  });

  return response;
};

const fetchWork = async (
  experimentId,
  body,
  getState,
  optionals = {},
) => {
  console.log('lcs starting fetch work');
  const { extras = undefined, timeout = 180, broadcast = false } = optionals;
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
    return fetchGeneExpressionWork(
      experimentId, timeout, body, backendStatus, environment, broadcast, extras,
    );
  }

  // If caching is disabled, we add an additional randomized key to the hash so we never reuse
  // past results.

  let cacheUniquenessKey = null;
  if (environment !== Environment.PRODUCTION && localStorage.getItem('disableCache') === 'true') {
    cacheUniquenessKey = Math.random();
  }

  const ETag = createObjectHash({
    experimentId, body, qcPipelineStartDate, extras, cacheUniquenessKey,
  });

  console.log('lcs fetch from cache');
  // First, let's try to fetch this information from the local cache.
  const data = await cache.get(ETag);

  console.log('lcs fetch from cache data', data);
  if (data) {
    return data;
  }

  console.log('lcs seeking from s3');
  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag, experimentId);

  console.log('lcs seeking from s3 response: ', response !== null);
  // If there is no response in S3, dispatch workRequest via the worker
  if (!response) {
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
    } catch (error) {
      console.error('Error dispatching work request', error);
      throw error;
    }
  }

  console.log('lcs seeking from s3 2');
  response = await seekFromS3(ETag, experimentId);
  console.log('lcs seeking from s3 2 response: ', response !== null);

  // If a work response is in s3, it is cacheable
  // (the cacheable or not option is managed in the worker)
  await cache.set(ETag, response);
  console.log('lcs set cache: ', response !== null);
  return response;
};

export { fetchWork, fetchGeneExpressionWork, createObjectHash };
