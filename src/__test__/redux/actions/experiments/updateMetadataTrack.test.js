import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import updateMetadataTrack from 'redux/actions/experiments/updateMetadataTrack';
import initialExperimentState from 'redux/reducers/experiments';
import initialSampleState from 'redux/reducers/samples';

import {
  EXPERIMENTS_METADATA_UPDATE,
} from 'redux/actionTypes/experiments';
import '__test__/test-utils/setupTests';

import { SAMPLES_METADATA_DELETE, SAMPLES_UPDATE } from 'redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

const mockExperimentId = 'experiment-1234';
const mockSampleUuid = 'sample-1234';

const oldMetadataTrack = 'Old track';
const oldMetadataTrackKey = metadataNameToKey(oldMetadataTrack);

const newMetadataTrack = 'New track';
const newMetadataTrackKey = metadataNameToKey(newMetadataTrack);

const mockExperiment = {
  ...initialExperimentState,
  name: 'test experiment',
  id: mockExperimentId,
  createdDate: '01-01-2021',
  lastModified: '01-01-2021',
  metadataKeys: [oldMetadataTrackKey],
  sampleIds: [mockSampleUuid],
};

const mockSample = {
  ...initialSampleState,
  name: 'test sample',
  experimentId: mockExperimentId,
  uuid: mockSampleUuid,
  metadata: {
    [oldMetadataTrackKey]: 'value',
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

describe('updateMetadataTrack action', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore(initialState);

    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));

    await store.dispatch(
      updateMetadataTrack(oldMetadataTrack, newMetadataTrack, mockExperiment.id),
    );

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([EXPERIMENTS_METADATA_UPDATE, SAMPLES_UPDATE, SAMPLES_METADATA_DELETE]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockExperiment.id}/metadataTracks/${oldMetadataTrackKey}`,
      {
        body: JSON.stringify({ key: newMetadataTrackKey }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      },
    );
  });
});
