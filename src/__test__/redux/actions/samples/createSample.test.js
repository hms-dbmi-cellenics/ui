import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createSample from '../../../../redux/actions/samples/createSample';
import initialState from '../../../../redux/reducers/samples';

import { SAMPLES_CREATE } from '../../../../redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

describe('createSample action', () => {
  const mockSample = {
    ...initialState,
    name: 'test sample',
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(createSample(mockSample));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(SAMPLES_CREATE);
  });
});
