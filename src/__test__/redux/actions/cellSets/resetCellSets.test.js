import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import resetCellSets from '../../../../redux/actions/cellSets/resetCellSets';
import initialState from '../../../../redux/reducers/cellSets/initialState';

jest.mock('localforage');

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('resetCellSets action', () => {
  const experimentId = '1234';

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });
    store.dispatch(resetCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { loading: false, error: true } });
    store.dispatch(resetCellSets(experimentId));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches a loading action first.', async () => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    store.dispatch(resetCellSets(experimentId));

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
