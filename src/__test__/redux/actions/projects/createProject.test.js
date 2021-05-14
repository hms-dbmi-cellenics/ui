import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createProject from '../../../../redux/actions/projects/createProject';
import initialState from '../../../../redux/reducers/projects';
import { saveProject } from '../../../../redux/actions/projects';

import { PROJECTS_CREATE } from '../../../../redux/actionTypes/projects';
import { EXPERIMENTS_CREATE } from '../../../../redux/actionTypes/experiments';

const mockStore = configureStore([thunk]);

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

describe('createProject action', () => {
  const mockProject = {
    ...initialState,
    name: 'test project',
    uuid: '12345',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore({
      projects: {},
    });
    await store.dispatch(createProject(mockProject.name, mockProject));

    const actions = store.getActions();

    // Create experiment in the first step
    expect(actions[0].type).toEqual(EXPERIMENTS_CREATE);
    expect(actions[1].type).toEqual(PROJECTS_CREATE);
  });
});
