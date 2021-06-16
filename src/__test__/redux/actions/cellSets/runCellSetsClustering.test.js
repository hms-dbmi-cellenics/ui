import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import runCellSetsClustering from '../../../../redux/actions/cellSets/runCellSetsClustering';
import initialState from '../../../../redux/reducers/cellSets/initialState';
import sendWork from '../../../../utils/sendWork';

enableFetchMocks();
const mockStore = configureStore([thunk]);
jest.mock('localforage');
jest.mock('../../../../utils/cacheRequest');

jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
}));

const startDate = '2021-01-01T00:00:00';

const backendStatusStore = {
  backendStatus: { status: { pipeline: { startDate } } },
};

describe('runCellSetsClustering action', () => {
  const experimentId = '1234';

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
      experimentSettings: backendStatusStore,
    });
    store.dispatch(runCellSetsClustering(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({
      cellSets: { loading: false, error: true },
      experimentSettings: backendStatusStore,
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
      experimentSettings: backendStatusStore,
    });

    const flushPromises = () => new Promise(setImmediate);

    sendWork.mockImplementation(() => Promise.resolve());

    store.dispatch(runCellSetsClustering(experimentId, 0.5));

    expect(sendWork).toHaveBeenCalledTimes(1);
    expect(sendWork).toHaveBeenCalledWith(experimentId, 30, {
      name: 'ClusterCells',
      cellSetName: 'Louvain clusters',
      type: 'louvain',
      cellSetKey: 'louvain',
      config: { resolution: 0.5 },
    }, backendStatusStore.backendStatus.status);

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
      experimentSettings: backendStatusStore,
    });

    sendWork.mockImplementation(() => Promise.reject());

    const flushPromises = () => new Promise(setImmediate);

    store.dispatch(runCellSetsClustering(experimentId, 0.5));

    expect(sendWork).toHaveBeenCalledTimes(1);
    expect(sendWork).toHaveBeenCalledWith(experimentId, 30, {
      name: 'ClusterCells',
      cellSetName: 'Louvain clusters',
      type: 'louvain',
      cellSetKey: 'louvain',
      config: { resolution: 0.5 },
    }, backendStatusStore.backendStatus.status);

    await flushPromises();

    const loadingAction = store.getActions()[0];
    expect(loadingAction).toMatchSnapshot();

    const errorAction = store.getActions()[1];
    expect(errorAction).toMatchSnapshot();
  });
});
