/* eslint-disable no-underscore-dangle */
import crypto from 'crypto';
import hash from 'object-hash';
import cache from './cache';
import sendWork from './sendWork';

const createHash = (endpoint) => crypto.createHash('md5').update(endpoint).digest('hex');
const createObjectHash = (object) => hash.MD5(object);

const cacheFetch = async (endpoint, options, ttl = 900) => {
  const key = createHash(endpoint);
  const data = await cache.get(key);
  if (data) return data;
  const response = await fetch(endpoint, options);
  const json = await response.json();
  await cache._set(key, json, ttl);
  return json;
};

const fetchCachedWork = async (experimentId, timeout, body, ttl = 900) => {
  const key = createObjectHash({ experimentId, body });
  const data = await cache.get(key);
  if (data) return data;
  const response = await sendWork(experimentId, timeout, body);
  await cache._set(key, response.results, ttl);
  return response.results;
};

export { cacheFetch, fetchCachedWork };
