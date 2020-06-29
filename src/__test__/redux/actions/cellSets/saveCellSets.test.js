import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import saveCellSets from '../../../../redux/actions/cellSets/saveCellSets';
import initialState from '../../../../redux/reducers/cellSetsReducer/initialState';
import { CELL_SETS_SAVE } from '../../../../redux/actionTypes/cellSets';
import { NOTIFICATIONS_PUSH_MESSAGE } from '../../../../redux/actionTypes/notifications';


enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('saveCellSets action', () => {
  const experimentId = '1234';

  const hierarchy = [{ key: 'root', children: [{ key: 'child1' }, { key: 'child2' }] }];
  const properties = {
    root: { name: 'root node', rootNode: true },
    child1: { name: 'child 1', color: '#ffff00' },
    child2: { name: 'child 2', color: '#ff00ff' },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    await store.dispatch(saveCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { error: true, loading: false } });
    await store.dispatch(saveCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches a saved action when run correctly.', async () => {
    const store = mockStore({
      cellSets: {
        ...initialState, loading: false, hierarchy, properties,
      },
    });
    await store.dispatch(saveCellSets(experimentId));

    const firstAction = store.getActions()[0];

    expect(firstAction).toMatchObject({ type: CELL_SETS_SAVE, payload: { experimentId } });
  });

  it('Dispatches a notification when fetch fails.', async () => {
    const store = mockStore({
      cellSets: {
        ...initialState, loading: false, hierarchy, properties,
      },
    });

    fetchMock.resetMocks();
    fetchMock.mockReject(new Error('some weird error that happened'));
    await store.dispatch(saveCellSets(experimentId));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject(
      { type: NOTIFICATIONS_PUSH_MESSAGE, payload: { type: 'error' } },
    );
  });
});
