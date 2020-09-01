/* eslint-disable no-underscore-dangle */
import crypto from 'crypto';
import hash from 'object-hash';
import cache from './cache';
import sendWork from './sendWork';
import isBrowser from './environment';
import CustomError from './customError';

const createHash = (endpoint) => crypto.createHash('md5').update(endpoint).digest('hex');
const createObjectHash = (object) => hash.MD5(object);

// eslint-disable-next-line no-unused-vars
const objectToSortedString = (object) => {
  let sortedString = '';
  Object.keys(object).sort().forEach((key) => {
    sortedString = `${sortedString}${key}${object[key]}`;
  });
  return sortedString;
};


const cacheFetch = async (endpoint, options = {}, ttl = 900) => {
  throw new Error('not currently implemented -- buggy, needs concurrency support');

  /* eslint-disable no-unreachable */
  if (isBrowser) {
    // We ask the cache for a result if we don't specify a method or it's GET.
    const isGet = !options.method || options.method === 'GET';

    // IMPORTANT: endpoint needs to be converted into an ordered list of query args
    // can use objectToSortedString for this with a URL parser.
    const key = createHash(`${endpoint}`);

    // Check if it's in the cache at all.
    if (isGet) {
      const data = await cache.get(key);
      if (data) {
        return data;
      }
    }

    // Get response.
    const response = await fetch(endpoint, options);

    // If not an OK code, throw error.
    if (!response.ok) {
      throw new Error(
        `Fetch to endpoint ${endpoint} with options ${options} failed, response code is ${response.status}`,
      );
    }

    // Convert to JSON.
    const json = await response.json();

    // If get, set the cache with the new result.
    // If not, reset the cache as the request has changed the values.
    if (isGet) {
      await cache._set(key, json, ttl);
    } else {
      try {
        await cache._remove(key);
      } catch (e) {
        // Removal didn't happen as key is not in cache. Not a problem.
      }
    }

    return json;
  }
  throw new Error('Disabling network interaction on server');
  /* eslint-enable no-unreachable */
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
  cacheFetch, getFromApiExpectOK, fetchCachedWork, fetchCachedGeneExpressionWork,
};
