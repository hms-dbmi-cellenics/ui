import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import runCellSetsClustering from '../../../../redux/actions/cellSets/runCellSetsClustering';
import initialState from '../../../../redux/reducers/cellSets/initialState';
import { seekFromAPI } from '../../../../utils/work/seekWorkResponse';

enableFetchMocks();
const mockStore = configureStore([thunk]);
jest.mock('localforage');
jest.mock('../../../../utils/work/fetchWork');

jest.mock('../../../../utils/work/seekWorkResponse', () => ({
  __esModule: true, // this property makes it work
  seekFromS3: jest.fn(() => new Promise((resolve) => { resolve(null); })),
  seekFromAPI: jest.fn(),
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

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({
      cellSets: { loading: true, error: false },
      experimentSettings: experimentSettingsStore,
      backendStatus,
    });

    store.dispatch(runCellSetsClustering(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({
      cellSets: { loading: false, error: true },
      experimentSettings: experimentSettingsStore,
      backendStatus,
    });
    store.dispatch(runCellSetsClustering(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches all required actions to update cell sets clustering.', async (done) => {
    const store = mockStore({
      cellSets: {
        ...initialState,
        loading: false,
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
    });

    const flushPromises = () => new Promise(setImmediate);

    seekFromAPI.mockImplementation(() => Promise.resolve());

    store.dispatch(runCellSetsClustering(experimentId, 0.5));

    expect(seekFromAPI).toHaveBeenCalledTimes(1);
    expect(seekFromAPI).toHaveBeenCalledWith(experimentId, 300, {
      name: 'ClusterCells',
      cellSetName: 'Louvain clusters',
      type: 'louvain',
      cellSetKey: 'louvain',
      config: { resolution: 0.5 },
    }, backendStatus[experimentId].status);

    await flushPromises();

    const loadingAction = store.getActions()[0];
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction).toMatchSnapshot();

    const savedAction = store.getActions()[2];
    expect(savedAction).toMatchSnapshot();
    done();
  });

  it('Dispatches error action when sendWord fails', async () => {
    const store = mockStore({
      cellSets: { ...initialState, loading: false },
      experimentSettings: experimentSettingsStore,
      backendStatus,
    });

    seekFromAPI.mockImplementation(() => Promise.reject());

    const flushPromises = () => new Promise(setImmediate);

    store.dispatch(runCellSetsClustering(experimentId, 0.5));

    expect(seekFromAPI).toHaveBeenCalledTimes(1);
    expect(seekFromAPI).toHaveBeenCalledWith(experimentId, 300, {
      name: 'ClusterCells',
      cellSetName: 'Louvain clusters',
      type: 'louvain',
      cellSetKey: 'louvain',
      config: { resolution: 0.5 },
    }, backendStatus[experimentId].status);

    await flushPromises();

    const loadingAction = store.getActions()[0];
    expect(loadingAction).toMatchSnapshot();

    const errorAction = store.getActions()[1];
    expect(errorAction).toMatchSnapshot();
  });
});
