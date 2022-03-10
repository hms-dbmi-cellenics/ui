import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import initialState from 'redux/reducers/backendStatus/initialState';
import updateBackendStatus from 'redux/actions/backendStatus/updateBackendStatus';
import { BACKEND_STATUS_UPDATED } from 'redux/actionTypes/backendStatus';

const mockStore = configureStore([thunk]);

describe('updateBackendStatus', () => {
  const experimentId = '1234';

  it('Dispatches the correct action', () => {
    const store = mockStore({ backendStatus: initialState });
    store.dispatch(updateBackendStatus(experimentId, { status: { gem2s: { status: 'Running' } } }));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(BACKEND_STATUS_UPDATED);
    expect(firstAction).toMatchSnapshot();
  });
});
