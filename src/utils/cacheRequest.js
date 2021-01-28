/* eslint-disable no-underscore-dangle */
import hash from 'object-hash';
import cache from './cache';
import sendWork from './sendWork';
import isBrowser from './environment';
import CustomError from './customError';

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

const getFromApiExpectOK = async (url) => {
  const response = await fetch(url);

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  throw new CustomError('There has been an error fetching the data.', response);
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

const fetchCachedGeneExpressionWork = async (experimentId, timeout, body) => {
  const { missingDataKeys, cachedData } = await decomposeBody(body, experimentId);
  const missingGenes = Object.keys(missingDataKeys);
  if (missingGenes.length === 0) {
    return cachedData;
  }
  const response = await sendWork(experimentId, timeout, { ...body, genes: missingGenes });

  const responseData = JSON.parse(response.results[0].body);

  // Preprocessing data before entering cache
  const processedData = calculateZScore(responseData);

  Object.keys(missingDataKeys).forEach(async (gene) => {
    await cache.set(missingDataKeys[gene], processedData[gene]);
  });

  return responseData;
};

const fetchCachedWork = async (experimentId, timeout, body) => {
  if (isBrowser) {
    if (body.name === 'GeneExpression') {
      return fetchCachedGeneExpressionWork(experimentId, timeout, body);
    }
    const key = createObjectHash({ experimentId, body });

    const data = await cache.get(key);
    if (data) return data;
    const response = await sendWork(experimentId, timeout, body);
    const responseData = JSON.parse(response.results[0].body);
    await cache.set(key, responseData);
    return responseData;
  }
  throw new Error('Disabling network interaction on server');
};

export {
  getFromApiExpectOK, fetchCachedWork, fetchCachedGeneExpressionWork,
};
