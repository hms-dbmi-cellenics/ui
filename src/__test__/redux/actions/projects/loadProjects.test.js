import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { PROJECTS_LOADED, PROJECTS_ERROR } from 'redux/actionTypes/projects';
import { projectTemplate } from 'redux/reducers/projects/initialState';
import { loadProjects } from 'redux/actions/projects';

import {
  experimentsListV1,
  experimentsListV2,
  experimentIds,
} from '__test__/test-utils/mockDataV2/experiment';

import { api } from 'utils/constants';
import config from 'config';

jest.mock('config');

enableFetchMocks();

const mockStore = configureStore([thunk]);

describe('load projects ', () => {
  const initialState = {
    projects: {
      ...projectTemplate,
    },
  };

  const response = JSON.stringify(
    [
      { name: 'I am project', samples: ['Best sample so far', 'and another one'] },
      { name: 'project am I', samples: ['tired of unit testing honestly'] },
    ],
  );

  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.doMock();

    jest.clearAllMocks();
  });

  it('Dispatches load action correctly', async () => {
    fetchMock.mockResolvedValue(response);
    fetchMock.mockResponse(response);

    const store = mockStore(initialState);
    await store.dispatch(loadProjects());
    const actions = store.getActions();
    const lastAction = actions[actions.length - 1];
    expect(lastAction.type).toEqual(PROJECTS_LOADED);
  });

  it('Dispatches error correctly', async () => {
    fetchMock.mockReject(new Error('Something went wrong :/'));
    const store = mockStore(initialState);
    await store.dispatch(loadProjects());
    const action = store.getActions()[1];
    expect(action.type).toEqual(PROJECTS_ERROR);
  });

  it('Works well with api v2', async () => {
    config.currentApiVersion = api.V2;

    fetchMock.mockResponse(JSON.stringify(experimentsListV2));
    const store = mockStore(initialState);

    await store.dispatch(loadProjects());

    const actions = store.getActions();

    const lastAction = actions[actions.length - 1];
    expect(lastAction.type).toEqual(PROJECTS_LOADED);
    expect(lastAction.payload.projects).toEqual(experimentsListV1);
    expect(lastAction.payload.ids).toEqual(experimentIds);
  });

  it('Dispatches error correctly with api v2', async () => {
    config.currentApiVersion = api.V2;

    fetchMock.mockReject(new Error('Something went wrong :/'));
    const store = mockStore(initialState);
    await store.dispatch(loadProjects());
    const action = store.getActions()[1];
    expect(action.type).toEqual(PROJECTS_ERROR);
  });
});
