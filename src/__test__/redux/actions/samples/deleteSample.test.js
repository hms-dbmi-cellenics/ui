import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import deleteSamples from '../../../../redux/actions/samples/deleteSamples';
import initialSampleState, { sampleTemplate } from '../../../../redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { saveProject } from '../../../../redux/actions/projects';
import { SAMPLES_DELETE, SAMPLES_SAVED, SAMPLES_SAVING } from '../../../../redux/actionTypes/samples';
import { PROJECTS_UPDATE } from '../../../../redux/actionTypes/projects';
import { EXPERIMENTS_SAVED, EXPERIMENTS_SAVING, EXPERIMENTS_UPDATED } from '../../../../redux/actionTypes/experiments';

enableFetchMocks();

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

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
      [mockSampleUuid]: mockSample,
    },
    projects: {
      ...initialProjectState,
      ids: [mockProjectUuid],
      [mockProjectUuid]: mockProject,
    },
  };

  fetchMock.resetMocks();
  fetchMock.doMock();
  fetchMock.mockResolvedValue(new Response('{}'));

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(deleteSamples([mockSampleUuid]));

    // Sets up loading state for saving project
    const actions = store.getActions();

    expect(saveProject).toHaveBeenCalled();

    expect(actions[0].type).toEqual(SAMPLES_SAVING);

    // Update project
    expect(actions[1].type).toEqual(PROJECTS_UPDATE);

    // Delete sample
    expect(actions[2].type).toEqual(SAMPLES_DELETE);

    // Experiments being saved
    expect(actions[3].type).toEqual(EXPERIMENTS_SAVING);

    // Experiments received an update
    expect(actions[4].type).toEqual(EXPERIMENTS_UPDATED);

    // Experiment is no longer saving
    expect(actions[5].type).toEqual(EXPERIMENTS_SAVED);

    // Resolve loading state
    expect(actions[6].type).toEqual(SAMPLES_SAVED);
  });
});
