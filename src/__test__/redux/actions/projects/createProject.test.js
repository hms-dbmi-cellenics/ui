import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createProject from '../../../../redux/actions/projects/createProject';
import initialState from '../../../../redux/reducers/projects';
import { saveProject } from '../../../../redux/actions/projects';

import { PROJECTS_CREATE } from '../../../../redux/actionTypes/projects';

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
    const store = mockStore(initialState);
    await store.dispatch(createProject(mockProject));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_CREATE);
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
