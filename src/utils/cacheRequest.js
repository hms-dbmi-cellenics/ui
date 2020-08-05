/* eslint-disable no-underscore-dangle */
import crypto from 'crypto';
import hash from 'object-hash';
import cache from './cache';
import sendWork from './sendWork';
import isBrowser from './environment';

const objectToSortedString = (object) => {
  let sortedString = '';
  Object.keys(object).sort().forEach((key) => {
    sortedString = `${sortedString}${key}${object[key]}`;
  });
  return sortedString;
};

const createHash = (endpoint) => crypto.createHash('md5').update(endpoint).digest('hex');
const createObjectHash = (object) => hash.MD5(object);

const cacheFetch = async (endpoint, options = {}, ttl = 900) => {
  if (isBrowser) {
    const throughCache = Object.keys(options).length === 0 || options.method === 'GET';
    let key;
    if (throughCache) {
      const orderedOptions = objectToSortedString(options);
      key = createHash(`${endpoint}${orderedOptions}`);
      const data = await cache.get(key);
      if (data) {
        return data;
      }
    }
    const response = await fetch(endpoint, options);
    const json = await response.json();
    if (throughCache) {
      await cache._set(key, json, ttl);
    }
    return json;
  }
  throw new Error('Disabling network interaction on server');
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

const fetchCachedGeneExpressionWork = async (experimentId, timeout, body, ttl = 900) => {
  const { missingDataKeys, cachedData } = await decomposeBody(body, experimentId);
  const missingGenes = Object.keys(missingDataKeys);
  if (missingGenes.length === 0) {
    return cachedData;
  }
  const response = await sendWork(experimentId, timeout, { ...body, genes: missingGenes });

  const responseData = JSON.parse(response.results[0].body);
  Object.keys(missingDataKeys).forEach(async (gene) => {
    await cache._set(missingDataKeys[gene], responseData[gene], ttl);
  });

  return responseData;
};

const fetchCachedWork = async (experimentId, timeout, body, ttl = 900) => {
  if (isBrowser) {
    if (body.name === 'GeneExpression') {
      return fetchCachedGeneExpressionWork(experimentId, timeout, body, ttl);
    }
    const key = createObjectHash({ experimentId, body });
    const data = await cache.get(key);
    if (data) return data;
    const response = await sendWork(experimentId, timeout, body);
    const responseData = JSON.parse(response.results[0].body);
    await cache._set(key, responseData, ttl);
    return responseData;
  }
  throw new Error('Disabling network interaction on server');
};


export {
  cacheFetch, fetchCachedWork, fetchCachedGeneExpressionWork, objectToSortedString,
};
