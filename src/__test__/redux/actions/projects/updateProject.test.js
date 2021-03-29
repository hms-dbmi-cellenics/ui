import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateProject from '../../../../redux/actions/projects/updateProject';
import initialState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';

import { PROJECTS_UPDATE } from '../../../../redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('updateProject action', () => {
  const mockUuid = 'abc123';

  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: mockUuid,
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
    await store.dispatch(updateProject(mockUuid, updatedProject));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_UPDATE);
  });

  it('Updates the lastModified field', async () => {
    const originalModifiedDate = updatedProject.lastModified;
    const store = mockStore(mockState);
    await store.dispatch(updateProject(mockUuid, updatedProject));

    const { project } = store.getActions()[0].payload;
    expect(project.lastModified).not.toEqual(originalModifiedDate);
    expect(_.omit(project, 'lastModified')).toEqual(_.omit(updatedProject, 'lastModified'));
  });

  it('Does not dispatch event if object contents are the same', async () => {
    const store = mockStore(mockState);
    await store.dispatch(updateProject(mockUuid, mockProject));

    expect(store.getActions().length).toEqual(0);
  });
});
