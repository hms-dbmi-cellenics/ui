import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import createProject from '../../../../redux/actions/projects/createProject';
import { PROJECTS_CREATE, PROJECTS_SAVING, PROJECTS_SAVED } from '../../../../redux/actionTypes/projects';

import createExperiment from '../../../../redux/actions/experiments/createExperiment';

jest.mock('../../../../redux/actions/experiments/createExperiment');

jest.mock('localforage');

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('createProject action', () => {
  beforeEach(() => {
    const response = new Response(JSON.stringify({}));

    fetchMock.resetMocks();
    fetchMock.doMock();
    fetchMock.mockResolvedValueOnce(response);
  });

  it('Runs correctly', async () => {
    const store = mockStore({
      projects: {},
    });

    const mockProjectName = 'projName';
    const mockProjectDescription = 'projDescript';
    const mockExperimentId = 'expId';

    createExperiment.mockImplementation(() => async () => ({ id: mockExperimentId }));

    await store.dispatch(createProject(mockProjectName, mockProjectDescription, mockExperimentId));

    // Calls create experiment in the beginning
    expect(createExperiment).toHaveBeenCalled();

    const actions = store.getActions();

    // Dispatches projects saving action
    expect(actions[0].type).toEqual(PROJECTS_SAVING);

    // Dispatches projects save action
    expect(actions[1].type).toEqual(PROJECTS_SAVED);

    // Dispatches projects create action
    expect(actions[2].type).toEqual(PROJECTS_CREATE);

    // Fetch call is made
    const fetchMockFirstCall = fetchMock.mock.calls[0];

    expect(fetchMockFirstCall[0]).toMatch(/http:\/\/localhost:3000\/v1\/projects\/*/);

    const { body: fetchBody, method: fetchMethod } = fetchMockFirstCall[1];

    expect(fetchMethod).toEqual('POST');
    expect(JSON.parse(fetchBody)).toEqual(expect.objectContaining({
      name: mockProjectName,
      description: mockProjectDescription,
      experiments: [mockExperimentId],
    }));
  });
});
