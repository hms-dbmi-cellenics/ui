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
  mockSeekFromS3,
} = require('__test__/utils/work/fetchWork.mock');

jest.mock(
  'utils/cache',
  () => require('__test__/utils/work/fetchWork.mock').mockCacheModule,
);
jest.mock('utils/work/fetchWork');
// jest.mock(
//   'utils/work/fetchWork',
//   () => require('__test__/utils/work/fetchWork.mock').mockFetchWorkModule,
// );

const experimentId = '1234';

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

    fetchWork
      .mockReset()
      .mockImplementationOnce(() => workerDataResult(mockGenesListData));

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(experimentId)));

    store = makeStore();

    await store.dispatch(loadBackendStatus(experimentId));
  });

  it('runs correctly for gene expression work request', async () => {
    fetchWork
      .mockReset()
      .mockImplementation(() => workerDataResult(getFourGenesMatrix()));

    const res = await fetchWork(
      experimentId,
      geneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(fetchWork.calls).toMatchSnapshot();

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

    expect(fetchWork).toHaveBeenCalledWith(
      experimentId,
      nonGeneExpressionWorkRequest,
      timeout,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
    expect(mockCacheGet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledTimes(1);
    expect(mockCacheSet).toHaveBeenCalledWith(
      expect.anything(),
      mockGenesListData,
    );
    expect(mockSeekFromS3).toHaveBeenCalledTimes(0);
    expect(res).toEqual(mockGenesListData);
  });

  it('Throws an error if the dispatched work request throws an error', async () => {
    fetchWork
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
});
