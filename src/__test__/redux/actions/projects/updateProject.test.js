import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import updateProject from 'redux/actions/projects/updateProject';
import initialState, { projectTemplate } from 'redux/reducers/projects/initialState';
import { saveProject } from 'redux/actions/projects';

import { PROJECTS_UPDATE } from 'redux/actionTypes/projects';

jest.mock('redux/actions/projects/saveProject');

saveProject.mockImplementation(() => async () => { });
const mockStore = configureStore([thunk]);

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

let store = null;

describe('updateProject action', () => {
  beforeEach(() => {
    store = mockStore(mockState);
  });

  it('Dispatches event correctly', async () => {
    await store.dispatch(updateProject(mockUuid, updatedProject));

    const firstAction = store.getActions()[0];
    expect(firstAction.type).toEqual(PROJECTS_UPDATE);
  });

  it('Updates the lastModified field', async () => {
    const originalModifiedDate = updatedProject.lastModified;
    await store.dispatch(updateProject(mockUuid, updatedProject));

    const { diff } = store.getActions()[0].payload;
    expect(diff.lastModified).not.toEqual(originalModifiedDate);
    expect(_.omit(diff, 'lastModified')).toEqual(_.omit(updatedProject, 'lastModified'));
  });

  it('Dispatches call to save project', async () => {
    store = mockStore({
      projects: {
        [initialState.uuid]: initialState,
      },
    });
    await store.dispatch(saveProject(mockProject));

    expect(saveProject).toHaveBeenCalled();
  });
});
