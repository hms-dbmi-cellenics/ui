import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateProject from '../../../../redux/actions/projects/updateProject';
import initialState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { PROJECTS_UPDATE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('updateProject action', () => {
  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: '12345',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
  };

  const updatedProject = {
    ...mockProject,
    name: 'updated name',
    lastModified: '02-01-2021',
  };

  const mockState = {
    projects: {
      ...initialState,
      ids: [...initialState.ids, mockProject.uuid],
      [mockProject.uuid]: mockProject,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateProject(updatedProject));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_UPDATE);
    expect(firstAction).toMatchSnapshot();
  });

  it('Does not dispatch event if object contents are the same', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateProject(mockProject));

    expect(store.getActions().length).toEqual(0);
  });
});
