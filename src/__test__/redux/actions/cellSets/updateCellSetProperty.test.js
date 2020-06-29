import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import updateCellSetProperty from '../../../../redux/actions/cellSets/updateCellSetProperty';
import initialState from '../../../../redux/reducers/cellSetsReducer/initialState';
import { CELL_SETS_UPDATE_PROPERTY, CELL_SETS_SAVE } from '../../../../redux/actionTypes/cellSets';


enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('updateCellSetProperty action', () => {
  const experimentId = '1234';
  const key = 'root';
  const property = { name: 'Root node!' };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    await store.dispatch(updateCellSetProperty(experimentId, key, property));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    await store.dispatch(updateCellSetProperty(experimentId, key, property));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to update property to the reducer', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(updateCellSetProperty(experimentId, key, property));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchObject(
      { type: CELL_SETS_UPDATE_PROPERTY, payload: { dataUpdated: property, key, experimentId } },
    );
  });

  it('Last action dispatches cellSetSave event', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    await store.dispatch(updateCellSetProperty(experimentId, key, property));

    const lastActionID = store.getActions().length - 1;
    const lastAction = store.getActions()[lastActionID];

    expect(lastAction).toMatchObject({ type: CELL_SETS_SAVE, payload: { experimentId } });
  });
});
