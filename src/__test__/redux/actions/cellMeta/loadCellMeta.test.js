import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import loadCellMeta from 'redux/actions/cellMeta';
import initialState from 'redux/reducers/cellMeta/initialState';
import '__test__/test-utils/setupTests';

jest.mock('utils/work/fetchWork');
jest.mock('utils/getTimeoutForWorkerTask', () => () => 1);

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('loadCellMeta action', () => {
  const experimentId = '1234';
  const metaName = 'mitochondrialContent';

  const backendStatus = {
    [experimentId]: {
      status: {
        pipeline: {
          startDate: '2021-01-01T00:00',
        },
      },
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on normal operation', async () => {
    const store = mockStore({
      cellMeta: {
        ...initialState,
        [metaName]: {
          ...initialState[metaName],
          loading: false,
          error: false,
        },
      },
      backendStatus,
    });

    store.dispatch(loadCellMeta(experimentId, metaName));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on loading state', async () => {
    const store = mockStore({
      cellMeta: {
        ...initialState,
        [metaName]: {
          ...initialState[metaName],
          loading: true,
        },
      },
      backendStatus,
    });

    store.dispatch(loadCellMeta(experimentId, metaName));
    expect(store.getActions().length).toBeGreaterThan(0);
  });

  it('Dispatches on loading and error state', async () => {
    const error = 'error';
    const store = mockStore({
      cellMeta: {
        ...initialState,
        [metaName]: {
          ...initialState[metaName],
          loading: true,
          error,
        },
      },
      backendStatus,
    });

    store.dispatch(loadCellMeta(experimentId, metaName));
    expect(store.getActions().length).toBeGreaterThan(0);
  });

  it('Dispatches a loading action when run after an error condition.', async () => {
    const error = 'error';
    const store = mockStore({
      cellMeta: {
        ...initialState,
        [metaName]: {
          ...initialState[metaName],
          loading: false,
          error,
        },
      },
      backendStatus,
    });

    store.dispatch(loadCellMeta(experimentId, metaName));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches a loaded action when run with the initial state.', async () => {
    const store = mockStore({
      cellMeta: initialState,
      backendStatus,
    });

    store.dispatch(loadCellMeta(experimentId, metaName));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches an error condition if fetch fails', async () => {
    const store = mockStore({
      cellMeta: initialState,
      backendStatus,
    });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    store.dispatch(loadCellMeta(experimentId, metaName));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
