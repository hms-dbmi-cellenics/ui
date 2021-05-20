import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import createMetadataTrack from '../../../../redux/actions/projects/createMetadataTrack';
import initialProjectState, { projectTemplate } from '../../../../redux/reducers/projects/initialState';
import {
  PROJECTS_METADATA_CREATE,
} from '../../../../redux/actionTypes/projects';
import { saveProject } from '../../../../redux/actions/projects';
import { NOTIFICATIONS_PUSH_MESSAGE } from '../../../../redux/actionTypes/notifications';

const mockStore = configureStore([thunk]);

jest.mock('../../../../redux/actions/projects/saveProject');
saveProject.mockImplementation(() => async () => { });

describe('createMetadataTrack action', () => {
  const mockProject = {
    ...projectTemplate,
    name: 'test project',
    uuid: '12345',
    createdDate: '01-01-2021',
    lastModified: '01-01-2021',
  };

  const initialState = {
    ...initialProjectState,
    projects: {
      ids: [mockProject.uuid],
      [mockProject.uuid]: mockProject,
    },
  };

  it('Dispatches event correctly', async () => {
    const store = mockStore(initialState);
    await store.dispatch(createMetadataTrack('Test track', mockProject.uuid));

    const actions = store.getActions();

    expect(saveProject).toHaveBeenCalled();

    // It creates the new metadata
    expect(actions[0].type).toEqual(PROJECTS_METADATA_CREATE);
  });

  it('Does not create metadata if save fails', async () => {
    saveProject.mockImplementation(() => async () => { throw new Error('some weird error'); });

    const store = mockStore(initialState);
    await store.dispatch(createMetadataTrack('Test track', mockProject.uuid));

    const actions = store.getActions();

    // It fires saves project
    expect(saveProject).toHaveBeenCalled();

    // Expect there is a notification
    expect(actions[0].type).toEqual(NOTIFICATIONS_PUSH_MESSAGE);

    // And there is no other actions
    expect(actions.length).toEqual(1);
  });
});
