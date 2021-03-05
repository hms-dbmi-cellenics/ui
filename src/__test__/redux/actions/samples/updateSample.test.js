import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateSample from '../../../../redux/actions/samples/updateSample';
import initialState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';

import { SAMPLES_UPDATE } from '../../../../redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

describe('updateSample action', () => {
  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: '12345',
  };

  const updatedSample = {
    ...mockSample,
    name: 'updated name',
  };

  const mockState = {
    samples: {
      ...initialState,
      ids: [...initialState.ids, mockSample.uuid],
      [mockSample.uuid]: mockSample,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(updatedSample));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(SAMPLES_UPDATE);
    expect(firstAction).toMatchSnapshot();
  });

  it('Does not dispatch event if object contents are the same', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockSample));

    expect(store.getActions().length).toEqual(0);
  });
});
