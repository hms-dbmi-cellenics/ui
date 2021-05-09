import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { metadataNameToKey } from '../../../../utils/metadataUtils';
import deleteMetadataTrack from '../../../../redux/actions/projects/deleteMetadataTrack';
import initialProjectState from '../../../../redux/reducers/projects';
import initialSampleState from '../../../../redux/reducers/samples';

import { PROJECTS_METADATA_DELETE } from '../../../../redux/actionTypes/projects';
import { SAMPLES_METADATA_DELETE } from '../../../../redux/actionTypes/samples';

const mockStore = configureStore([thunk]);

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
    await store.dispatch(deleteMetadataTrack(metadataNameToKey(metadataTrack), mockProject.uuid));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_METADATA_DELETE);

    const secondAction = store.getActions()[1];
    expect(secondAction.type).toEqual(SAMPLES_METADATA_DELETE);
  });
});
