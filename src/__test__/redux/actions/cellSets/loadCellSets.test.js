import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import initialState from 'redux/reducers/cellSets/initialState';

import '__test__/test-utils/setupTests';
import { CELL_SETS_ERROR, CELL_SETS_LOADED, CELL_SETS_LOADING } from 'redux/actionTypes/cellSets';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('loadCellSets action', () => {
  const experimentId = '1234';

  const cellSets = {
    name: 'one', color: '#ff0000', cellIds: new Set([1, 2, 3]),
  };

  const experimentSettings = {
    info: {
      sampleIds: [],
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({ cellSets }));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on normal operation', async () => {
    const store = mockStore({
      cellSets: {
        initialLoadPending: false, loading: false, error: false, updatingClustering: false,
      },
      experimentSettings,
    });

    await store.dispatch(loadCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on force reload', async () => {
    const store = mockStore({ cellSets: { loading: false, error: false }, experimentSettings });
    await store.dispatch(loadCellSets(experimentId, true));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_LOADED]);
  });

  it('Dispatches on initial load pending false and error state', async () => {
    const store = mockStore({
      cellSets: { initialLoadPending: false, loading: false, error: true },
      experimentSettings,
    });

    await store.dispatch(loadCellSets(experimentId));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_LOADED]);
    expect(store.getActions()).toMatchSnapshot();
  });

  it('Dispatches a loaded action when run with the initial state.', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_LOADED]);

    expect(store.getActions()).toMatchSnapshot();
  });

  it('Dispatches an error condition if fetch fails', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    await store.dispatch(loadCellSets(experimentId));

    expect(_.map(store.getActions(), 'type')).toEqual([CELL_SETS_LOADING, CELL_SETS_ERROR]);
    expect(store.getActions()).toMatchSnapshot();
  });

  it('Uses V2 URL when using API version V2', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    const fetchUrl = fetchMock.mock.calls[0][0];

    expect(fetchUrl).toEqual('http://localhost:3000/v2/experiments/1234/cellSets');
  });
});
