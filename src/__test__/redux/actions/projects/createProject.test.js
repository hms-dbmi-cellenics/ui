import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';

import handleError from 'utils/http/handleError';
import createProject from 'redux/actions/projects/createProject';
import initialProjectsState from 'redux/reducers/projects';

import { createExperiment } from 'redux/actions/experiments';
import {
  PROJECTS_CREATE, PROJECTS_SAVING, PROJECTS_ERROR,
} from 'redux/actionTypes/projects';
import '__test__/test-utils/setupTests';

jest.mock('utils/http/handleError');

const mockStore = configureStore([thunk]);

const experimentId = 'random-experiment-uuid';
jest.mock('redux/actions/experiments/createExperiment');
createExperiment.mockImplementation(() => async () => (experimentId));

enableFetchMocks();

describe('createProject action', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());

    fetchMock.resetMocks();
    fetchMock.doMock();

    store = mockStore({
      projects: initialProjectsState,
    });
  });

  const projectName = 'test project';
  const projectDescription = 'test project description';
  const experimentName = 'mockExperimentName';

  it('Creates a project when there are no errors', async () => {
    fetchMock.mockResponse(JSON.stringify({}));

    await store.dispatch(
      createProject(projectName, projectDescription, experimentName),
    );

    expect(createExperiment).toHaveBeenCalledWith(experimentName, projectDescription);

    // Sends correct actions
    const actions = store.getActions();
    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_CREATE);

    // No other action was sent
    expect(actions).toHaveLength(2);

    expect(actions[1].payload).toMatchSnapshot();
  });

  it('Shows error when there was an experiment error', async () => {
    const fetchErrorMessage = 'some error';

    createExperiment.mockImplementationOnce(() => { throw new Error(fetchErrorMessage); });

    await store.dispatch(
      createProject(projectName, projectDescription, experimentName),
    );

    expect(createExperiment).toHaveBeenCalledWith(experimentName, projectDescription);

    // Sends correct actions
    const actions = store.getActions();

    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_ERROR);

    // Check no other action was sent
    expect(actions).toHaveLength(2);

    expect(handleError).toHaveBeenCalledTimes(1);
  });
});
