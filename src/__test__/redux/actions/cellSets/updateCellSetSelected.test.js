import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import updateCellSetSelected from '../../../../redux/actions/cellSets/updateCellSetSelected';
import initialState from '../../../../redux/reducers/cellSetsReducer/initialState';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('updateCellSetSelected action', () => {
  const experimentId = '1234';
  const keys = [1, 3, 4, 5];

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    store.dispatch(updateCellSetSelected(experimentId, keys));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    store.dispatch(updateCellSetSelected(experimentId, keys));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to update property to the reducer', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    store.dispatch(updateCellSetSelected(experimentId, keys));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
