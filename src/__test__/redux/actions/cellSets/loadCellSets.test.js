import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import loadCellSets from 'redux/actions/cellSets/loadCellSets';
import initialState from 'redux/reducers/cellSets/initialState';

import config from 'config';
import { api } from 'utils/constants';

import '__test__/test-utils/setupTests';

jest.mock('config');

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

    config.currentApiVersion = api.V1;

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on normal operation', async () => {
    const store = mockStore({ cellSets: { loading: false, error: false }, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches on force reload ', async () => {
    const store = mockStore({ cellSets: { loading: false, error: false }, experimentSettings });
    await store.dispatch(loadCellSets(experimentId, true));
    expect(store.getActions().length).toEqual(1);
  });

  it('Dispatches on loading and error state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: true }, experimentSettings });
    store.dispatch(loadCellSets(experimentId));
    expect(store.getActions().length).toBeGreaterThan(0);
  });

  it('Dispatches a loading action when run after an error condition.', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true }, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches a loaded action when run with the initial state.', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches an error condition if fetch fails', async () => {
    const store = mockStore({ cellSets: initialState, experimentSettings });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));

    await store.dispatch(loadCellSets(experimentId));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });

  it('Uses V2 URL when using API version V2', async () => {
    config.currentApiVersion = api.V2;

    const store = mockStore({ cellSets: initialState, experimentSettings });
    await store.dispatch(loadCellSets(experimentId));

    const fetchUrl = fetchMock.mock.calls[0][0];

    expect(fetchUrl).toMatch(/v2\/experiments\/.*\/cellSets/);
  });
});
