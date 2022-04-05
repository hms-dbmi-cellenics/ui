import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock, { enableFetchMocks } from 'jest-fetch-mock';
import { PROJECTS_LOADED, PROJECTS_ERROR } from 'redux/actionTypes/projects';
import { projectTemplate } from 'redux/reducers/projects/initialState';
import { loadProjects } from 'redux/actions/projects';

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

  fetchMock.resetMocks();
  fetchMock.doMock();
  fetchMock.mockResolvedValue(response);
  fetchMock.mockResponse(response);

  it('Dispatches load action correctly', async () => {
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
});
