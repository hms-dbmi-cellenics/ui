import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import runCellSetsClustering from 'redux/actions/cellSets/runCellSetsClustering';
import { dispatchWorkRequest } from 'utils/work/seekWorkResponse';

import initialState from 'redux/reducers/cellSets/initialState';

enableFetchMocks();
const mockStore = configureStore([thunk]);

jest.mock('utils/work/seekWorkResponse', () => ({
  __esModule: true, // this property makes it work
  seekFromS3: jest.fn(() => new Promise((resolve) => { resolve(null); })),
  dispatchWorkRequest: jest.fn(),
}));

jest.mock('utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

jest.mock('object-hash', () => ({
  MD5: () => 'mock-hash',
}));

const startDate = '2021-01-01T00:00:00';

describe('runCellSetsClustering action', () => {
  const experimentId = '1234';

  const backendStatus = { [experimentId]: { status: { pipeline: { startDate } } } };
  const experimentSettingsStore = {
    processing: { configureEmbedding: { clusteringSettings: { method: 'louvain' } } },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.mockResolvedValueOnce(response);

    dispatchWorkRequest.mockImplementation(() => Promise.resolve());
  });

  it('Does not dispatch on loading state if clustering is already recomputing', async () => {
    const store = mockStore({
      cellSets: { loading: true, error: false, updatingClustering: true },
      experimentSettings: experimentSettingsStore,
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    store.dispatch(runCellSetsClustering(experimentId));
  });

  it('Does dispatch on loading state if clustering is not recomputing', async () => {
    const store = mockStore({
      cellSets: { loading: true, error: false, updatingClustering: false },
      experimentSettings: experimentSettingsStore,
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    await store.dispatch(runCellSetsClustering(experimentId));
    expect(dispatchWorkRequest).toHaveBeenCalledTimes(1);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({
      cellSets: { loading: false, error: true },
      experimentSettings: experimentSettingsStore,
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });
    await store.dispatch(runCellSetsClustering(experimentId));
    expect(dispatchWorkRequest).not.toHaveBeenCalled();
  });

  it('Dispatches all required actions to update cell sets clustering.', async () => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        loading: false,
        error: false,
        hierarchy: [{ children: [], key: 'scratchpad' }],
        properties: {
          scratchpad: {
            cellIds: new Set(),
            color: undefined,
            name: 'Scratchpad',
            rootNode: true,
            type: 'cellSets',
          },
        },
      },
      experimentSettings: experimentSettingsStore,
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    await store.dispatch(runCellSetsClustering(experimentId, 0.5));

    expect(dispatchWorkRequest).toHaveBeenCalledTimes(1);
    expect(dispatchWorkRequest.mock.calls).toMatchSnapshot();
  });

  it('Dispatches error action when dispatchWorkRequest fails', async () => {
    const store = mockStore({
      cellSets: { ...initialState, loading: false, error: false },
      experimentSettings: experimentSettingsStore,
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    dispatchWorkRequest.mockImplementation(() => Promise.reject());

    await store.dispatch(runCellSetsClustering(experimentId, 0.5));

    expect(dispatchWorkRequest).toHaveBeenCalledTimes(1);
    expect(dispatchWorkRequest.mock.calls).toMatchSnapshot();
  });
});
