import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import updateCellSetHierarchy from '../../../../redux/actions/cellSets/updateCellSetHierarchy';
import initialState from '../../../../redux/reducers/cellSets/initialState';
import '__test__/test-utils/setupTests';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('updateCellSetHierarchy action', () => {
  const experimentId = '1234';
  const hierarchy = { key: 'root', children: [] };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    store.dispatch(updateCellSetHierarchy(experimentId, hierarchy));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    store.dispatch(updateCellSetHierarchy(experimentId, hierarchy));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to update hierarchy to the reducer', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    store.dispatch(updateCellSetHierarchy(experimentId, hierarchy));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });

  it('Last action dispatches cellSetSave event', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    store.dispatch(updateCellSetHierarchy(experimentId, hierarchy));

    const lastActionID = store.getActions().length - 1;
    const lastAction = store.getActions()[lastActionID];

    expect(lastAction).toMatchSnapshot();
  });
});
