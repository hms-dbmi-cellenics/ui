import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import renameMetadataTrack from 'redux/actions/experiments/renameMetadataTrack';
import initialExperimentState from 'redux/reducers/experiments';
import initialSampleState from 'redux/reducers/samples';

import { EXPERIMENTS_METADATA_RENAME } from 'redux/actionTypes/experiments';
import { BACKEND_STATUS_LOADED, BACKEND_STATUS_LOADING } from 'redux/actionTypes/backendStatus';

import { promiseResponse } from '__test__/test-utils/mockAPI';

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

describe('renameMetadataTrack action', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly', async () => {
    const store = mockStore(initialState);

    fetchMock.mockIf(/.*/, () => promiseResponse(JSON.stringify({})));

    await store.dispatch(
      renameMetadataTrack(oldMetadataTrack, newMetadataTrack, mockExperiment.id),
    );

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      EXPERIMENTS_METADATA_RENAME,
      BACKEND_STATUS_LOADING,
      BACKEND_STATUS_LOADED,
    ]);
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
