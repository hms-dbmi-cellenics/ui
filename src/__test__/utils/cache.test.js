/* eslint-disable no-underscore-dangle */
import * as localForage from 'localforage';
import cache from 'utils/cache';

jest.mock('localforage', () => ({
  ready: jest.fn(() => new Promise((resolve) => resolve())),

  setItem: jest.fn((key) => new Promise((resolve, reject) => {
    if (key === 'invalid') {
      return reject();
    }
    resolve();
  })),

  config: jest.fn(),

  getItem: jest.fn((key) => new Promise((resolve, reject) => {
    switch (key) {
      case 'invalid':
        reject();
        break;
      case 'notExist':
        resolve(null);
        break;
      case 'shortTtl':
        resolve({ value: 'value', ttl: 1 });
        break;
      default:
        resolve({ value: 'value', ttl: Math.round(60 * 1000 + Date.now()) });
        break;
    }
  })),

  removeItem: jest.fn(() => new Promise((resolve) => resolve())),
  length: jest.fn(() => new Promise((resolve) => resolve(3))),
  keys: jest.fn(() => new Promise((resolve) => resolve(['key1', 'key2', 'key3']))),
}));

describe('cache init', () => {
  beforeEach(() => {
    // reseting cache
    cache.maxSize = 3;
    cache.lru = {};
    cache.size = 0;
    cache.head = null;
    cache.tail = null;
    cache.initialised = false;
  });
  it('Initialises the cache successfully', async () => {
    await cache._init();
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(3);
    expect(cache.head).toBe('key3');
    expect(cache.tail).toBe('key1');
    expect(cache.initialised).toBe(true);
  });
  it('Will not initialise if it is already initialised', async () => {
    cache.initialised = true;
    await cache._init();
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(0);
    expect(cache.head).toBe(null);
    expect(cache.tail).toBe(null);
    expect(cache.initialised).toBe(true);
  });
});

describe('cache set', () => {
  beforeEach(() => {
    // reseting cache
    cache.maxSize = 3;
    cache.lru = {};
    cache.size = 0;
    cache.head = null;
    cache.tail = null;
    cache.initialised = false;
  });
  it('set items to cache correctly', async () => {
    let result = await cache.set('key1', 'value1');
    expect(result).toBe(true);
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(1);
    expect(cache.head).toBe('key1');
    expect(cache.tail).toBe('key1');
    expect(localForage.setItem).toBeCalledWith('key1', { ttl: expect.any(Number), value: 'value1' });
    result = await cache.set('key2', 'value2');
    expect(result).toBe(true);
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(2);
    expect(cache.head).toBe('key2');
    expect(cache.tail).toBe('key1');
    expect(localForage.setItem).toBeCalledWith('key2', { ttl: expect.any(Number), value: 'value2' });
  });
  it('Rejects invalid cache', async () => {
    const consoleSpy = jest.spyOn(console, 'trace').mockImplementation(() => { });
    const result = await cache.set('invalid', 'value');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(0);
    expect(cache.head).toBe(null);
    expect(cache.tail).toBe(null);
  });
  it('Evicts item if cache size exceeds', async () => {
    cache.maxSize = 1;
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(1);
    expect(cache.head).toBe('key2');
    expect(cache.tail).toBe('key2');
  });
});

describe('cache get', () => {
  beforeEach(() => {
    // reseting cache
    cache.maxSize = 3;
    cache.lru = {};
    cache.size = 0;
    cache.head = null;
    cache.tail = null;
    cache.initialised = false;
  });
  it('get items from cache correctly', async () => {
    await cache.set('key1', 'value1');
    const value = await cache.get('key1');
    expect(value).toBe('value');
  });
  it('null if item is not in the cache', async () => {
    const value = await cache.get('notExist');
    expect(value).toBe(null);
  });
  it('if cache hit, put item on top', async () => {
    await cache.set('key1', 'value1');
    await cache.set('key2', 'value2');
    await cache.set('key3', 'value3');
    await cache.get('key1');
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(3);
    expect(cache.head).toBe('key1');
    expect(cache.tail).toBe('key2');
  });
  it('remove item that ttl expired - Ony one item in cache', async () => {
    cache.lru = {
      shortTtl: { next: null, previous: null },
    };
    cache.size = 1;
    cache.head = 'shortTtl';
    cache.tail = 'shortTtl';
    await cache.get('shortTtl');
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(0);
    expect(cache.head).toBe(null);
    expect(cache.tail).toBe(null);
  });
  it('remove item that ttl expired - Many items in cache', async () => {
    cache.lru = {
      key1: { next: 'shortTtl', previous: null },
      shortTtl: { next: 'key3', previous: 'key1' },
      key3: { next: null, previous: 'shortTtl' },
    };
    cache.size = 3;
    cache.head = 'key3';
    cache.tail = 'key1';
    await cache.get('shortTtl');
    expect(cache.lru).toMatchSnapshot();
    expect(cache.size).toBe(2);
    expect(cache.head).toBe('key3');
    expect(cache.tail).toBe('key1');
  });
});
