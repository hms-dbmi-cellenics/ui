import _ from 'lodash';
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
  });

  it('Updates the lastModified field', async () => {
    const originalModifiedDate = updatedSample.lastModified;
    const store = mockStore(mockState);
    await store.dispatch(updateSample(updatedSample));

    const { sample } = store.getActions()[0].payload;
    expect(sample.lastModified).not.toEqual(originalModifiedDate);
    expect(_.omit(sample, 'lastModified')).toEqual(_.omit(updatedSample, 'lastModified'));
  });

  it('Does not dispatch event if object contents are the same', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockSample));

    expect(store.getActions().length).toEqual(0);
  });
});
