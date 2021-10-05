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
  PROJECTS_CREATE, PROJECTS_SAVING, PROJECTS_SAVED, PROJECTS_ERROR,
} from 'redux/actionTypes/projects';

// import endUserMessages from 'utils/endUserMessages';

const mockStore = configureStore([thunk]);

jest.mock('uuid');
const mockedProjectUuid = 'random-project-uuid';
uuidv4.mockImplementation(() => mockedProjectUuid);

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('../../../../redux/actions/experiments/createExperiment');
createExperiment.mockImplementation((projectUuid, projectName) => async () => ({
  name: projectName,
  uuid: projectUuid,
}));

jest.mock('../../../../utils/pushNotificationMessage');
pushNotificationMessage.mockImplementation(() => async () => { });

enableFetchMocks();

describe('createProject action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.doMock();

    jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-01').getTime());

    fetchMock.resetMocks();
    fetchMock.doMock();
  });

  const mockProjectName = 'test project';
  const mockProjectDescription = 'test project description';
  const mockExperimentName = 'mockExperimentName';

  const mockFetchErrorMessage = 'someFetchError';

  it('Works correctly when there are no errors', async () => {
    const store = mockStore({
      projects: initialProjectsState,
    });

    fetchMock.mockResponse(JSON.stringify({}), { url: 'mockedUrl', status: 200 });

    await store.dispatch(
      createProject(mockProjectName, mockProjectDescription, mockExperimentName),
    );

    expect(createExperiment).toHaveBeenCalledWith(mockedProjectUuid, mockExperimentName);

    const actions = store.getActions();

    expect(actions[0].type).toEqual(PROJECTS_SAVING);
    expect(actions[1].type).toEqual(PROJECTS_SAVED);
    expect(actions[2].type).toEqual(PROJECTS_CREATE);

    // Created project is correct
    expect(actions[2].payload).toMatchSnapshot();
  });

  it('Shows error message when there was a fetch error', async () => {
    const store = mockStore({
      projects: initialProjectsState,
    });

    fetchMock.mockResponse(JSON.stringify({ message: mockFetchErrorMessage }), { url: 'mockedUrl', status: 400 });

    await expect(
      store.dispatch(
        createProject(mockProjectName, mockProjectDescription, mockExperimentName),
      ),
    ).rejects.toEqual(mockFetchErrorMessage);

    const actions = store.getActions();

    expect(actions[0].type).toEqual(PROJECTS_SAVING);

    expect(actions[1].type).toEqual(PROJECTS_ERROR);

    expect(pushNotificationMessage).toHaveBeenCalled();
  });
});
