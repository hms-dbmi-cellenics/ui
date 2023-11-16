/* eslint-disable global-require */
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, { generateDefaultMockAPIResponses, workerDataResult } from '__test__/test-utils/mockAPI';

import fetchWork from 'utils/work/fetchWork';
import { getFourGenesMatrix } from '__test__/utils/ExpressionMatrix/testMatrixes';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';

const {
  mockGenesListData,
  mockCacheGet,
  mockCacheSet,
  mockDispatchWorkRequest,
  mockSeekFromS3,
} = require('__test__/utils/work/fetchWork.mock');

jest.mock(
  'utils/cache',
  () => require('__test__/utils/work/fetchWork.mock').mockCacheModule,
);
jest.mock(
  'utils/work/seekWorkResponse',
  () => require('__test__/utils/work/fetchWork.mock').mockSeekWorkResponseModule,
);

const experimentId = '1234';
const NON_GENE_EXPRESSION_ETAG = 'bac72df9fc53b884b7ae1dfeb5356e01'; // pragma: allowlist secret
const GENE_EXPRESSION_ABCD_ETAG = '1732d6bcb5134d736e9f1ec36ec81c0d'; // pragma: allowlist secret
const timeout = 10;

const nonGeneExpressionWorkRequest = {
  name: 'ListGenes',
};

const geneExpressionWorkRequest = {
  name: 'GeneExpression',
  genes: ['A', 'B', 'C', 'D'],
};

enableFetchMocks();

describe('fetchWork', () => {
  let store;

  beforeEach(async () => {
    Storage.prototype.setItem = jest.fn();

    jest.clearAllMocks();

    mockDispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(() => workerDataResult(mockGenesListData));

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    store = makeStore();

    await store.dispatch(loadBackendStatus(experimentId));
  });

  it('runs correctly for gene expression work request', async () => {
    mockDispatchWorkRequest
      .mockReset()
      .mockImplementation(() => workerDataResult(getFourGenesMatrix()));

    const res = await fetchWork(
      experimentId,
      geneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    // Temporarily disabled the cache for gene expression
    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      experimentId,
      { name: 'GeneExpression', genes: ['A', 'B', 'C', 'D'] },
      timeout,
      GENE_EXPRESSION_ABCD_ETAG,
      expect.anything(),
      expect.anything(),
    );

    // The expected response should be fine

    // Disabled gene expression cache, so the whole thing is being loaded
    // expect(mockCacheGet).toHaveBeenCalledTimes(4);
    // expect(mockCacheSet).toHaveBeenCalledTimes(1);
    // expect(mockCacheSet).toHaveBeenCalledWith(
    //   mockCacheKeyMappings.D,
    //   expectedResponse.D,
    // );
    expect(res).toMatchSnapshot();
    expect(mockSeekFromS3).toHaveBeenCalledTimes(0);
  });

  it('runs correctly for non gene expression work request', async () => {
    const res = await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      experimentId,
      nonGeneExpressionWorkRequest,
      timeout,
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
      expect.anything(),
    );
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledWith(
      NON_GENE_EXPRESSION_ETAG,
      mockGenesListData,
    );
    expect(mockSeekFromS3).toHaveBeenCalledTimes(0);
    expect(res).toEqual(mockGenesListData);
  });

  it('Throws an error if the dispatched work request throws an error', async () => {
    mockDispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(() => Promise.reject(new Error('Worker timeout')));

    await expect(
      fetchWork(
        experimentId,
        nonGeneExpressionWorkRequest,
        store.getState,
        store.dispatch,
        { timeout: 10 },
      ),
    ).rejects.toThrow();

    expect(mockCacheGet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).not.toHaveBeenCalled();

    // Not called ever because result is received straight from dispatchWorkRequest
    expect(mockSeekFromS3).toHaveBeenCalledTimes(0);
  });

  it('does not change ETag if caching is enabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'false' : null));

    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
      expect.anything(),
    );
  });

  it('changes ETag if caching is disabled', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'true' : null));

    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockDispatchWorkRequest).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
  });

  it('Caching is disabled by default if environment is dev', async () => {
    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockDispatchWorkRequest).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
    );
  });

  it('Setting cache to false in development enables cache', async () => {
    Storage.prototype.getItem = jest.fn((key) => (key === 'disableCache' ? 'false' : null));

    await fetchWork(
      experimentId,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockDispatchWorkRequest).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      NON_GENE_EXPRESSION_ETAG,
      expect.anything(),
      expect.anything(),
    );
  });
});
