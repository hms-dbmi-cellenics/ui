import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { v4 as uuidv4 } from 'uuid';
import pushNotificationMessage from 'utils/pushNotificationMessage';
import createProject from 'redux/actions/projects/createProject';
import initialProjectsState from 'redux/reducers/projects';
import { saveProject } from 'redux/actions/projects';
import { createExperiment } from 'redux/actions/experiments';
import {
  PROJECTS_CREATE, PROJECTS_SAVING, PROJECTS_ERROR,
} from 'redux/actionTypes/projects';
import '__test__/test-utils/setupTests';

import { api } from 'utils/constants';

import config from 'config';
import endUserMessages from 'utils/endUserMessages';

jest.mock('config');

const mockStore = configureStore([thunk]);

jest.mock('uuid');
const projectUuid = 'random-project-uuid';
uuidv4.mockImplementation(() => projectUuid);

jest.mock('redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

const experimentId = 'random-experiment-uuid';
jest.mock('redux/actions/experiments/createExperiment');
createExperiment.mockImplementation((uuid, name) => async () => ({
  name,
  projectUuid: uuid,
  id: experimentId,
}));

pushNotificationMessage.mockImplementation(() => async () => { });

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

  it('Works correctly when there are no errors', async () => {
    config.currentApiVersion = api.V1;

    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    await store.dispatch(
      createProject(projectName, projectDescription, experimentName),
    );

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];
    expect(fetchMockFirstCall[0]).toEqual(`http://localhost:3000/v1/projects/${projectUuid}`);

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toMatchSnapshot();

    expect(createExperiment).toHaveBeenCalledWith(projectUuid, experimentName);

    const actions = store.getActions();

    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_CREATE);

    // Created project is correct
    expect(actions[1].payload).toMatchSnapshot();
  });

  it('Still creates project when using v2', async () => {
    config.currentApiVersion = api.V2;

    await store.dispatch(
      createProject(projectName, projectDescription, experimentName),
    );

    expect(createExperiment).toHaveBeenCalledWith(projectUuid, experimentName);

    // Sends correct actions
    const actions = store.getActions();
    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_CREATE);

    // No other action was sent
    expect(actions).toHaveLength(2);

    expect(actions[1].payload).toMatchSnapshot();
  });

  it('Shows error message when there was a fetch error', async () => {
    config.currentApiVersion = api.V1;

    const fetchErrorMessage = endUserMessages.ERROR_CREATING_PROJECT;

    fetchMock.mockResponse(JSON.stringify({ message: fetchErrorMessage }), { url: 'mockedUrl', status: 400 });

    // Fails with error message we sent in response to fetch
    await store.dispatch(
      createProject(projectName, projectDescription, experimentName),
    );

    // Sends correct actions
    const actions = store.getActions();

    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_ERROR);

    // Check no other action was sent
    expect(actions).toHaveLength(2);

    expect(pushNotificationMessage).toHaveBeenCalledWith('error', fetchErrorMessage);
  });
});
