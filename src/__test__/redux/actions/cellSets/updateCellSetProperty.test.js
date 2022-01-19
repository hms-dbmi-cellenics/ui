import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import waitForActions from 'redux-mock-store-await-actions';

import updateCellSetProperty from 'redux/actions/cellSets/updateCellSetProperty';

import { CELL_SETS_UPDATE_PROPERTY } from 'redux/actionTypes/cellSets';
import initialState from 'redux/reducers/cellSets/initialState';

import '__test__/test-utils/setupTests';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('updateCellSetProperty action', () => {
  const experimentId = '1234';
  const key = 'node';
  const property = { name: 'Some node!' };

  const cellSetsState = {
    ...initialState,
    properties: {
      [key]: {
        rootNode: false,
        parentNodeKey: 'someParentNodeKey',
      },
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Does not dispatch on loading state', async () => {
    const store = mockStore({ cellSets: { ...cellSetsState, loading: true, error: false } });
    store.dispatch(updateCellSetProperty(experimentId, key, property));

    expect(store.getActions().length).toEqual(0);
  });

  it('Does not dispatch on error state', async () => {
    const store = mockStore({ cellSets: { ...cellSetsState, loading: false, error: true } });
    store.dispatch(updateCellSetProperty(experimentId, key, property));
    expect(store.getActions().length).toEqual(0);
  });

  it('Dispatches an action to update property to the reducer', async () => {
    const store = mockStore({ cellSets: { ...cellSetsState, loading: false } });
    store.dispatch(updateCellSetProperty(experimentId, key, property));

    await waitForActions(store, [CELL_SETS_UPDATE_PROPERTY]);

    const firstAction = store.getActions()[0];
    expect(firstAction).toMatchSnapshot();
  });
});
