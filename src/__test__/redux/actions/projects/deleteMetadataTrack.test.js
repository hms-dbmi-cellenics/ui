import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { metadataNameToKey } from 'utils/data-management/metadataUtils';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import deleteMetadataTrack from 'redux/actions/projects/deleteMetadataTrack';
import initialProjectState from 'redux/reducers/projects';
import initialSampleState from 'redux/reducers/samples';

import { saveProject } from 'redux/actions/projects';
import { saveSamples } from 'redux/actions/samples';
import '__test__/test-utils/setupTests';

import {
  PROJECTS_METADATA_DELETE,
} from 'redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

jest.mock('redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

describe('deleteMetadataTrack action', () => {
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

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(deleteMetadataTrack(metadataTrack, mockProject.uuid));

    const actions = store.getActions();

    // It fires save project and save samples
    expect(saveProject).toHaveBeenCalled();
    expect(saveSamples).toHaveBeenCalled();

    // It deletes metadata in samples
    expect(actions[0].type).toEqual(PROJECTS_METADATA_DELETE);
  });

  it('Does not update metadata if save fails', async () => {
    saveProject.mockImplementation(() => async () => { throw new Error('some weird error'); });

    const store = mockStore(initialState);
    await store.dispatch(deleteMetadataTrack(metadataTrack, mockProject.uuid));

    // It fires save project and save samples
    expect(saveProject).toHaveBeenCalled();
    expect(saveSamples).toHaveBeenCalled();

    // It fires project error
    // Expect there is a notification
    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});
