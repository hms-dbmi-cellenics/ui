import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import { EXPERIMENTS_SAVING, EXPERIMENTS_CREATED, EXPERIMENTS_SAVED } from 'redux/actionTypes/experiments';
import { createExperiment } from 'redux/actions/experiments';
import initialExperimentState from 'redux/reducers/experiments/initialState';
import initialProjectState, { projectTemplate } from 'redux/reducers/projects/initialState';

import '__test__/test-utils/setupTests';

const mockStore = configureStore([thunk]);

enableFetchMocks();

describe('createExperiment', () => {
  const projectUuid = 'project-1';

  const mockState = {
    projects: {
      ...initialProjectState,
      [projectUuid]: {
        ...projectTemplate,
        uuid: projectUuid,
        experiments: [],
      },
    },
    experiments: {
      ...initialExperimentState,
    },
  };

  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Dispatches action when called', async () => {
    const store = mockStore(mockState);
    await store.dispatch(createExperiment(projectUuid));

    const actions = store.getActions();

    expect(actions[0].type).toEqual(EXPERIMENTS_SAVING);
    expect(actions[1].type).toEqual(EXPERIMENTS_CREATED);
    expect(actions[2].type).toEqual(EXPERIMENTS_SAVED);

    expect(actions[1].payload).toMatchSnapshot();
  });
});
