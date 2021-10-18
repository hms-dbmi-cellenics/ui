import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import runCellSetsClustering from '../../../../redux/actions/cellSets/runCellSetsClustering';
import initialState from '../../../../redux/reducers/cellSets/initialState';
import { seekFromAPI } from '../../../../utils/work/seekWorkResponse';
import '__test__/test-utils/setupTests';

enableFetchMocks();
const mockStore = configureStore([thunk]);

jest.mock('../../../../utils/work/seekWorkResponse', () => ({
  __esModule: true, // this property makes it work
  seekFromS3: jest.fn(() => new Promise((resolve) => { resolve(null); })),
  seekFromAPI: jest.fn(),
}));

jest.mock('../../../../utils/getTimeoutForWorkerTask', () => ({
  __esModule: true, // this property makes it work
  default: () => 60,
}));

const startDate = '2021-01-01T00:00:00';

describe('runCellSetsClustering action', () => {
  const experimentId = '1234';

  const backendStatus = { [experimentId]: { status: { pipeline: { startDate } } } };
  const experimentSettingsStore = {
    processing: { configureEmbedding: { clusteringSettings: { method: 'louvain' } } },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(store.getActions().length).toEqual(0);
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

    store.dispatch(runCellSetsClustering(experimentId));
    expect(store.getActions().length).toBeGreaterThan(0);
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
    store.dispatch(runCellSetsClustering(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches all required actions to update cell sets clustering.', async (done) => {
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

    const flushPromises = () => new Promise(setImmediate);

    seekFromAPI.mockImplementation(() => Promise.resolve());

    await store.dispatch(runCellSetsClustering(experimentId, 0.5));
    await flushPromises();

    expect(seekFromAPI).toHaveBeenCalledTimes(1);
    expect(seekFromAPI).toHaveBeenCalledWith(
      experimentId,
      {
        cellSetKey: 'louvain', cellSetName: 'Louvain clusters', config: { resolution: 0.5 }, name: 'ClusterCells', type: 'louvain',
      },
      60,
      'df391c411c86c58b43aefaefe54f0f52', // pragma: allowlist secret
      expect.any(Function),
      { PipelineRunETag: backendStatus[experimentId].status.pipeline.startDate },
    );

    await flushPromises();

    const loadingAction = store.getActions()[0];
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction).toMatchSnapshot();

    const savedAction = store.getActions()[2];
    expect(savedAction).toMatchSnapshot();
    done();
  });

  it('Dispatches error action when seekFromAPI fails', async () => {
    const store = mockStore({
      cellSets: { ...initialState, loading: false, error: false },
      experimentSettings: experimentSettingsStore,
      backendStatus,
      networkResources: {
        environment: 'testing',
      },
    });

    seekFromAPI.mockImplementation(() => Promise.reject());

    const flushPromises = () => new Promise(setImmediate);

    await store.dispatch(runCellSetsClustering(experimentId, 0.5));
    await flushPromises();

    expect(seekFromAPI).toHaveBeenCalledTimes(1);
    expect(seekFromAPI).toHaveBeenCalledWith(
      experimentId,
      {
        cellSetKey: 'louvain', cellSetName: 'Louvain clusters', config: { resolution: 0.5 }, name: 'ClusterCells', type: 'louvain',
      },
      60,
      'df391c411c86c58b43aefaefe54f0f52', // pragma: allowlist secret
      expect.any(Function),
      { PipelineRunETag: backendStatus[experimentId].status.pipeline.startDate },
    );

    await flushPromises();

    const loadingAction = store.getActions()[0];
    expect(loadingAction).toMatchSnapshot();

    const errorAction = store.getActions()[1];
    expect(errorAction).toMatchSnapshot();
  });
});
