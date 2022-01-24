import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import waitForActions from 'redux-mock-store-await-actions';
import { waitFor } from '@testing-library/react';

import reorderCellSet from 'redux/actions/cellSets/reorderCellSet';
import { CELL_SETS_REORDER } from 'redux/actionTypes/cellSets';
import pushNotificationMessage from 'utils/pushNotificationMessage';

import initialState from 'redux/reducers/cellSets/initialState';

enableFetchMocks();
const mockStore = configureStore([thunk]);

describe('reorderCellSet action', () => {
  const experimentId = '1234';
  const rootKey = 'root';
  const cellSetKey = 'child';

  const cellSetsNodeState = {
    ...initialState,
    properties: {
      [rootKey]: {
        rootNode: true,
      },
      [cellSetKey]: {
        rootNode: false,
        parentNodeKey: rootKey,
      },
    },
  };

  const response = new Response(JSON.stringify({}));

  beforeEach(() => {
    jest.resetAllMocks();

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    fetchMock.mockResolvedValueOnce(response);

    const store = mockStore({ cellSets: { ...cellSetsNodeState, loading: false } });
    await store.dispatch(reorderCellSet(experimentId, cellSetKey, 5));

    // CELL_SETS_REORDER action is sent
    await waitForActions(store, [CELL_SETS_REORDER]);
    expect(store.getActions()[0]).toMatchSnapshot();

    // Fetch was called correctly
    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, body] = fetch.mock.calls[0];
    expect(url).toEqual('http://localhost:3000/v1/experiments/1234/cellSets');
    expect(body).toMatchSnapshot();
  });

  it('Does not dispatch on fetch error', async () => {
    fetchMock.mockRejectOnce(() => Promise.reject(new Error('Some error')));

    const store = mockStore({ cellSets: { ...cellSetsNodeState, loading: false } });
    await store.dispatch(reorderCellSet(experimentId, cellSetKey, 5));

    // ERROR notification is shown
    await waitFor(() => expect(pushNotificationMessage).toHaveBeenCalledTimes(1));
    const pushNotificationMessageParams = pushNotificationMessage.mock.calls[0];

    expect(pushNotificationMessageParams).toEqual(['error', 'We couldn\'t save your data.']);
  });
});
