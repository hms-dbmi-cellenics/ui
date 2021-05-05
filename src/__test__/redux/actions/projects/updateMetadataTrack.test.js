import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { metadataNameToKey } from '../../../../utils/metadataUtils';
import updateMetadataTrack from '../../../../redux/actions/projects/updateMetadataTrack';
import initialProjectState from '../../../../redux/reducers/projects';
import initialSampleState from '../../../../redux/reducers/samples';

import { PROJECTS_METADATA_UPDATE } from '../../../../redux/actionTypes/projects';
import { SAMPLES_METADATA_DELETE, SAMPLES_UPDATE } from '../../../../redux/actionTypes/samples';

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

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_METADATA_UPDATE);

    const secondAction = store.getActions()[1];
    expect(secondAction.type).toEqual(SAMPLES_UPDATE);

    const thirdAction = store.getActions()[2];
    expect(thirdAction.type).toEqual(SAMPLES_METADATA_DELETE);
  });
});
