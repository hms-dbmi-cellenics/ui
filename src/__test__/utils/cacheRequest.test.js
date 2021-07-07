import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { /* cacheFetch, */ fetchCachedWork } from '../../utils/cacheRequest';

enableFetchMocks();

const fakeCacheKeyMappings = {
  A: 'fd3161a878f67ebf54018720cffd6a66', // pragma: allowlist secret
  B: '10250a11679234110a1c260d6fd81d3c', // pragma: allowlist secret
  C: '76bf160685c4c80c67abd9a701da23e6', // pragma: allowlist secret
  D: '21671038b9ac73c1f08a94c8213cb872', // pragma: allowlist secret
  E: '33faa711a94a2028b5bae1778126aec0', // pragma: allowlist secret
};

const fakeData = {
  A: {
    rawExpression: {
      min: 0,
      max: 6.8,
      mean: 1.68,
      stdev: 2.597331964,
      expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
    },
    truncatedExpression: {
      min: 0,
      max: 6.8,
      mean: 1.68,
      stdev: 2.597331964,
      expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
    },
  },
  B: {
    rawExpression: {
      min: 0,
      max: 6.8,
      mean: 1.702857143,
      stdev: 2.551115536,
      expression: [0, 0, 0, 2.56, 0, 6.8, 2.56],
    },
    truncatedExpression: {
      min: 0,
      max: 6.8,
      mean: 1.702857143,
      stdev: 2.551115536,
      expression: [0, 0, 0, 2.56, 0, 6.8, 2.56],
    },
  },
  C: {
    rawExpression: {
      min: 0,
      max: 3.4,
      mean: 1.68,
      stdev: 2.141525936,
      expression: [0, 0, 0, 3.56, 0, 4.8, 3.4],
    },
    truncatedExpression: {
      min: 0,
      max: 3.4,
      mean: 1.68,
      stdev: 2.141525936,
      expression: [0, 0, 0, 3.56, 0, 4.8, 3.4],
    },
  },
  D: {
    zScore: [
      -0.6468175894669735,
      -0.6468175894669735,
      -0.6468175894669735,
      -0.04620125639049807,
      -0.6468175894669735,
      1.971253605994586,
      0.6622180082638063,
    ],
    rawExpression: {
      min: 0,
      max: 6.8,
      mean: 1.68,
      stdev: 2.597331964,
      expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
    },
    truncatedExpression: {
      min: 0,
      max: 6.8,
      mean: 1.68,
      stdev: 2.597331964,
      expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
      zScore: [
        -0.6468175894669735,
        -0.6468175894669735,
        -0.6468175894669735,
        -0.04620125639049807,
        -0.6468175894669735,
        1.971253605994586,
        0.6622180082638063,
      ],
    },
  },
  E: { hello: 'world' },
};

const fakeCacheContents = {
  fd3161a878f67ebf54018720cffd6a66: 'A', // pragma: allowlist secret
  '10250a11679234110a1c260d6fd81d3c': 'B', // pragma: allowlist secret
  f5c957411a28de68f35e1f5c8a29da7e: 'C', // pragma: allowlist secret
  '33faa711a94a2028b5bae1778126aec0': 'E', // pragma: allowlist secret
};

const mockGet = jest.fn((x) => {
  if (x in fakeCacheContents) {
    return fakeData[fakeCacheContents[x]];
  }
  return null;
});
const mockSet = jest.fn();
const mockRemove = jest.fn();

const mockSendWork = jest.fn((experimentId, timeout, body) => {
  const wantedGenes = body.genes;
  const returnedBody = {};
  wantedGenes.forEach((gene) => {
    // eslint-disable-next-line no-param-reassign
    returnedBody[gene] = fakeData[gene];
  });
  return {
    results: [{
      body: JSON.stringify(
        returnedBody,
      ),
    }],
  };
});

jest.mock('../../utils/cache', () => ({
  get: jest.fn((x) => mockGet(x)),
  set: jest.fn((key, val) => mockSet(key, val)),
  _remove: jest.fn((key) => mockRemove(key)),
}));

jest.mock('../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn((experimentId, timeout, body) => mockSendWork(experimentId, timeout, body)),
}));

describe('tests for fetchCachedWork', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('test fetchCachedWork with GeneExpression task', async () => {
    const experimentId = '1234';
    const res = await fetchCachedWork(
      experimentId, 10,
      {
        name: 'GeneExpression',
        genes: ['A', 'B', 'C', 'D'],
      },
      {
        pipeline: {
          status: 'SUCCEEDED',
          startDate: '2021-01-01T01:01:01.000Z',
        },
      },
    );
    expect(res).toEqual({ D: fakeData.D });
    expect(mockSendWork).toHaveBeenCalledWith(experimentId, 10, { name: 'GeneExpression', genes: ['D'] });
    expect(mockGet).toHaveBeenCalledTimes(4);
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith(fakeCacheKeyMappings.D, fakeData.D);
  });
});

describe('tests for cacheFetch', () => {
  beforeEach(() => {
    const response = new Response(JSON.stringify({}));
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  /*
  it('attempts to fetch results from cache when the request is GET', async () => {
    await cacheFetch('https://test.com', { method: 'GET' });
    expect(mockGet).toBeCalledTimes(1);
    expect(mockSet).toBeCalledTimes(0);
    expect(mockRemove).toBeCalledTimes(0);
  });

  it(
    'attempts to fetch results from cache when the request is GET and not already in cache',
    async () => {
      await cacheFetch('https://test-not-in-cache.com', { method: 'GET' });
      expect(mockGet).toBeCalledTimes(1);
      expect(mockSet).toBeCalledTimes(1);
      expect(mockRemove).toBeCalledTimes(0);
    }
  );

  it('does not fetch results from cache when the request is PUT', async () => {
    await cacheFetch('https://test.com', { method: 'PUT' });
    expect(mockSet).toBeCalledTimes(0);
    expect(mockGet).toBeCalledTimes(0);
    expect(mockRemove).toBeCalledTimes(1);
  });
  it('retrives data from cache if no options are provided', async () => {
    await cacheFetch('https://test.com');
    expect(mockGet).toBeCalledTimes(1);
    expect(mockSet).toBeCalledTimes(0);
    expect(mockRemove).toBeCalledTimes(0);
  });
  */
});
