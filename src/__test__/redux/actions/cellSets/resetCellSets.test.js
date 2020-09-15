import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import resetCellSets from '../../../../redux/actions/cellSets/resetCellSets';
import initialState from '../../../../redux/reducers/cellSets/initialState';
import sendWork from '../../../../utils/sendWork';

enableFetchMocks();
const mockStore = configureStore([thunk]);
jest.mock('../../../../utils/sendWork', () => ({
  __esModule: true, // this property makes it work
  default: jest.fn(),
}));

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

  it('Dispatches all required actions to reset cell sets.', async (done) => {
    const store = mockStore({ cellSets: { ...initialState, loading: false } });
    sendWork.mockImplementation(() => {
      const resolveWith = {
        results:
          [
            {
              body: JSON.stringify({
                name: 'one', color: '#ff0000', cellIds: ['1', '2', '3'],
              }),
            },
          ],
      };

      return new Promise((resolve) => resolve(resolveWith));
    });

    const flushPromises = () => new Promise(setImmediate);

    store.dispatch(resetCellSets(experimentId));

    expect(sendWork).toHaveBeenCalledTimes(1);
    expect(sendWork).toHaveBeenCalledWith(experimentId, 30, {
      name: 'ClusterCells',
      cellSetName: 'Louvain clusters',
      type: 'louvain',
      cellSetKey: 'louvain',
      params: {},
    });

    await flushPromises();

    const loadingAction = store.getActions()[0];
    expect(loadingAction).toMatchSnapshot();

    const loadedAction = store.getActions()[1];
    expect(loadedAction).toMatchSnapshot();

    const savedAction = store.getActions()[2];
    expect(savedAction).toMatchSnapshot();
    done();
  });
});
