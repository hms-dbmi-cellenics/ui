import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import updateMetadataTrack from 'redux/actions/experiments/updateMetadataTrack';
import initialProjectState from 'redux/reducers/projects';
import initialSampleState from 'redux/reducers/samples';

import {
  PROJECTS_METADATA_UPDATE,
} from 'redux/actionTypes/projects';
import '__test__/test-utils/setupTests';

import { SAMPLES_METADATA_DELETE, SAMPLES_UPDATE } from 'redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

const mockProjectUuid = 'project-1234';
const mockSampleUuid = 'sample-1234';

const oldMetadataTrack = 'Old track';
const oldMetadataTrackKey = metadataNameToKey(oldMetadataTrack);

const newMetadataTrack = 'New track';
const newMetadataTrackKey = metadataNameToKey(newMetadataTrack);

const mockProject = {
  ...initialProjectState,
  name: 'test project',
  uuid: mockProjectUuid,
  createdDate: '01-01-2021',
  lastModified: '01-01-2021',
  metadataKeys: [oldMetadataTrackKey],
  samples: [mockSampleUuid],
};

const mockSample = {
  ...initialSampleState,
  name: 'test sample',
  projectUuid: mockProjectUuid,
  uuid: mockSampleUuid,
  metadata: {
    [oldMetadataTrackKey]: 'value',
  },
};

const initialState = {
  projects: {
    ids: [mockProject.uuid],
    [mockProject.uuid]: mockProject,
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

    await store.dispatch(updateMetadataTrack(oldMetadataTrack, newMetadataTrack, mockProject.uuid));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([PROJECTS_METADATA_UPDATE, SAMPLES_UPDATE, SAMPLES_METADATA_DELETE]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockProject.uuid}/metadataTracks/${oldMetadataTrackKey}`,
      {
        body: JSON.stringify({ key: newMetadataTrackKey }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      },
    );
  });
});
