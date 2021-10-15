/* eslint-disable no-underscore-dangle */
import hash from 'object-hash';

import { getBackendStatus } from '../../redux/selectors';

import cache from '../cache';
import { seekFromAPI, seekFromS3 } from './seekWorkResponse';
import Environment, { isBrowser } from '../environment';
import { calculateZScore } from '../postRequestProcessing';

const createObjectHash = (object) => hash.MD5(object);

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
  if (environment !== Environment.PRODUCTION && localStorage.getItem('disableCache') === true) {
    cacheUniquenessKey = Math.random();
  }

  const ETag = createObjectHash({
    experimentId, missingGenesBody, qcPipelineStartDate, extras, cacheUniquenessKey,
  });

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag);

  if (!response) {
    response = await seekFromAPI(
      experimentId,
      missingGenesBody,
      timeout,
      ETag,
      null,
      {
        ETagPipelineRun: qcPipelineStartDate,
        ...extras,
      },
    );
  }

  const responseData = JSON.parse(response.results[0].body);

  if (!responseData[missingGenes[0]]?.error) {
    // Preprocessing data before entering cache
    const processedData = calculateZScore(responseData);

    Object.keys(missingDataKeys).forEach(async (gene) => {
      await cache.set(missingDataKeys[gene], processedData[gene]);
    });
  }

  return responseData;
};

const fetchWork = async (
  experimentId,
  body,
  getState,
  optionals = {},
) => {
  const { extras = undefined, timeout = 180, eventCallback = null } = optionals;
  const backendStatus = getBackendStatus(experimentId)(getState()).status;

  const { environment } = getState().networkResources;

  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;
  if (body.name === 'GeneExpression') {
    return fetchGeneExpressionWork(experimentId, timeout, body, backendStatus, environment, extras);
  }

  // If caching is disabled, we add an additional randomized key to the hash so we never reuse
  // past results.
  let cacheUniquenessKey = null;
  if (environment !== Environment.PRODUCTION && localStorage.getItem('disableCache') === true) {
    cacheUniquenessKey = Math.random();
  }

  const ETag = createObjectHash({
    experimentId, body, qcPipelineStartDate, extras, cacheUniquenessKey,
  });

  // First, let's try to fetch this information from the local cache.
  const data = await cache.get(ETag);
  if (data) {
    return data;
  }

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag);

  // If response cannot be fetched, go to the worker.
  if (!response) {
    response = await seekFromAPI(
      experimentId,
      body,
      timeout,
      ETag,
      eventCallback,
      {
        PipelineRunETag: qcPipelineStartDate,
        ...extras,
      },
    );
  }

  if (!response) {
    console.debug(`No response immediately resolved for ${body} (ETag: ${ETag}) -- this is probably an event subscription.`);
    return response;
  }

  const responseData = JSON.parse(response.results[0].body);

  if (response.response?.cacheable) {
    await cache.set(ETag, responseData);
  }

  return responseData;
};

export { fetchWork, fetchGeneExpressionWork };
