import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import waitForActions from 'redux-mock-store-await-actions';

import { CELL_SETS_DELETE } from 'redux/actionTypes/cellSets';
import initialState from 'redux/reducers/cellSets/initialState';
import deleteCellSet from 'redux/actions/cellSets/deleteCellSet';

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('deleteCellSet action', () => {
  const experimentId = '1234';
  const key = 'my-key';

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    store.dispatch(deleteCellSet(experimentId, key));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    store.dispatch(deleteCellSet(experimentId, key));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to delete cell set to the reducer', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    store.dispatch(deleteCellSet(experimentId, key));

    await waitForActions(store, [CELL_SETS_DELETE]);

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchSnapshot();
  });

  it('Sends fetch to the API when a cell set is deleted', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(deleteCellSet(experimentId, key));

    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, body] = fetch.mock.calls[0];

    expect(url).toEqual('http://localhost:3000/v2/experiments/1234/cellSets');
    expect(body).toMatchSnapshot();
  });

  it('Uses V2 URL when using API version V2', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(deleteCellSet(experimentId, key));

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, body] = fetch.mock.calls[0];

    expect(url).toEqual('http://localhost:3000/v2/experiments/1234/cellSets');
    expect(body).toMatchSnapshot();
  });
});
