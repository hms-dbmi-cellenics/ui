import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { PROJECTS_LOADED, PROJECTS_ERROR } from 'redux/actionTypes/projects';
import { projectTemplate } from 'redux/reducers/projects/initialState';
import { loadExperiments } from 'redux/actions/experiments';

import fake from '__test__/test-utils/constants';
import mockAPI, { generateDefaultMockAPIResponses } from '__test__/test-utils/mockAPI';

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('load projects ', () => {
  const initialState = {
    projects: {
      ...projectTemplate,
    },
  };

  beforeEach(() => {
    const mockAPIResponse = generateDefaultMockAPIResponses(fake.EXPERIMENT_ID);

    fetchMock.resetMocks();
    fetchMock.mockIf(/.*/, mockAPI(mockAPIResponse));

    jest.clearAllMocks();
  });

  it('Works correctly', async () => {
    const store = mockStore(initialState);

    await store.dispatch(loadExperiments());

    const actions = store.getActions();

    const lastAction = actions[actions.length - 1];
    expect(lastAction.type).toEqual(PROJECTS_LOADED);
    expect(lastAction.payload).toMatchSnapshot();
  });

  it('Dispatches error correctly', async () => {
    fetchMock.mockReject(new Error('Something went wrong :/'));
    const store = mockStore(initialState);
    await store.dispatch(loadExperiments());
    const action = store.getActions()[1];
    expect(action.type).toEqual(PROJECTS_ERROR);
  });
});
