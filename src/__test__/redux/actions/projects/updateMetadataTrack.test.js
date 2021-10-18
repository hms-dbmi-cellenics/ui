import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { metadataNameToKey } from '../../../../utils/data-management/metadataUtils';
import updateMetadataTrack from '../../../../redux/actions/projects/updateMetadataTrack';
import initialProjectState from '../../../../redux/reducers/projects';
import initialSampleState from '../../../../redux/reducers/samples';

import { saveProject } from '../../../../redux/actions/projects';
import { saveSamples } from '../../../../redux/actions/samples';

import {
  PROJECTS_METADATA_UPDATE,
} from '../../../../redux/actionTypes/projects';
import pushNotificationMessage from '../../../../utils/pushNotificationMessage';
import '__test__/test-utils/setupTests';

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('../../../../redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

const mockStore = configureStore([thunk]);

describe('updateMetadataTrack action', () => {
  const mockProjectUuid = 'project-1234';
  const mockSampleUuid = 'sample-1234';

  const oldMetadataTrack = 'Old track';
  const oldMetadataTrackKey = metadataNameToKey(oldMetadataTrack);

  const newMetadataTrack = 'New track';

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

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(updateMetadataTrack(
      oldMetadataTrack,
      newMetadataTrack,
      mockProject.uuid,
    ));

    const actions = store.getActions();

    // It fires save project and save samples
    expect(saveProject).toHaveBeenCalled();
    expect(saveSamples).toHaveBeenCalled();

    // It creates the new metadata
    expect(actions[0].type).toEqual(PROJECTS_METADATA_UPDATE);
  });

  it('Does not update metadata if save fails', async () => {
    const store = mockStore(initialState);

    saveProject.mockImplementation(() => async () => { throw new Error('some weird error'); });

    await store.dispatch(updateMetadataTrack(
      oldMetadataTrack,
      newMetadataTrack,
      mockProject.uuid,
    ));

    // It fires saves project
    expect(saveProject).toHaveBeenCalled();

    // Expect there is a notification
    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});
