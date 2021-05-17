import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
// import { enableFetchMocks } from 'jest-fetch-mock';
import createProject from '../../../../redux/actions/projects/createProject';
import initialState from '../../../../redux/reducers/projects';
import { saveProject } from '../../../../redux/actions/projects';
import { createExperiment } from '../../../../redux/actions/experiments';
import { PROJECTS_CREATE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);
// enableFetchMocks();

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

jest.mock('../../../../redux/actions/experiments/createExperiment');
createExperiment.mockImplementation(() => async () => ({
  name: 'New project',
  uuid: 'new-project',
}));

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

    // And then create and save projects
    expect(actions[0].type).toEqual(PROJECTS_CREATE);
  });

  it('Dispatches call to save project', async () => {
    const store = mockStore({
      projects: {
        [initialState.uuid]: initialState,
      },
    });
    await store.dispatch(createProject(mockProject));

    expect(saveProject).toHaveBeenCalled();
  });
});
