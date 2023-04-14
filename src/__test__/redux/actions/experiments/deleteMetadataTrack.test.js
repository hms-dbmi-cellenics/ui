import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import deleteMetadataTrack from 'redux/actions/experiments/deleteMetadataTrack';
import initialExperimentState from 'redux/reducers/experiments';
import initialSampleState from 'redux/reducers/samples';

import { EXPERIMENTS_METADATA_DELETE } from 'redux/actionTypes/experiments';
import { SAMPLES_METADATA_DELETE } from 'redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

const mockExperimentId = 'experiment-1234';
const mockSampleUuid = 'sample-1234';
const metadataTrack = 'Test';
const metadataTrackKey = metadataNameToKey(metadataTrack);

const mockExperiment = {
  ...initialExperimentState,
  name: 'test experiment',
  id: mockExperimentId,
  createdAt: '01-01-2021',
  updatedAt: '01-01-2021',
  metadataKeys: [metadataTrackKey],
  sampleIds: [mockSampleUuid],
};

const mockSample = {
  ...initialSampleState,
  name: 'test sample',
  experimentId: mockExperimentId,
  uuid: mockSampleUuid,
  metadata: {
    [metadataTrackKey]: 'value',
  },
};

const initialState = {
  experiments: {
    ids: [mockExperiment.id],
    [mockExperiment.id]: mockExperiment,
  },
  samples: {
    ids: [mockSample.uuid],
    [mockSample.uuid]: mockSample,
  },
};

describe('deleteMetadataTrack action', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore(initialState);

    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));

    await store.dispatch(deleteMetadataTrack(metadataTrack, mockExperiment.id));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([EXPERIMENTS_METADATA_DELETE, SAMPLES_METADATA_DELETE]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockExperiment.id}/metadataTracks/${metadataTrack}`,
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      },
    );
  });

  it('Does not update metadata if save fails', async () => {
    const store = mockStore(initialState);
    await store.dispatch(deleteMetadataTrack(metadataTrack, mockExperiment.id));

    const actions = store.getActions();
    expect(actions).toHaveLength(0);

    // It fires project error
    // Expect there is a notification
    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});
