import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import updateCellInfo from 'redux/actions/cellInfo/updateCellInfo';
import { CELL_INFO_UPDATE } from 'redux/actionTypes/cellInfo';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('updateCellInfo action', () => {
  const updatePayload = {
    cellId: 'C1',
    geneName: 'G1',
    expression: 1,
    componentType: 'heatmap',
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Fetches gene data from API', async () => {
    const store = mockStore({ cellSets: { loading: true, error: false } });

    store.dispatch(updateCellInfo(updatePayload));

    expect(store.getActions().length).toEqual(1);

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(CELL_INFO_UPDATE);
    expect(firstAction.payload).toEqual(updatePayload);
  });
});
