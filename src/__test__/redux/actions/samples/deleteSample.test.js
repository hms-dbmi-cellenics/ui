import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import deleteSample from '../../../../redux/actions/samples/deleteSample';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { SAMPLES_DELETE } from '../../../../redux/actionTypes/samples';
import { PROJECTS_UPDATE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('deleteSample action', () => {
  const mockSampleUuid = 'sample-1';
  const mockProjectUuid = 'project-1';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    projectUuid: mockProjectUuid,
    uuid: mockSampleUuid,
  };

  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: mockProjectUuid,
    samples: [mockSampleUuid],
  };

  const initialState = {
    samples: {
      ...initialSampleState,
      ids: [mockSampleUuid],
      [mockSampleUuid]: mockSample,
    },
    projects: {
      ...initialProjectState,
      ids: [mockProjectUuid],
      [mockProjectUuid]: mockProject,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(deleteSample(mockSampleUuid));

    // Create sample
    const action1 = store.getActions()[0];
    expect(action1.type).toEqual(SAMPLES_DELETE);

    // Update project.samples
    const action2 = store.getActions()[1];
    expect(action2.type).toEqual(PROJECTS_UPDATE);
  });
});
