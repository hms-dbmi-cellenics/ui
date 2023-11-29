/* eslint-disable global-require */
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';
import fake from '__test__/test-utils/constants';

import fetchWork from 'utils/work/fetchWork';
import { loadBackendStatus } from 'redux/actions/backendStatus';
import { makeStore } from 'redux/store';
import downloadFromS3 from 'utils/work/downloadFromS3';
import waitForWorkRequest from 'utils/work/waitForWorkRequest';
import dispatchWorkRequest from 'utils/work/dispatchWorkRequest';

const {
  mockCacheGet,
  mockCacheSet,
  mockSeekFromS3,
} = require('__test__/utils/work/fetchWork.mock');

jest.mock(
  'utils/cache',
  () => require('__test__/utils/work/fetchWork.mock').mockCacheModule,
);

jest.mock('utils/work/dispatchWorkRequest', () => jest.fn().mockReturnValue({
  ETag,
  signedUrl: 'fakeSignedUrl',
  request: null,
}));

jest.mock('utils/work/downloadFromS3');
jest.mock('utils/work/waitForWorkRequest');

const timeout = 10;
const ETag = 'fakeETag';
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

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(generateDefaultMockAPIResponses(fake.EXPERIMENT_ID)));

    store = makeStore();

    await store.dispatch(loadBackendStatus(fake.EXPERIMENT_ID));
  });

  it('returns data from cache if available', async () => {
    mockCacheGet.mockImplementationOnce(() => ({ cacheData: true }));

    const res = await fetchWork(
      fake.EXPERIMENT_ID,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockCacheGet).toHaveBeenCalledWith(ETag);
    expect(downloadFromS3).not.toHaveBeenCalled();
    expect(waitForWorkRequest).not.toHaveBeenCalled();
    expect(res).toMatchSnapshot();
  });

  it('returns data from S3 directly if available', async () => {
    downloadFromS3.mockReturnValueOnce({
      S3Data: true,
    });

    const res = await fetchWork(
      fake.EXPERIMENT_ID,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockCacheGet).toHaveBeenCalledWith(ETag);
    expect(downloadFromS3.mock.calls).toMatchSnapshot();
    expect(waitForWorkRequest).not.toHaveBeenCalled();
    expect(res).toMatchSnapshot();
  });

  it('waits and returns data from the worker', async () => {
    dispatchWorkRequest.mockReturnValueOnce({
      ETag,
      signedUrl: null,
      request: null,
    });

    waitForWorkRequest.mockReturnValueOnce({
      workerSignedUrl: 'fakeWorkerSignedUrl',
      data: true,
    });

    const res = await fetchWork(
      fake.EXPERIMENT_ID,
      nonGeneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockCacheGet).toHaveBeenCalledWith(ETag);
    expect(downloadFromS3.mock.calls).toMatchSnapshot();
    expect(waitForWorkRequest.mock.calls).toMatchSnapshot();
    expect(res).toMatchSnapshot();
  });

  it('does not use cache for gene expression request', async () => {
    downloadFromS3.mockReturnValueOnce({
      S3Data: true,
    });

    const res = await fetchWork(
      fake.EXPERIMENT_ID,
      geneExpressionWorkRequest,
      store.getState,
      store.dispatch,
      { timeout },
    );

    expect(mockCacheGet).not.toHaveBeenCalled();
    expect(mockCacheSet).not.toHaveBeenCalled();
    expect(downloadFromS3.calls).toMatchSnapshot();
    expect(waitForWorkRequest).not.toHaveBeenCalled();
    expect(res).toMatchSnapshot();
  });

  it('Throws an error if the dispatched work request throws an error', async () => {
    dispatchWorkRequest
      .mockReset()
      .mockImplementationOnce(() => Promise.reject(new Error('Worker timeout')));

    await expect(
      fetchWork(
        fake.EXPERIMENT_ID,
        nonGeneExpressionWorkRequest,
        store.getState,
        store.dispatch,
        { timeout: 10 },
      ),
    ).rejects.toThrow();

    expect(mockCacheGet).not.toHaveBeenCalled();
    expect(mockCacheSet).not.toHaveBeenCalled();

    // Not called ever because result is received straight from dispatchWorkRequest
    expect(mockSeekFromS3).toHaveBeenCalledTimes(0);
  });
});
