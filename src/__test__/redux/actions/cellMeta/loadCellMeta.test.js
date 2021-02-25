import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import loadCellMeta from '../../../../redux/actions/cellMeta';
import initialState from '../../../../redux/reducers/cellMeta/initialState';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('loadCellMeta action', () => {
  const experimentId = '1234';
  const metaName = 'mitochondrialContent';

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
    });

    store.dispatch(loadCellMeta(experimentId, metaName));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches a loaded action when run with the initial state.', async () => {
    const store = mockStore({
      cellMeta: initialState,
    });

    store.dispatch(loadCellMeta(experimentId, metaName));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches an error condition if fetch fails', async () => {
    const store = mockStore({
      cellMeta: initialState,
    });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    store.dispatch(loadCellMeta(experimentId, metaName));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
