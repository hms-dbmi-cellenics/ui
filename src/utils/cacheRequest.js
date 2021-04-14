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

const fetchCachedGeneExpressionWork = async (experimentId, timeout, body, getState) => {
  const { missingDataKeys, cachedData } = await decomposeBody(body, experimentId);
  const missingGenes = Object.keys(missingDataKeys);
  if (missingGenes.length === 0) {
    return cachedData;
  }

  const { pipeline: { startDate } } = getState().experimentSettings.pipelineStatus.status;
  const response = await sendWork(
    experimentId, timeout, { ...body, genes: missingGenes }, { ETagPipelineRun: startDate },
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

const fetchCachedWork = async (experimentId, timeout, body, getState) => {
  if (!isBrowser) {
    throw new Error('Disabling network interaction on server');
  }

  const { pipeline: { startDate, status } } = getState().experimentSettings.pipelineStatus.status;
  const pipelineErrors = ['FAILED', 'TIMED_OUT', 'ABORTED'];

  if (!startDate) {
    throw new Error('Cannot submit work before the data processing pipeline has been started.');
  }

  if (pipelineErrors.includes(status)) {
    throw new Error('Cannot submit work before the data processing pipeline has been started.');
  }

  if (body.name === 'GeneExpression') {
    return fetchCachedGeneExpressionWork(experimentId, timeout, body, getState);
  }

  const key = createObjectHash({ experimentId, body, startDate });
  const data = await cache.get(key);

  if (data) return data;
  const response = await sendWork(
    experimentId, timeout, body, { PipelineRunETag: startDate },
  );
  const responseData = JSON.parse(response.results[0].body);
  await cache.set(key, responseData);
  return responseData;
};

export { fetchCachedWork, fetchCachedGeneExpressionWork };
