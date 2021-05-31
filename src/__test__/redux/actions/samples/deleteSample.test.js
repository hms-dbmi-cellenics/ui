import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import deleteSamples from '../../../../redux/actions/samples/deleteSamples';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { saveProject } from '../../../../redux/actions/projects';
import { saveSamples } from '../../../../redux/actions/samples';

import { SAMPLES_DELETE, SAMPLES_SAVED } from '../../../../redux/actionTypes/samples';
import { PROJECTS_UPDATE } from '../../../../redux/actionTypes/projects';

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('../../../../redux/actions/samples/saveSamples');
saveSamples.mockImplementation(() => async () => { });

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
    await store.dispatch(deleteSamples(mockSampleUuid));

    // Sets up loading state for saving project
    const actions = store.getActions();

    expect(saveSamples).toHaveBeenCalled();
    expect(saveProject).toHaveBeenCalled();

    // Delete sample
    expect(actions[1].type).toEqual(SAMPLES_DELETE);

    // Delete project
    expect(actions[2].type).toEqual(PROJECTS_UPDATE);

    // Resolve loading state
    expect(actions[3].type).toEqual(SAMPLES_SAVED);
  });
});
