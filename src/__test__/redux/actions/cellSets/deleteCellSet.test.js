import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import deleteCellSet from '../../../../redux/actions/cellSets/deleteCellSet';
import initialState from '../../../../redux/reducers/cellSetsReducer/initialState';
import { CELL_SETS_DELETE, CELL_SETS_SAVE } from '../../../../redux/actionTypes/cellSets';


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
    await store.dispatch(deleteCellSet(experimentId, key));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    await store.dispatch(deleteCellSet(experimentId, key));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to delete cell set to the reducer', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(deleteCellSet(experimentId, key));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject({ type: CELL_SETS_DELETE, payload: { key, experimentId } });
  });

  it('Last action dispatches cellSetSave event', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(deleteCellSet(experimentId, key));

    const lastActionID = store.getActions().length - 1;
    const lastAction = store.getActions()[lastActionID];

    expect(lastAction).toMatchObject({ type: CELL_SETS_SAVE, payload: { experimentId } });
  });
});
