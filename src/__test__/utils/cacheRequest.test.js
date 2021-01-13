import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { /* cacheFetch, */ fetchCachedWork } from '../../utils/cacheRequest';

enableFetchMocks();

const fakeCacheKeyMappings = {
  A: '5b995fe9ed8f00cff155a59afa6c523c', // pragma: allowlist secret
  B: '660bcd9c0cb1fd9ca1d6cde2e2e8a60f', // pragma: allowlist secret
  C: 'a3324c2021c4855c5c788bffb860b087', // pragma: allowlist secret
  D: '77b59a783da49797d750d6904f9c5972', // pragma: allowlist secret
  E: 'ad0f4aeb13f02c99850ab52d473d187a', // pragma: allowlist secret
};

const fakeData = {
  A: {
    min: 0,
    max: 6.8,
    expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
    expressionType: 'raw',
  },
  B: {
    min: 0,
    max: 6.8,
    expression: [0, 0, 0, 2.56, 0, 6.8, 2.56],
    expressionType: 'raw',
  },
  C: {
    min: 0,
    max: 3.4,
    expression: [0, 0, 0, 3.56, 0, 4.8, 3.4],
    expressionType: 'raw',
  },
  D: {
    min: 0,
    max: 6.8,
    expression: [0, 0, 0, 1.56, 0, 6.8, 3.4],
    expressionType: 'raw',
  },
  E: { hello: 'world' },
};

const fakeCacheContents = {
  '5b995fe9ed8f00cff155a59afa6c523c': 'A', // pragma: allowlist secret
  '660bcd9c0cb1fd9ca1d6cde2e2e8a60f': 'B', // pragma: allowlist secret
  a3324c2021c4855c5c788bffb860b087: 'C', // pragma: allowlist secret
  ad0f4aeb13f02c99850ab52d473d187a: 'E', // pragma: allowlist secret
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
    const res = await fetchCachedWork(experimentId, 10, {
      name: 'GeneExpression',
      genes: ['A', 'B', 'C', 'D'],
      expressionType: 'raw',
    });
    expect(res).toEqual({ D: fakeData.D });
    expect(mockSendWork).toHaveBeenCalledWith(experimentId, 10, { name: 'GeneExpression', genes: ['D'], expressionType: 'raw' });
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
