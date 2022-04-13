import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateSample from 'redux/actions/samples/updateSample';
import initialState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import { saveSamples } from 'redux/actions/samples';

import { SAMPLES_UPDATE } from 'redux/actionTypes/samples';

jest.mock('redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

const mockStore = configureStore([thunk]);

describe('updateSample action', () => {
  const mockUuid = 'asd123';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    uuid: mockUuid,
  };

  const updatedSample = {
    ...mockSample,
    name: 'updated name',
  };

  const mockState = {
    samples: {
      ...initialState,
      [mockSample.uuid]: mockSample,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, updatedSample));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(SAMPLES_UPDATE);
  });

  it('Updates the lastModified field', async () => {
    const originalModifiedDate = mockSample.lastModified;
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, updatedSample));

    const { sample } = store.getActions()[0].payload;
    expect(sample.lastModified).not.toEqual(originalModifiedDate);
    expect(_.omit(sample, 'lastModified')).toEqual(_.omit(updatedSample, 'lastModified'));
  });

  it('Dispatches call to save sample', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateSample(mockUuid, updatedSample));

    expect(saveSamples).toHaveBeenCalled();
  });
});
