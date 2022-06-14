import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import deleteMetadataTrack from 'redux/actions/projects/deleteMetadataTrack';
import initialProjectState from 'redux/reducers/projects';
import initialSampleState from 'redux/reducers/samples';

import { saveProject } from 'redux/actions/projects';
import { saveSamples } from 'redux/actions/samples';
import '__test__/test-utils/setupTests';

import { PROJECTS_METADATA_DELETE } from 'redux/actionTypes/projects';
import { SAMPLES_METADATA_DELETE } from 'redux/actionTypes/samples';

import config from 'config';
import { api } from 'utils/constants';

jest.mock('config');

const mockStore = configureStore([thunk]);

jest.mock('redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

const mockProjectUuid = 'project-1234';
const mockSampleUuid = 'sample-1234';
const metadataTrack = 'Test';
const metadataTrackKey = metadataNameToKey(metadataTrack);

const mockProject = {
  ...initialProjectState,
  name: 'test project',
  uuid: mockProjectUuid,
  createdDate: '01-01-2021',
  lastModified: '01-01-2021',
  metadataKeys: [metadataTrackKey],
  samples: [mockSampleUuid],
};

const mockSample = {
  ...initialSampleState,
  name: 'test sample',
  projectUuid: mockProjectUuid,
  uuid: mockSampleUuid,
  metadata: {
    [metadataTrackKey]: 'value',
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

describe('deleteMetadataTrack action', () => {
  beforeEach(() => {
    enableFetchMocks();
    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  it('Works correctly in api v2', async () => {
    config.currentApiVersion = api.V2;

    const store = mockStore(initialState);

    fetchMock.mockResolvedValue(new Response(JSON.stringify({})));

    await store.dispatch(deleteMetadataTrack(metadataTrack, mockProject.uuid));

    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([PROJECTS_METADATA_DELETE, SAMPLES_METADATA_DELETE]);
    expect(_.map(actions, 'payload')).toMatchSnapshot();

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockProject.uuid}/metadataTracks/${metadataTrack}`,
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'DELETE',
      },
    );
  });

  it('Does not update metadata if save fails', async () => {
    saveProject.mockImplementation(() => async () => { throw new Error('some weird error'); });

    const store = mockStore(initialState);
    await store.dispatch(deleteMetadataTrack(metadataTrack, mockProject.uuid));

    const actions = store.getActions();
    expect(actions).toHaveLength(0);

    // It fires project error
    // Expect there is a notification
    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});
