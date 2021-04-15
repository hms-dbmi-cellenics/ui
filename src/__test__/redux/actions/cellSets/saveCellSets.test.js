import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import saveCellSets from '../../../../redux/actions/cellSets/saveCellSets';
import initialState from '../../../../redux/reducers/cellSets/initialState';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('saveCellSets action', () => {
  const experimentId = '1234';

  const hierarchy = [{ key: 'root', children: [{ key: 'child1' }, { key: 'child2' }] }];
  const properties = {
    root: { name: 'root node', rootNode: true, cellIds: new Set() },
    child1: { name: 'child 1', color: '#ffff00', cellIds: new Set() },
    child2: { name: 'child 2', color: '#ff00ff', cellIds: new Set() },
  };

  const treeData = [{
    key: 'root',
    children: [
      {
        key: 'child1', name: 'child 1', color: '#ffff00', cellIds: [],
      },
      {
        key: 'child2', name: 'child 2', color: '#ff00ff', cellIds: [],
      }],
    name: 'root node',
    rootNode: true,
    cellIds: [],
  }];

  beforeEach(() => {
    const response = new Response(JSON.stringify({ one: 'one' }));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    store.dispatch(saveCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { error: true, loading: false } });
    store.dispatch(saveCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches a saved action when run correctly.', async () => {
    const store = mockStore({
      cellSets: {
        ...initialState, loading: false, hierarchy, properties,
      },
    });
    const flushPromises = () => new Promise(setImmediate);
    store.dispatch(saveCellSets(experimentId));

    await flushPromises();

    const firstAction = store.getActions()[0];

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/experiments/1234/cellSets',
      {
        body: JSON.stringify(treeData),
        headers: {
          Authorization: 'Bearer admin',
          'Content-Type': 'application/json',
        },
        method: 'PUT',
      },
    );
    expect(firstAction).toMatchSnapshot();
  });

  it('Dispatches a notification when fetch fails.', async () => {
    const store = mockStore({
      cellSets: {
        ...initialState, loading: false, hierarchy, properties,
      },
    });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));
    store.dispatch(saveCellSets(experimentId));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
