/* eslint-disable no-underscore-dangle */
import hash from 'object-hash';
import cache from './cache';
import sendWork from './sendWork';
import { isBrowser } from './environment';
import { calculateZScore } from './postRequestProcessing';

const createObjectHash = (object) => hash.MD5(object);

// eslint-disable-next-line no-unused-vars
const objectToSortedString = (object) => {
  let sortedString = '';
  Object.keys(object).sort().forEach((key) => {
    sortedString = `${sortedString}${key}${object[key]}`;
  });
  return sortedString;
};

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

const fetchCachedGeneExpressionWork = async (
  experimentId,
  timeout,
  body,
  backendStatus,
  extras) => {
  const { missingDataKeys, cachedData } = await decomposeBody(body, experimentId);
  const missingGenes = Object.keys(missingDataKeys);
  if (missingGenes.length === 0) {
    return cachedData;
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  const response = await sendWork(
    experimentId,
    timeout,
    { ...body, genes: missingGenes },
    {
      ETagPipelineRun: qcPipelineStartDate,
      ...extras,
    },
  );

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

const fetchCachedWork = async (
  experimentId,
  timeout,
  body,
  backendStatus,
  extras) => {
  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  const { pipeline: { startDate: qcPipelineStartDate } } = backendStatus;

  if (body.name === 'GeneExpression') {
    return fetchCachedGeneExpressionWork(experimentId, timeout, body, backendStatus, extras);
  }

  const key = createObjectHash({
    experimentId, body, qcPipelineStartDate, extras,
  });

  const data = await cache.get(key);
  if (data) return data;

  const response = await sendWork(
    experimentId,
    timeout,
    body,
    {
      PipelineRunETag: qcPipelineStartDate,
      ...extras,
    },
  );

  const responseData = JSON.parse(response.results[0].body);
  await cache.set(key, responseData);
  return responseData;
};

export { fetchCachedWork, fetchCachedGeneExpressionWork };
