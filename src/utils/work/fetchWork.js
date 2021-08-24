/* eslint-disable no-underscore-dangle */
import hash from 'object-hash';
import cache from '../cache';
import { seekFromAPI, seekFromS3 } from './seekWorkResponse';
import { isBrowser } from '../environment';
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
  const ETag = createObjectHash({
    experimentId, missingGenesBody, qcPipelineStartDate, extras, lol: 'tgv 23f23f23222222gv11111fsdfwegwegwe',
  });

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag);
  console.warn('The response from S3 is', response);

  if (!response) {
    response = await seekFromAPI(
      experimentId,
      body,
      timeout,
      ETag,
      null,
      missingGenesBody,
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
  backendStatus,
  optionals = {},
) => {
  const { extras = undefined, timeout = 180, eventCallback = null } = optionals;

  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;
  if (body.name === 'GeneExpression') {
    return fetchGeneExpressionWork(experimentId, timeout, body, backendStatus, extras);
  }

  const ETag = createObjectHash({
    experimentId, body, qcPipelineStartDate, extras, lol: '4234r32f2f32322111112222f',
  });

  // First, let's try to fetch this information from the local cache.
  const data = await cache.get(ETag);
  if (data) {
    return data;
  }

  // Then, we may be able to find this in S3.
  let response = await seekFromS3(ETag);
  console.warn('The response from S3 is', response);

  // If response cannot be fetched, go to the worker.
  if (!response) {
    console.warn('no response in s3 for', body, 'sending to worker');
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

  console.log('finally', responseData);

  return responseData;
};

export { fetchWork, fetchGeneExpressionWork };
