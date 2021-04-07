import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import deleteProject from '../../../../redux/actions/projects/deleteProject';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { SAMPLES_DELETE } from '../../../../redux/actionTypes/samples';
import { PROJECTS_DELETE, PROJECTS_SET_ACTIVE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('deleteProject action', () => {
  const mockSampleUuid1 = 'sample-1';
  const mockSampleUuid2 = 'sample-2';
  const mockProjectUuid1 = 'project-1';
  const mockProjectUuid2 = 'project-2';

  const mockSample = {
    ...sampleTemplate,
    name: 'test sample',
    projectUuid: mockProjectUuid1,
    uuid: mockSampleUuid1,
  };

  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: mockProjectUuid1,
    samples: [mockSampleUuid1],
  };

  const initialStateUniSample = {
    samples: {
      ...initialSampleState,
      ids: [mockSampleUuid1],
      [mockSampleUuid1]: mockSample,
    },
    projects: {
      ...initialProjectState,
      ids: [mockProjectUuid1],
      [mockProjectUuid1]: mockProject,
    },
  };

  const initialStateMultipleSamples = {
    samples: {
      ...initialSampleState,
      ids: [mockSampleUuid1],
      [mockSampleUuid1]: mockSample,
      [mockSampleUuid2]: {
        mockSample,
        uuid: mockSampleUuid2,
      },
    },
    projects: {
      ...initialProjectState,
      ids: [mockProjectUuid1],
      [mockProjectUuid1]: {
        ...mockProject,
        samples: [
          ...mockProject.samples,
          mockSampleUuid2,
        ],
      },
    },
  };

  const initialStateMultipleProjects = {
    projects: {
      ...initialProjectState,
      meta: { activeProjectUuid: mockProjectUuid1 },
      ids: [mockProjectUuid1, mockProjectUuid2],
      [mockProjectUuid1]: mockProject,
      [mockProjectUuid2]: {
        ...mockProject,
        uuid: mockProjectUuid2,
      },
    },
  };

  it('Dispatches event correctly for one sample', async () => {
    const store = mockStore(initialStateUniSample);
    await store.dispatch(deleteProject(mockProjectUuid1));

    // Delete sample
    const action1 = store.getActions()[0];
    expect(action1.type).toEqual(SAMPLES_DELETE);

    // Delete project
    const action2 = store.getActions()[1];
    expect(action2.type).toEqual(PROJECTS_DELETE);
  });

  it('Dispatches event correctly for multiple samples', async () => {
    const store = mockStore(initialStateMultipleSamples);
    await store.dispatch(deleteProject(mockProjectUuid1));

    // Delete samples 1 and 2
    const action1 = store.getActions()[0];
    expect(action1.type).toEqual(SAMPLES_DELETE);

    // Delete project
    const action3 = store.getActions()[1];
    expect(action3.type).toEqual(PROJECTS_DELETE);
  });

  it('Switches to activeProjectUuid to another project if multiple project exists', async () => {
    const store = mockStore(initialStateMultipleProjects);
    await store.dispatch(deleteProject(mockProjectUuid1));

    // Delete sample
    const action1 = store.getActions()[0];
    expect(action1.type).toEqual(SAMPLES_DELETE);

    // Delete project
    const action2 = store.getActions()[1];
    expect(action2.type).toEqual(PROJECTS_DELETE);

    // Switch active proejct
    const action3 = store.getActions()[2];
    expect(action3.type).toEqual(PROJECTS_SET_ACTIVE);
  });
});
