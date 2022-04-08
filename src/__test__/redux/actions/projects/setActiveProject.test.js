import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import setActiveProject from 'redux/actions/projects/setActiveProject';
import initialState, { projectTemplate } from 'redux/reducers/projects/initialState';

import { PROJECTS_SET_ACTIVE } from 'redux/actionTypes/projects';

const mockStore = configureStore([thunk]);

describe('setActiveProject action', () => {
  const activeProject = {
    ...projectTemplate,
    name: 'project 1',
    uuid: '12345',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
  };

  const otherProject = {
    ...projectTemplate,
    name: 'project 2',
    uuid: '67890',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
  };

  const mockState = {
    projects: {
      ...initialState,
      ids: [...initialState.ids, activeProject.uuid, otherProject.uuid],
      meta: {
        ...initialState.meta,
        activeProjectUuid: activeProject.uuid,
      },
      [activeProject.uuid]: activeProject,
      [otherProject.uuid]: otherProject,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(mockState);
    await store.dispatch(setActiveProject(otherProject.uuid));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_SET_ACTIVE);
    expect(firstAction).toMatchSnapshot();
  });

  it('Does not dispatch if project is the same', async () => {
    const store = mockStore(mockState);
    await store.dispatch(setActiveProject(activeProject.uuid));

    expect(store.getActions().length).toEqual(0);
  });
});
