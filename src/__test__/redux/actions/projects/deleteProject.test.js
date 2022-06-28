import _ from 'lodash';

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import deleteProject from 'redux/actions/projects/deleteProject';

import initialSampleState, { sampleTemplate } from 'redux/reducers/samples/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';

import {
  PROJECTS_DELETE, PROJECTS_SAVED, PROJECTS_SAVING, PROJECTS_SET_ACTIVE,
} from 'redux/actionTypes/projects';
import { EXPERIMENTS_DELETED } from 'redux/actionTypes/experiments';
import { SAMPLES_DELETE } from 'redux/actionTypes/samples';

jest.mock('config');

enableFetchMocks();

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

  beforeEach(async () => {
    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResponse(JSON.stringify({}));
  });

  it('Dispatches event correctly for one sample', async () => {
    const store = mockStore(initialStateUniSample);
    await store.dispatch(deleteProject(mockProjectUuid1));

    // Sets up loading state for saving project
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      PROJECTS_SAVING, SAMPLES_DELETE, EXPERIMENTS_DELETED, PROJECTS_DELETE, PROJECTS_SAVED,
    ]);
  });

  it('Dispatches event correctly for multiple samples', async () => {
    const store = mockStore(initialStateMultipleSamples);
    await store.dispatch(deleteProject(mockProjectUuid1));

    // Sets up loading state for saving project
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      PROJECTS_SAVING, SAMPLES_DELETE, EXPERIMENTS_DELETED, PROJECTS_DELETE, PROJECTS_SAVED,
    ]);
  });

  it('Switches to activeProjectUuid to another project if multiple project exists', async () => {
    const store = mockStore(initialStateMultipleProjects);
    await store.dispatch(deleteProject(mockProjectUuid1));

    // Sets up loading state for saving project
    const actions = store.getActions();
    expect(_.map(actions, 'type')).toEqual([
      PROJECTS_SAVING, PROJECTS_SET_ACTIVE, SAMPLES_DELETE,
      EXPERIMENTS_DELETED, PROJECTS_DELETE, PROJECTS_SAVED,
    ]);
  });

  it('Dispatches fetch correctly', async () => {
    const response = new Response(JSON.stringify({}));
    fetchMock.mockResolvedValueOnce(response);

    const store = mockStore(initialStateUniSample);
    await store.dispatch(deleteProject(mockProjectUuid1));

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:3000/v2/experiments/${mockProject.uuid}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });
});
